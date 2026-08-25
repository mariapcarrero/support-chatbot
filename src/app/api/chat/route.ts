import type Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

import { describeError, runAgent } from "@/lib/ai/agent";
import { MAX_USER_MESSAGE_CHARS } from "@/lib/ai/config";
import { encodeEvent, type ChatEvent } from "@/lib/ai/events";
import { loadHistory, resolveConversation, saveMessage } from "@/lib/db/repository";
import { checkRateLimit } from "@/lib/guards/rate-limit";
import { getOrCreateSessionId, isUuid } from "@/lib/session";

/** Node runtime: the agent loop and the Neon HTTP driver both run here comfortably. */
export const runtime = "nodejs";
/** A turn with several tool calls can legitimately take a while; the default 15s is tight. */
export const maxDuration = 60;

const requestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(MAX_USER_MESSAGE_CHARS, `Message must be under ${MAX_USER_MESSAGE_CHARS} characters`),
  conversationId: z.string().refine(isUuid, "Invalid conversation id").nullish(),
});

export async function POST(request: Request) {
  const sessionId = await getOrCreateSessionId();

  const limit = checkRateLimit(sessionId);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many messages. Give it a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const { message, conversationId: requestedId } = parsed.data;

  // Ownership is checked inside resolveConversation: an id belonging to another session
  // yields a fresh conversation rather than leaking that session's history.
  const conversationId = await resolveConversation(sessionId, requestedId ?? null);

  const historyRows = await loadHistory(conversationId);
  const history: Anthropic.MessageParam[] = historyRows.map((row) => ({
    role: row.role,
    content: row.content as Anthropic.MessageParam["content"],
  }));

  // Persisted before the model runs, so a failed turn still records what was asked.
  await saveMessage(conversationId, "user", message);

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) =>
        controller.enqueue(encoder.encode(encodeEvent(event)));

      try {
        if (conversationId) send({ type: "conversation", conversationId });

        const generator = runAgent({
          history,
          userMessage: message,
          context: { conversationId: conversationId ?? "", sessionId },
        });

        let next = await generator.next();
        while (!next.done) {
          send(next.value);
          next = await generator.next();
        }

        const { newMessages, usage } = next.value;
        for (const produced of newMessages) {
          await saveMessage(
            conversationId,
            produced.role,
            produced.content,
            produced.role === "assistant" ? usage : undefined,
          );
        }

        send({ type: "done" });
      } catch (error) {
        // The HTTP status is already 200 by the time bytes flow, so a mid-stream failure
        // has to be reported in-band as an error event. The client renders it as a
        // retryable message rather than a dead spinner.
        const described = describeError(error);
        send({ type: "error", message: described.message, retryable: described.retryable });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disable proxy buffering so tokens arrive as they are produced.
      "X-Accel-Buffering": "no",
    },
  });
}
