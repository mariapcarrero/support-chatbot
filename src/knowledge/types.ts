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
/**
 * A page on cadreai.com this document was checked against.
 *
 * Deliberately "checked against" rather than "taken from". Several documents exist mainly to
 * record that something is NOT published — there is no pricing, no portal URL, no statement
 * about who owns deliverables — and an absence has no source paragraph to point at. What it
 * has is a set of pages someone looked at, which is the thing worth recording.
 */
export interface Source {
  /** Absolute URL on cadreai.com. */
  readonly url: string;
  /**
   * ISO date (YYYY-MM-DD) this document was last reconciled with that page.
   *
   * Date only, never a timestamp. It is not rendered into the system prompt, but keeping it
   * coarse means re-checking a page does not churn the diff.
   */
  readonly checkedOn: string;
}

export interface KnowledgeDoc {
  /** Stable kebab-case identifier, also used as the citation key. */
  readonly id: string;
  /** Human-readable heading rendered into the system prompt. */
  readonly title: string;
  /** Routing hints, surfaced to the model to help it pick a topic. */
  readonly tags: readonly string[];
  /** Markdown body. Must be free of volatile content. */
  readonly body: string;
  /**
   * Where this document's claims were verified. Required and non-empty.
   *
   * This exists because the first version of this knowledge base was written from a brief
   * rather than from the website, and shipped a booking URL that 404s, six invented price
   * bands, four fabricated case studies, and a five-part framework where the real one has
   * eight. Nothing in the code distinguished those from verified facts — the only safeguard
   * was a sentence in a planning document, which a running system cannot read.
   *
   * Being required is the point. A new document cannot be added without someone naming the
   * page they checked, and `knowledge.test.ts` fails the build otherwise. It does not prove
   * the body matches the page — only a human or a fetch can do that — but it removes the
   * option of never having looked.
   */
  readonly sources: readonly Source[];
}
