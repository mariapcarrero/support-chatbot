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
 */

interface StoredConversation {
  id: string;
  sessionId: string;
  status: "active" | "escalated";
  messages: Message[];
}

/** Bound on retained conversations; oldest are evicted first (Map preserves insert order). */
const MAX_CONVERSATIONS = 200;

const conversations = new Map<string, StoredConversation>();

/** Captured records, kept so tool flows behave identically to the database path. */
export const capturedLeads: unknown[] = [];
export const capturedEscalations: unknown[] = [];
export const capturedAssessments: unknown[] = [];

export function createConversation(sessionId: string): string {
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
  const found = conversations.get(id);
  return found && found.sessionId === sessionId ? found : undefined;
}

export function getMessages(conversationId: string): Message[] {
  const found = conversations.get(conversationId);
  if (!found) return [];
  return found.messages.slice(-MAX_HISTORY_MESSAGES);
}

export function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: unknown,
  usage?: unknown,
): void {
  const found = conversations.get(conversationId);
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
  const found = conversations.get(conversationId);
  if (found) found.status = "escalated";
}

/** Test seam. */
export function resetMemoryStore(): void {
  conversations.clear();
  capturedLeads.length = 0;
  capturedEscalations.length = 0;
  capturedAssessments.length = 0;
}
