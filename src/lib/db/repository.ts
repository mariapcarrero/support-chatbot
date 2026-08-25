import { and, asc, eq } from "drizzle-orm";

import { MAX_HISTORY_MESSAGES } from "@/lib/ai/config";

import { db, type Database } from "./client";
import * as memory from "./memory-store";
import {
  conversations,
  escalations,
  leads,
  maturityAssessments,
  messages,
  type Message,
} from "./schema";

/**
 * All database access goes through here.
 *
 * Two backends behind one interface: Postgres when `DATABASE_URL` is set, an in-process
 * store otherwise (see `memory-store.ts` for why the fallback is a real store rather than a
 * no-op). Callers never branch on which is active.
 *
 * Writes are additionally wrapped so a database failure degrades the request to "answered
 * but not recorded" rather than failing the user's chat — losing a transcript row is a much
 * cheaper failure than dropping the conversation.
 */

async function safeWrite<T>(
  label: string,
  fn: (database: Database) => Promise<T>,
): Promise<T | null> {
  // Passing the handle in keeps the non-null narrowing across the closure boundary, which a
  // module-level `db` loses — otherwise every call site needs a `db!` assertion.
  if (!db) return null;
  try {
    return await fn(db);
  } catch (error) {
    console.error(`[db] write failed (${label}):`, error);
    return null;
  }
}

/**
 * Return the conversation for `conversationId` if it belongs to `sessionId`, otherwise
 * create a fresh one.
 *
 * The session check is the authorization boundary: conversation ids are UUIDs supplied by
 * the client, so without it anyone could resume — and read the history of — someone else's
 * conversation by guessing or replaying an id. On mismatch we silently start a new
 * conversation rather than erroring, which is the correct UX and leaks nothing about
 * whether the id existed. Both backends enforce this identically.
 */
export async function resolveConversation(
  sessionId: string,
  conversationId: string | null,
): Promise<string | null> {
  if (!db) {
    if (conversationId && memory.findConversation(conversationId, sessionId)) {
      return conversationId;
    }
    return memory.createConversation(sessionId);
  }

  try {
    if (conversationId) {
      const [existing] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(and(eq(conversations.id, conversationId), eq(conversations.sessionId, sessionId)))
        .limit(1);

      if (existing) return existing.id;
    }

    const [created] = await db.insert(conversations).values({ sessionId }).returning({
      id: conversations.id,
    });

    return created?.id ?? null;
  } catch (error) {
    console.error("[db] resolveConversation failed:", error);
    return null;
  }
}

/** Load recent transcript, oldest first, capped at `MAX_HISTORY_MESSAGES`. */
export async function loadHistory(conversationId: string | null): Promise<Message[]> {
  if (!conversationId) return [];
  if (!db) return memory.getMessages(conversationId);

  try {
    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    // Trim from the front so the newest turns survive. Slicing after the query keeps the
    // ordering simple; at support-chat volumes the row count per conversation is tiny.
    return rows.slice(-MAX_HISTORY_MESSAGES);
  } catch (error) {
    console.error("[db] loadHistory failed:", error);
    return [];
  }
}

export async function saveMessage(
  conversationId: string | null,
  role: "user" | "assistant",
  content: unknown,
  usage?: unknown,
): Promise<void> {
  if (!conversationId) return;

  if (!db) {
    memory.addMessage(conversationId, role, content, usage);
    return;
  }

  await safeWrite("saveMessage", async (database) => {
    await database.insert(messages).values({ conversationId, role, content, usage: usage ?? null });
    await database
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  });
}

export interface LeadInput {
  name: string;
  email: string;
  company?: string | null;
  industry?: string | null;
  companySize?: string | null;
  interest: string;
  sourceTool: "book_strategy_call" | "capture_lead";
}

export async function saveLead(conversationId: string | null, lead: LeadInput): Promise<void> {
  if (!conversationId) return;

  if (!db) {
    memory.capturedLeads.push({ conversationId, ...lead, createdAt: new Date() });
    return;
  }

  await safeWrite("saveLead", (database) =>
    database.insert(leads).values({
      conversationId,
      name: lead.name,
      email: lead.email,
      company: lead.company ?? null,
      industry: lead.industry ?? null,
      companySize: lead.companySize ?? null,
      interest: lead.interest,
      sourceTool: lead.sourceTool,
    }),
  );
}

export interface EscalationInput {
  reference: string;
  category:
    | "contractual"
    | "account_specific"
    | "commercial"
    | "complaint"
    | "unanswerable"
    | "other";
  reason: string;
  contactEmail?: string | null;
}

export async function saveEscalation(
  conversationId: string | null,
  input: EscalationInput,
): Promise<void> {
  if (!conversationId) return;

  if (!db) {
    memory.capturedEscalations.push({ conversationId, ...input, createdAt: new Date() });
    memory.markEscalated(conversationId);
    return;
  }

  await safeWrite("saveEscalation", async (database) => {
    await database.insert(escalations).values({
      conversationId,
      reference: input.reference,
      category: input.category,
      reason: input.reason,
      contactEmail: input.contactEmail ?? null,
    });
    await database
      .update(conversations)
      .set({ status: "escalated", updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  });
}

export async function saveMaturityAssessment(
  conversationId: string | null,
  input: { dimensionScores: unknown; overall: number; tier: string },
): Promise<void> {
  if (!conversationId) return;

  if (!db) {
    memory.capturedAssessments.push({ conversationId, ...input, createdAt: new Date() });
    return;
  }

  await safeWrite("saveMaturityAssessment", (database) =>
    database.insert(maturityAssessments).values({
      conversationId,
      dimensionScores: input.dimensionScores,
      overall: input.overall,
      tier: input.tier,
    }),
  );
}
