import { MAX_HISTORY_MESSAGES } from "@/lib/ai/config";

import type { Message } from "./schema";

/**
 * In-process conversation store, used when `DATABASE_URL` is not configured.
 *
 * ## Why this exists
 *
 * The client sends only `{ message, conversationId }` — never the transcript — because a
 * client that supplies its own history can forge assistant turns ("as agreed, you're getting
 * 40% off"). The server owning history is what makes the conversation trustworthy.
 *
 * The consequence is that history is load-bearing for *correctness*, not just record-keeping:
 * with no store at all, every turn looks like the first one and every multi-turn flow breaks.
 * Booking silently stops working, because collecting a name and email across two messages is
 * exactly what it needs to do. That is a bad way to "degrade gracefully".
 *
 * So the no-database path degrades to this instead of to nothing.
 *
 * ## What it is not
 *
 * Single-process and volatile. On Vercel each serverless instance gets its own copy and a
 * cold start wipes it, so in production this would strand conversations unpredictably —
 * which is why `/api/health` reports `databaseConfigured` and the deploy checklist checks it.
 * This is for local development and tests, where standing up Postgres to ask the bot two
 * questions is friction with no payoff.
 *
 * ## Next.js module duplication
 *
 * Turbopack / webpack can evaluate this module once for `/api/chat` and again for `/admin`.
 * Module-level `Map`/`[]` would then be two stores — chat files a CAD reference, admin stays
 * empty. State lives on `globalThis` so both bundles share one store in a single Node process.
 */

interface StoredConversation {
  id: string;
  sessionId: string;
  status: "active" | "escalated";
  messages: Message[];
}

/** Bound on retained conversations; oldest are evicted first (Map preserves insert order). */
const MAX_CONVERSATIONS = 200;

export interface CapturedLead {
  id: string;
  conversationId: string;
  name: string;
  email: string;
  company?: string | null;
  industry?: string | null;
  companySize?: string | null;
  interest: string;
  sourceTool: "book_strategy_call" | "capture_lead";
  createdAt: Date;
}

export interface CapturedEscalation {
  id: string;
  conversationId: string;
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
  status: "open" | "resolved";
  createdAt: Date;
}

interface MemoryRoot {
  conversations: Map<string, StoredConversation>;
  capturedLeads: CapturedLead[];
  capturedEscalations: CapturedEscalation[];
  capturedAssessments: unknown[];
}

const globalForMemory = globalThis as typeof globalThis & {
  __cadreMemoryStore?: MemoryRoot;
};

function root(): MemoryRoot {
  if (!globalForMemory.__cadreMemoryStore) {
    globalForMemory.__cadreMemoryStore = {
      conversations: new Map(),
      capturedLeads: [],
      capturedEscalations: [],
      capturedAssessments: [],
    };
  }
  return globalForMemory.__cadreMemoryStore;
}

/** Mutable buckets — always read via these so Next's duplicate module graphs stay in sync. */
export function getCapturedLeads(): CapturedLead[] {
  return root().capturedLeads;
}

export function getCapturedEscalations(): CapturedEscalation[] {
  return root().capturedEscalations;
}

export function getCapturedAssessments(): unknown[] {
  return root().capturedAssessments;
}

export function createConversation(sessionId: string): string {
  const conversations = root().conversations;
  if (conversations.size >= MAX_CONVERSATIONS) {
    const oldest = conversations.keys().next();
    if (!oldest.done) conversations.delete(oldest.value);
  }

  const id = crypto.randomUUID();
  conversations.set(id, { id, sessionId, status: "active", messages: [] });
  return id;
}

/**
 * Resolve an existing conversation, enforcing the same ownership rule as the SQL path:
 * a conversation id belonging to another session must not resolve.
 */
export function findConversation(id: string, sessionId: string): StoredConversation | undefined {
  const found = root().conversations.get(id);
  return found && found.sessionId === sessionId ? found : undefined;
}

export function getMessages(conversationId: string): Message[] {
  const found = root().conversations.get(conversationId);
  if (!found) return [];
  return found.messages.slice(-MAX_HISTORY_MESSAGES);
}

export function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: unknown,
  usage?: unknown,
): void {
  const found = root().conversations.get(conversationId);
  if (!found) return;

  found.messages.push({
    id: crypto.randomUUID(),
    conversationId,
    role,
    content,
    usage: usage ?? null,
    createdAt: new Date(),
  } as Message);
}

export function markEscalated(conversationId: string): void {
  const found = root().conversations.get(conversationId);
  if (found) found.status = "escalated";
}

/** Test seam. */
export function resetMemoryStore(): void {
  const store = root();
  store.conversations.clear();
  store.capturedLeads.length = 0;
  store.capturedEscalations.length = 0;
  store.capturedAssessments.length = 0;
}
