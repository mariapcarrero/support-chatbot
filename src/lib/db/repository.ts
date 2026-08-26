import { and, asc, desc, eq } from "drizzle-orm";

import { MAX_HISTORY_MESSAGES } from "@/lib/ai/config";

import { connectionSource, db, isDbEnabled, type Database } from "./client";
import * as memory from "./memory-store";
import {
  conversations,
  escalations,
  leads,
  maturityAssessments,
  messages,
  type Escalation,
  type Lead,
  type Message,
} from "./schema";

/** Cap for the demo ops inbox — enough to walk through, not a full archive. */
const ADMIN_LIST_LIMIT = 100;

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
    memory.getCapturedLeads().push({
      id: crypto.randomUUID(),
      conversationId,
      ...lead,
      createdAt: new Date(),
    });
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
  summary: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
}

export async function saveEscalation(
  conversationId: string | null,
  input: EscalationInput,
): Promise<void> {
  if (!conversationId) return;

  if (!db) {
    memory.getCapturedEscalations().push({
      id: crypto.randomUUID(),
      conversationId,
      ...input,
      status: "open",
      createdAt: new Date(),
    });
    memory.markEscalated(conversationId);
    return;
  }

  await safeWrite("saveEscalation", async (database) => {
    await database.insert(escalations).values({
      conversationId,
      reference: input.reference,
      category: input.category,
      reason: input.reason,
      summary: input.summary,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone ?? null,
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
    memory.getCapturedAssessments().push({ conversationId, ...input, createdAt: new Date() });
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

/** Shape the admin inbox renders — same fields whether Postgres or memory is active. */
export type AdminLead = Pick<
  Lead,
  "id" | "name" | "email" | "company" | "interest" | "sourceTool" | "createdAt" | "conversationId"
>;

export type AdminEscalation = Pick<
  Escalation,
  | "id"
  | "reference"
  | "category"
  | "reason"
  | "summary"
  | "contactName"
  | "contactEmail"
  | "contactPhone"
  | "status"
  | "createdAt"
  | "conversationId"
>;

export type AdminInboxSource = "postgres" | "memory";

export async function listRecentLeads(limit = ADMIN_LIST_LIMIT): Promise<AdminLead[]> {
  if (!db) {
    // Index tie-break: Date resolution is ms, and two tool writes in one turn often share a
    // timestamp. Later inserts should still surface first in the demo inbox.
    return [...memory.getCapturedLeads()]
      .map((row, index) => ({ row, index }))
      .sort(
        (a, b) =>
          b.row.createdAt.getTime() - a.row.createdAt.getTime() || b.index - a.index,
      )
      .slice(0, limit)
      .map(({ row }) => ({
        id: row.id,
        conversationId: row.conversationId,
        name: row.name,
        email: row.email,
        company: row.company ?? null,
        interest: row.interest,
        sourceTool: row.sourceTool,
        createdAt: row.createdAt,
      }));
  }

  try {
    return await db
      .select({
        id: leads.id,
        conversationId: leads.conversationId,
        name: leads.name,
        email: leads.email,
        company: leads.company,
        interest: leads.interest,
        sourceTool: leads.sourceTool,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[db] listRecentLeads failed:", error);
    return [];
  }
}

export async function listRecentEscalations(
  limit = ADMIN_LIST_LIMIT,
): Promise<AdminEscalation[]> {
  if (!db) {
    return [...memory.getCapturedEscalations()]
      .map((row, index) => ({ row, index }))
      .sort(
        (a, b) =>
          b.row.createdAt.getTime() - a.row.createdAt.getTime() || b.index - a.index,
      )
      .slice(0, limit)
      .map(({ row }) => ({
        id: row.id,
        conversationId: row.conversationId,
        reference: row.reference,
        category: row.category,
        reason: row.reason,
        summary: row.summary,
        contactName: row.contactName ?? null,
        contactEmail: row.contactEmail ?? null,
        contactPhone: row.contactPhone ?? null,
        status: row.status,
        createdAt: row.createdAt,
      }));
  }

  try {
    return await db
      .select({
        id: escalations.id,
        conversationId: escalations.conversationId,
        reference: escalations.reference,
        category: escalations.category,
        reason: escalations.reason,
        summary: escalations.summary,
        contactName: escalations.contactName,
        contactEmail: escalations.contactEmail,
        contactPhone: escalations.contactPhone,
        status: escalations.status,
        createdAt: escalations.createdAt,
      })
      .from(escalations)
      .orderBy(desc(escalations.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[db] listRecentEscalations failed:", error);
    return [];
  }
}

export async function deleteLead(id: string): Promise<boolean> {
  if (!db) {
    const leads = memory.getCapturedLeads();
    const index = leads.findIndex((row) => row.id === id);
    if (index < 0) return false;
    leads.splice(index, 1);
    return true;
  }

  const result = await safeWrite("deleteLead", async (database) => {
    const deleted = await database.delete(leads).where(eq(leads.id, id)).returning({ id: leads.id });
    return deleted.length > 0;
  });
  return result ?? false;
}

export async function deleteEscalation(id: string): Promise<boolean> {
  if (!db) {
    const rows = memory.getCapturedEscalations();
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) return false;
    rows.splice(index, 1);
    return true;
  }

  const result = await safeWrite("deleteEscalation", async (database) => {
    const deleted = await database
      .delete(escalations)
      .where(eq(escalations.id, id))
      .returning({ id: escalations.id });
    return deleted.length > 0;
  });
  return result ?? false;
}

export async function clearAllLeads(): Promise<number> {
  if (!db) {
    const leads = memory.getCapturedLeads();
    const count = leads.length;
    leads.length = 0;
    return count;
  }

  const result = await safeWrite("clearAllLeads", async (database) => {
    const deleted = await database.delete(leads).returning({ id: leads.id });
    return deleted.length;
  });
  return result ?? 0;
}

export async function clearAllEscalations(): Promise<number> {
  if (!db) {
    const rows = memory.getCapturedEscalations();
    const count = rows.length;
    rows.length = 0;
    return count;
  }

  const result = await safeWrite("clearAllEscalations", async (database) => {
    const deleted = await database.delete(escalations).returning({ id: escalations.id });
    return deleted.length;
  });
  return result ?? 0;
}

/** Which backend the admin page is reading from — useful in the demo banner. */
export function adminInboxSource(): {
  kind: AdminInboxSource;
  /** Env var name when kind is postgres (e.g. NEON_DATABASE_URL). */
  connectionVar: string | null;
} {
  return {
    kind: isDbEnabled ? "postgres" : "memory",
    connectionVar: connectionSource,
  };
}
