"use client";

import { ArrowUp, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { MAX_USER_MESSAGE_CHARS } from "@/lib/ai/config";
import { cn } from "@/lib/utils";

interface ComposerProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

const MAX_TEXTAREA_PX = 200;

/**
 * `text-base` (16px) on mobile, dropping to `text-sm` only at `sm:`.
 *
 * Not a typography preference. iOS Safari force-zooms the page whenever a focused input renders
 * below 16px, and it does not zoom back out on blur — so the layout ends up scaled and clipped
 * horizontally, which reads as a broken page rather than as a zoom. The other way to stop it,
 * `maximum-scale=1` on the viewport, takes pinch-zoom away from everyone and is an accessibility
 * regression. Sizing the text correctly costs nothing, so do not unify this back to `text-sm`.
 */
const TEXTAREA_CLASSES =
  "max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-base outline-none " +
  "placeholder:text-fg-subtle sm:text-sm";

export function Composer({ onSend, onStop, isStreaming }: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grow with content up to a ceiling, then scroll. Height must be reset to "auto" first
  // or scrollHeight only ever reports the current (already grown) height.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`;
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue("");
  };

  const overLimit = value.length > MAX_USER_MESSAGE_CHARS;
  const canSend = value.trim().length > 0 && !overLimit && !isStreaming;

  return (
    <div className="border-t border-border bg-surface/80 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto w-full max-w-3xl px-4 py-3">
        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border bg-surface px-3 py-2 transition-colors",
            overLimit ? "border-danger" : "border-border focus-within:border-accent",
          )}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter inserts a newline. Skip while an IME composition
              // is active, or Enter-to-commit in Japanese/Chinese input sends the message.
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask about services or book a call…"
            aria-label="Message"
            className={TEXTAREA_CLASSES}
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generating"
              className="mb-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-fg-muted transition-colors hover:text-fg"
            >
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!canSend}
              aria-label="Send message"
              className="mb-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-accent text-accent-fg transition-opacity disabled:opacity-30"
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </div>

        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-fg-subtle">
          <span>
            {overLimit
              ? `${value.length} / ${MAX_USER_MESSAGE_CHARS} — too long`
              : "Cadre AI's assistant. It can make mistakes — confirm anything important."}
          </span>
          {value.length > MAX_USER_MESSAGE_CHARS * 0.75 && (
            <span className={cn("tabular-nums", overLimit && "text-danger")}>
              {value.length}/{MAX_USER_MESSAGE_CHARS}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
