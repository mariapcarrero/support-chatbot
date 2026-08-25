import { AlertCircle, CalendarCheck, KeyRound, LifeBuoy, UserRoundCheck } from "lucide-react";
import type { ReactNode } from "react";

import type { ToolUiPayload } from "@/lib/ai/tools/types";
import { cn } from "@/lib/utils";

/**
 * Structured tool output, rendered from the tool's actual return value rather than parsed
 * out of the model's prose. If the card says the score is 3.4, that is the number the
 * scoring function produced — the model cannot drift it.
 */
export function ToolCard({ payload }: { payload: ToolUiPayload }) {
  switch (payload.kind) {
    case "booking":
      return (
        <Card icon={<CalendarCheck className="size-4" />} title="Strategy call requested">
          <p className="text-fg-muted">
            Recorded for <span className="text-fg font-medium">{payload.name}</span> ({payload.email}).
            Reach the team here:
          </p>
          <a
            href={payload.contactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
          >
            {payload.contactUrl}
          </a>
        </Card>
      );

    case "lead":
      return (
        <Card icon={<UserRoundCheck className="size-4" />} title="Noted for follow-up">
          <p className="text-fg-muted">
            A strategist will reach out to{" "}
            <span className="text-fg font-medium">{payload.email}</span>. No call booked.
          </p>
        </Card>
      );

    case "maturity":
      return <MaturityCard payload={payload} />;

    case "escalation":
      return (
        <Card
          icon={<LifeBuoy className="size-4" />}
          title="Passed to the team"
          tone="accent"
        >
          <p className="text-fg-muted">{payload.reason}</p>
          <p className="mt-2">
            Reference{" "}
            <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-fg">
              {payload.reference}
            </span>
          </p>
        </Card>
      );

    case "portal":
      return (
        <Card icon={<KeyRound className="size-4" />} title="Portal request filed">
          <p className="text-fg-muted">
            Support will follow up with{" "}
            <span className="text-fg font-medium">{payload.email}</span> within one business day.
          </p>
        </Card>
      );
  }
}

function MaturityCard({ payload }: { payload: Extract<ToolUiPayload, { kind: "maturity" }> }) {
  return (
    <Card icon={<AlertCircle className="size-4" />} title="AI Maturity Index" tone="accent">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-fg">{payload.overall}</span>
        <span className="text-fg-subtle">/ 5.0</span>
        <span className="ml-auto rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
          {payload.tier}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {payload.dimensions.map((dim) => (
          <li key={dim.label} className="flex items-center gap-3 text-xs">
            <span className="w-36 shrink-0 text-fg-muted">{dim.label}</span>
            <span
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted"
              role="img"
              aria-label={`${dim.label}: ${dim.score} out of 5`}
            >
              <span
                className={cn(
                  "block h-full rounded-full",
                  dim.label === payload.weakest ? "bg-danger" : "bg-accent",
                )}
                style={{ width: `${(dim.score / 5) * 100}%` }}
              />
            </span>
            <span className="w-6 text-right tabular-nums text-fg-subtle">{dim.score}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-border pt-3 text-fg-muted">{payload.recommendation}</p>
    </Card>
  );
}

function Card({
  icon,
  title,
  tone = "neutral",
  children,
}: {
  icon: ReactNode;
  title: string;
  tone?: "neutral" | "accent";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-3 rounded-xl border p-4 text-sm",
        tone === "accent" ? "border-accent/25 bg-accent-soft/40" : "border-border bg-surface",
      )}
    >
      <div className="mb-2 flex items-center gap-2 font-medium text-fg">
        <span className="text-accent">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}
