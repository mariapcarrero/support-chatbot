/**
 * Central model and limit configuration.
 *
 * Model selection is per workload, which is the same principle Cadre AI advocates to
 * clients (see the `security-and-llm-selection` knowledge doc):
 *
 *  - Chat is knowledge-grounded Q&A over a cached prompt with a handful of well-typed
 *    tools. That is not a reasoning-hard task, and latency is felt directly by the user,
 *    so it runs on Sonnet 5.
 *  - The eval judge runs offline at low volume, and grades against a concrete rubric with
 *    the knowledge base in front of it.
 *
 * The judge was Opus 5, on the principle that a judge weaker than what it grades cannot
 * catch its mistakes. It is now Sonnet 5, which is a deliberate trade, not a slip:
 *
 *  - The judge dominated eval cost. Its output is billed at Opus rates and Opus 5 thinks
 *    by default, so a suite run cost roughly twice what it needed to. Sonnet 5 roughly
 *    halves it, which is the difference between running evals when useful and rationing
 *    them.
 *  - The judge is the *second* line of defence, not the first. Every safety-critical
 *    assertion in `evals/cases.ts` is deterministic — `expectTools`, `forbidTools`,
 *    `mustMatch`, `mustNotMatch`. Those are free, exact, and unaffected by this change.
 *    The judge grades rubric prose on top of them.
 *
 * The real risk this introduces is self-favouring: the judge is now the same model that
 * produced the transcript, and a false *pass* is much worse than a false fail — it is how
 * an invented fact ships. Two things hold that down: the judge is given the knowledge base
 * as ground truth (see `evals/judge.ts`), and it grades against a written rubric rather
 * than open-ended "was this good?".
 *
 * If evals start passing things they should not, this constant is the first place to look:
 * put it back to `claude-opus-5` and re-run the same cases before suspecting anything else.
 */
export const CHAT_MODEL = "claude-sonnet-5";
export const JUDGE_MODEL = "claude-sonnet-5";

/**
 * Support answers are short. 8k leaves generous headroom for a long explanation plus
 * tool-call blocks without inviting the model to ramble.
 */
export const MAX_OUTPUT_TOKENS = 8_000;

/**
 * `effort` lives inside `output_config`, not at the top level. `low` is deliberate:
 * the model is retrieving from a prompt it already has rather than reasoning from
 * scratch, and every extra thinking token is latency the user sits through.
 */
export const EFFORT = "low" as const;

/**
 * Ceiling on agent loop iterations per user turn. Each iteration is one API round trip,
 * so an unbounded loop is both a cost and a latency incident. Five is well above the
 * two or three any legitimate flow needs (e.g. score maturity, then capture a lead).
 */
export const MAX_TOOL_ITERATIONS = 5;

/** Reject oversized inputs at the edge rather than paying to tokenize them. */
export const MAX_USER_MESSAGE_CHARS = 4_000;

/**
 * Cap on prior messages replayed to the model. The API is stateless, so history is
 * resent every turn; without a cap, a long conversation grows the request unboundedly.
 * Trimming the oldest turns is the right trade-off for support chat, where relevance
 * decays fast.
 */
export const MAX_HISTORY_MESSAGES = 40;

/** Per-session request budget, enforced in-process. See `src/lib/guards/rate-limit.ts`. */
export const RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 15,
} as const;
