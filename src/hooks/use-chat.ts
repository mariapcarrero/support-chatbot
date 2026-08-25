"use client";

import { useCallback, useRef, useState } from "react";

import { parseEventLine, type ChatEvent } from "@/lib/ai/events";
import type { ToolUiPayload } from "@/lib/ai/tools/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Structured tool output rendered as cards beneath the text. */
  cards: ToolUiPayload[];
  /** Tools currently running, for the activity indicator. */
  pendingTools: string[];
  error?: { message: string; retryable: boolean };
}

function newId() {
  return crypto.randomUUID();
}

/**
 * Chat transport.
 *
 * Hand-rolled rather than pulled from a streaming framework: the server speaks a small
 * bespoke SSE vocabulary (see `src/lib/ai/events.ts`) that carries tool activity and
 * structured card payloads, which no off-the-shelf protocol models. This is the whole
 * client half of it.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const conversationId = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /** Mutate a single message in place by id. */
  const patch = useCallback((id: string, fn: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const assistantId = newId();
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "user", text: trimmed, cards: [], pendingTools: [] },
        { id: assistantId, role: "assistant", text: "", cards: [], pendingTools: [] },
      ]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const fail = (message: string, retryable = true) =>
        patch(assistantId, (m) => ({ ...m, pendingTools: [], error: { message, retryable } }));

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, conversationId: conversationId.current }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          // Non-streaming failures (validation, rate limit) return JSON, not SSE.
          const detail = await response.json().catch(() => null);
          fail(
            detail?.error ?? "Something went wrong. Please try again.",
            response.status === 429 || response.status >= 500,
          );
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Frames are separated by a blank line. The final element is whatever remains
          // after the last separator — possibly a partial frame — so it stays buffered
          // until more bytes arrive. Dropping this is the classic SSE truncation bug.
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            for (const line of frame.split("\n")) {
              const event = parseEventLine(line);
              if (event) applyEvent(event, assistantId);
            }
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        fail("I lost the connection. Please try again.");
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }

      function applyEvent(event: ChatEvent, id: string) {
        switch (event.type) {
          case "conversation":
            conversationId.current = event.conversationId;
            break;
          case "text":
            patch(id, (m) => ({ ...m, text: m.text + event.delta }));
            break;
          case "tool_start":
            patch(id, (m) => ({
              ...m,
              // A turn can be: text, tool call, more text. Those are two separate assistant
              // messages from the API and both stream into one bubble, so without a break
              // the last word of the first runs into the first word of the second
              // ("...shouldn't guess at.That's been logged"). Insert a paragraph break so
              // markdown renders them as distinct paragraphs.
              text: m.text && !m.text.endsWith("\n") ? `${m.text}\n\n` : m.text,
              pendingTools: [...m.pendingTools, event.name],
            }));
            break;
          case "tool_end":
            patch(id, (m) => ({
              ...m,
              // Remove one instance, not every match — the same tool can legitimately be
              // called twice in a turn.
              pendingTools: removeFirst(m.pendingTools, event.name),
              cards: event.ui ? [...m.cards, event.ui] : m.cards,
            }));
            break;
          case "error":
            patch(id, (m) => ({
              ...m,
              pendingTools: [],
              error: { message: event.message, retryable: event.retryable },
            }));
            break;
          case "done":
            patch(id, (m) => ({ ...m, pendingTools: [] }));
            break;
        }
      }
    },
    [isStreaming, patch],
  );

  const reset = useCallback(() => {
    stop();
    conversationId.current = null;
    setMessages([]);
  }, [stop]);

  return { messages, send, stop, reset, isStreaming };
}

function removeFirst(list: string[], value: string): string[] {
  const index = list.indexOf(value);
  if (index === -1) return list;
  return [...list.slice(0, index), ...list.slice(index + 1)];
}
