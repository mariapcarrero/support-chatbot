/**
 * The knowledge base is the bot's single source of truth.
 *
 * Every factual claim the assistant is allowed to make about Cadre AI must appear
 * in one of these documents. The system prompt is assembled from them in a
 * deterministic order so the Anthropic prompt cache stays warm — see
 * `src/lib/ai/system-prompt.ts`.
 *
 * Rules for authoring (enforced by `knowledge.test.ts` and the `kb-curator` agent):
 *  - `id` is kebab-case and unique; it doubles as the citation key the model uses.
 *  - `body` contains no timestamps, no randomness, nothing environment-dependent.
 *    Anything that varies per request invalidates the cache prefix for every user.
 *  - Prefer stating "we don't publish that" over inventing a specific number.
 */
export interface KnowledgeDoc {
  /** Stable kebab-case identifier, also used as the citation key. */
  readonly id: string;
  /** Human-readable heading rendered into the system prompt. */
  readonly title: string;
  /** Routing hints, surfaced to the model to help it pick a topic. */
  readonly tags: readonly string[];
  /** Markdown body. Must be free of volatile content. */
  readonly body: string;
}
