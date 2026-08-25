"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";

import { useChat } from "@/hooks/use-chat";

import { Composer } from "./composer";
import { EmptyState } from "./empty-state";
import { MessageBubble } from "./message-bubble";

export function Chat() {
  const { messages, send, stop, reset, isStreaming } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (pinnedToBottom.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex min-h-dvh flex-col">
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

      <div ref={scrollRef} className="flex flex-1 flex-col overflow-y-auto">
        {hasMessages ? (
          <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={bottomRef} />
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
