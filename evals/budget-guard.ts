import type { Provider } from "@/lib/ai/client";

/**
 * Spend guard for eval runs against OpenRouter.
 *
 * CLAUDE.md carries this rule in prose — *"Run targeted cases there, never the full suite"* —
 * and prose is not a safeguard a running system can read. This is the same move the repo
 * already made for provenance: `sources` was a discipline until `knowledge.test.ts` made it a
 * build error. The failure mode here is worse than a wrong document, because it is
 * irreversible.
 *
 * ## The arithmetic
 *
 * A case costs roughly $0.10–0.13 on the Anthropic key (~4 model calls plus one judge call per
 * case, at Sonnet 5 intro rates). That range was measured against a 20,615-token cached prefix,
 * which is 23,954 as of 2026-08-26 — so treat it as a floor, not a current quote. CLAUDE.md
 * puts OpenRouter at roughly an order of magnitude more, so call it ~$1 per case against a
 * hard, **non-rechargeable** $5 cap.
 *
 * That is the whole point. The full suite (31 cases on 2026-08-27) is not "expensive" there —
 * it is impossible. It
 * would drain the balance somewhere around the fifth case and die mid-run, leaving no way to
 * validate anything afterwards, and no way to top the key up.
 *
 * The specific habit this exists to break: running `npm run eval` out of muscle memory after
 * the provider cutover. Nothing about that command looks dangerous.
 */

/**
 * Most cases allowed against OpenRouter without an explicit override.
 *
 * Three, not five. Five is approximately the entire balance, so a limit set there would
 * permit the exact outcome this guard exists to prevent. Targeted runs — the documented way
 * to validate on OpenRouter — are one to three cases.
 */
export const MAX_OPENROUTER_CASES = 3;

/** Deliberately verbose. A flag someone can type by accident is not a speed bump. */
export const OVERRIDE_FLAG = "--allow-openrouter-full-run";

export interface BudgetDecision {
  allowed: boolean;
  /** Printed before the run when set. Non-null on refusal, and on an acknowledged override. */
  message?: string;
}

export function checkOpenRouterBudget(input: {
  provider: Provider;
  selectedCount: number;
  totalCount: number;
  override: boolean;
}): BudgetDecision {
  const { provider, selectedCount, totalCount, override } = input;

  // The Anthropic key is metered but rechargeable, and the suite costs a few dollars there.
  // Guarding it would train people to pass the override flag by reflex, which would then be
  // in their shell history the day they point at OpenRouter.
  if (provider !== "openrouter") return { allowed: true };

  if (selectedCount <= MAX_OPENROUTER_CASES) return { allowed: true };

  const estimate = `~$${selectedCount.toFixed(0)}–${(selectedCount * 1.3).toFixed(0)}`;

  if (override) {
    return {
      allowed: true,
      message:
        `${OVERRIDE_FLAG} given: running ${selectedCount} case(s) against OpenRouter, ` +
        `estimated ${estimate} against a non-rechargeable $5 cap.`,
    };
  }

  return {
    allowed: false,
    message:
      `Refusing to run ${selectedCount} of ${totalCount} case(s) against OpenRouter.\n\n` +
      `  Estimated cost: ${estimate}, against a hard, non-rechargeable $5 cap.\n` +
      `  A run this size exhausts the balance and dies partway through.\n\n` +
      `What you almost certainly want — validate on the cheap key:\n\n` +
      `  LLM_PROVIDER=anthropic npm run eval\n\n` +
      `Or check a few cases on OpenRouter, which is what it is for:\n\n` +
      `  npm run eval -- <substring>        (up to ${MAX_OPENROUTER_CASES} cases)\n\n` +
      `If you genuinely mean to spend the balance, say so explicitly:\n\n` +
      `  npm run eval -- ${OVERRIDE_FLAG}`,
  };
}
