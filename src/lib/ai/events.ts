import type { ToolUiPayload } from "./tools/types";

/**
 * The server -> browser event protocol.
 *
 * A small hand-rolled SSE vocabulary rather than a framework's streaming format. The
 * events are the ones this UI actually needs: incremental text, tool activity so the user
 * sees why there is a pause, and structured tool output so cards render from real data
 * instead of parsed prose.
 */
export type ChatEvent =
  /** Sent first. Lets the client persist the conversation id for subsequent turns. */
  | { type: "conversation"; conversationId: string }
  /** An incremental chunk of assistant text. */
  | { type: "text"; delta: string }
  /** The model has started calling a tool. Drives the "working on it" indicator. */
  | { type: "tool_start"; name: string }
  /** A tool finished. `ui` carries structured data for rich rendering, when present. */
  | { type: "tool_end"; name: string; ok: boolean; ui?: ToolUiPayload }
  /** Terminal success. */
  | { type: "done" }
  /** Terminal failure. `message` is safe to show the user verbatim. */
  | { type: "error"; message: string; retryable: boolean };

/** Encode one event as an SSE frame. */
export function encodeEvent(event: ChatEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Parse one SSE `data:` line back into an event.
 *
 * Returns null for anything unrecognised — a comment/keep-alive line, a partial frame, or
 * a future event type this client does not know about. Callers skip nulls, which keeps an
 * older client forward-compatible with a newer server.
 */
export function parseEventLine(line: string): ChatEvent | null {
  if (!line.startsWith("data:")) return null;
  const payload = line.slice(5).trim();
  if (!payload) return null;
  try {
    return JSON.parse(payload) as ChatEvent;
  } catch {
    return null;
  }
}
