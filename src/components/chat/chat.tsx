"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";

import { useChat } from "@/hooks/use-chat";

import { Composer } from "./composer";
import { EmptyState } from "./empty-state";
import { MessageBubble } from "./message-bubble";

export function Chat() {
  const { messages, send, stop, reset, isStreaming } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);

  // Follow the stream, but stop fighting the user if they scroll up to re-read something.
  // Re-pin once they come back within a small threshold of the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      pinnedToBottom.current = distance < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Keep the newest content in view while a reply streams in.
   *
   * Scrolls the container directly rather than calling `scrollIntoView` on a sentinel: the
   * sentinel sits behind the sticky composer, so "bring it into view" is satisfied while the
   * last line of text is still hidden underneath. Setting `scrollTop` has no such ambiguity.
   *
   * `messages` is a new array on every token — `setMessages` maps over the previous one — so
   * this runs per delta and the view tracks text as it arrives, not just when a turn ends.
   */
  useEffect(() => {
    if (!pinnedToBottom.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const hasMessages = messages.length > 0;

  // `h-dvh`, not `min-h-dvh`. With only a MINIMUM height the column grows to fit its content,
  // the inner `overflow-y-auto` never has anything to overflow, and the window scrolls instead —
  // so the scroll listener never fires and nothing follows the stream. Pinning the shell to the
  // viewport is what makes the message list the scroller. Its `min-h-0` is the other half: a
  // flex child will not shrink below its content without it, so `flex-1 overflow-y-auto` alone
  // still expands rather than scrolling.
  return (
    <div className="flex h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
          <div className="grid size-7 place-items-center rounded-lg bg-accent text-xs font-semibold text-accent-fg">
            C
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">Cadre AI</p>
            <p className="text-xs leading-tight text-fg-subtle">Support assistant</p>
          </div>
          {hasMessages && (
            <button
              type="button"
              onClick={reset}
              className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
            >
              <RotateCcw className="size-3.5" />
              New chat
            </button>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {hasMessages ? (
          <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        ) : (
          <EmptyState onPick={send} />
        )}
      </div>

      <div className="sticky bottom-0">
        <Composer onSend={send} onStop={stop} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
