import { describe, expect, it } from "vitest";

import {
  checkOpenRouterBudget,
  MAX_OPENROUTER_CASES,
  OVERRIDE_FLAG,
} from "./budget-guard";

/**
 * Tested here rather than in `run.ts` because that module calls `main()` on import — a test
 * that imported it would launch the eval suite and spend real money. That hazard is exactly
 * why the guard is its own module.
 */
const base = { selectedCount: 26, totalCount: 26, override: false } as const;

describe("checkOpenRouterBudget", () => {
  it("never blocks the Anthropic key, whatever the size of the run", () => {
    // Metered but rechargeable. Guarding it too would train people to pass the override by
    // reflex, and that reflex is what would empty the OpenRouter balance later.
    const decision = checkOpenRouterBudget({ ...base, provider: "anthropic" });
    expect(decision.allowed).toBe(true);
    expect(decision.message).toBeUndefined();
  });

  it("blocks a full-suite run against OpenRouter", () => {
    const decision = checkOpenRouterBudget({ ...base, provider: "openrouter" });
    expect(decision.allowed).toBe(false);
    expect(decision.message).toMatch(/non-rechargeable/i);
  });

  it("tells the blocked user how to get what they actually wanted", () => {
    // A refusal that does not name the alternative just gets overridden.
    const { message } = checkOpenRouterBudget({ ...base, provider: "openrouter" });
    expect(message).toContain("LLM_PROVIDER=anthropic npm run eval");
    expect(message).toContain(OVERRIDE_FLAG);
  });

  it("allows a targeted run, which is what OpenRouter validation is for", () => {
    const decision = checkOpenRouterBudget({
      ...base,
      provider: "openrouter",
      selectedCount: MAX_OPENROUTER_CASES,
    });
    expect(decision.allowed).toBe(true);
  });

  it("blocks one case beyond the limit", () => {
    const decision = checkOpenRouterBudget({
      ...base,
      provider: "openrouter",
      selectedCount: MAX_OPENROUTER_CASES + 1,
    });
    expect(decision.allowed).toBe(false);
  });

  it("allows an explicit override, but still says what it will cost", () => {
    const decision = checkOpenRouterBudget({ ...base, provider: "openrouter", override: true });
    expect(decision.allowed).toBe(true);
    // Silently obeying would make the flag a way to not think about it.
    expect(decision.message).toMatch(/\$5 cap/);
  });

  it("keeps the limit below the balance it protects", () => {
    // ~$1 per case against $5. A limit of 5 would permit the exact outcome this prevents.
    expect(MAX_OPENROUTER_CASES).toBeLessThan(5);
  });
});
