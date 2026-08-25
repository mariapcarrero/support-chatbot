import { AlertTriangle } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ChatMessage } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

import { ToolCard } from "./tool-cards";

/** Human-readable labels for the tool-activity indicator. */
const TOOL_LABELS: Record<string, string> = {
  book_strategy_call: "Recording your call request",
  capture_lead: "Saving your details",
  score_ai_maturity: "Calculating your score",
  escalate_to_human: "Connecting you with the team",
  get_portal_access_help: "Checking portal access",
};

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm text-accent-fg whitespace-pre-wrap break-words">
          {message.text}
        </div>
      </div>
    );
  }

  const isEmpty = !message.text && message.pendingTools.length === 0 && !message.error;

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] min-w-0 text-sm leading-relaxed">
        {isEmpty && <ThinkingDots />}

        {message.text && (
          // Tables and long code from the model can exceed the column; scroll them here
          // rather than letting the page scroll sideways.
          <div className="prose-chat overflow-x-auto">
            <Markdown remarkPlugins={[remarkGfm]}>{message.text}</Markdown>
          </div>
        )}

        {message.pendingTools.map((tool, index) => (
          <div
            key={`${tool}-${index}`}
            className="mt-2 flex items-center gap-2 text-xs text-fg-subtle"
          >
            <span className="size-1.5 animate-dot rounded-full bg-accent" />
            {TOOL_LABELS[tool] ?? "Working"}…
          </div>
        ))}

        {message.cards.map((card, index) => (
          <ToolCard key={`${card.kind}-${index}`} payload={card} />
        ))}

        {message.error && (
          <div
            role="alert"
            className={cn(
              "mt-2 flex items-start gap-2 rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-xs",
              "text-danger",
            )}
          >
            <AlertTriangle className="mt-px size-3.5 shrink-0" />
            <span>{message.error.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Assistant is thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-dot rounded-full bg-fg-subtle"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}
