---
description: Teach the bot something new — knowledge doc plus matching eval case
argument-hint: "<topic or fact the bot should know>"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Task
---

The bot needs to know: **$ARGUMENTS**

Delegate to the `kb-curator` subagent, which owns the `KnowledgeDoc` contract and the house
voice.

Instruct it to:

1. **Verify the fact on cadreai.com before writing it**, reading raw page HTML rather than a
   summary. If it is not on the site, the bot does not state it — write the absence and route
   to a human instead. This step is not optional: the first version of this knowledge base was
   written from a brief and shipped a 404ing booking URL, invented prices, and fabricated case
   studies.
2. Grep `src/knowledge/docs/` first. Extending an existing doc beats adding a near-duplicate —
   two docs covering the same ground is how the bot ends up contradicting itself.
3. Write or extend the doc, keeping it free of anything that varies between renders (the whole
   knowledge base sits inside a prompt-cached system prompt).
4. **Fill in `sources`** — the pages checked, with today's date. Required and enforced by
   `knowledge.test.ts`; a doc without it fails the build.
5. Register it in `src/knowledge/index.ts` — both the import and the `KNOWLEDGE_BASE` entry.
   An unregistered doc silently does nothing.
6. Add an eval case in `evals/cases.ts` covering the new claim. Untested knowledge is
   knowledge nobody will notice regressing. If the claim is commercially sensitive — a price,
   a term, a guarantee — add a `mustNotMatch` guard for the invented version, and check the
   pattern against a few correct answers first. Several guards here have failed *correct*
   refusals because the regex was written without testing it.
7. Run `npm test`, then the new case with `npm run eval -- <substring>`.

If the new fact contradicts something already in the knowledge base, stop and surface the
conflict rather than picking a winner — that is a decision for a human who knows which one
is true.

After editing, grep the *whole* knowledge base for the claim, not just the doc you touched.
Facts here cross-reference each other, and a correction has repeatedly left another document
still asserting the old version.

Report back: the doc changed, the claims added, and the eval case covering them.
