import { BadgeCheck, CalendarDays, Gauge, KeyRound, LifeBuoy, ShieldCheck } from "lucide-react";

/**
 * Opening screen.
 *
 * The suggested prompts are not decoration — there is one per scenario the bot is built and
 * evaluated against, so whatever a visitor clicks first is something it handles well.
 *
 * All six are here on purpose. An earlier version showed four, which meant someone judging the
 * bot by its own suggestions never saw portal access or escalation — two of the six, and the two
 * that best show where it draws its lines.
 */
const SUGGESTIONS = [
  {
    icon: BadgeCheck,
    label: "What does Cadre AI do?",
    prompt: "What does Cadre AI actually do, and do you work with construction companies?",
  },
  {
    icon: Gauge,
    label: "Score my AI maturity",
    prompt: "What's the AI Maturity Index and can you score my company?",
  },
  {
    icon: CalendarDays,
    label: "Book a strategy call",
    prompt: "I'd like to book a call with an AI strategist.",
  },
  {
    icon: ShieldCheck,
    label: "Security & model choice",
    prompt: "How do you choose which LLM to use, and how do you handle our data?",
  },
  {
    icon: KeyRound,
    label: "Portal access",
    prompt: "I can't get into the Cadre portal to see our agents and results.",
  },
  {
    icon: LifeBuoy,
    label: "Talk to a human",
    prompt: "I need to speak to a real person about a contract question.",
  },
] as const;

export function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-accent text-lg font-semibold text-accent-fg">
        C
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">How can I help?</h1>
      <p className="mt-2 max-w-md text-sm text-fg-muted">
        I can explain what Cadre AI does, check whether we work in your industry, run a quick AI
        maturity self-check, help with portal access, or get you to a strategist. If I don&rsquo;t
        know something, I&rsquo;ll say so and pass you to someone who does.
      </p>

      <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
          <button
            key={label}
            type="button"
            onClick={() => onPick(prompt)}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-left text-sm transition-colors hover:border-accent/40 hover:bg-accent-soft/40"
          >
            <Icon className="size-4 shrink-0 text-accent" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
