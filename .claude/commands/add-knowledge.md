---
description: Teach the bot something new — knowledge doc plus matching eval case
argument-hint: "<topic or fact the bot should know>"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Task
---

The bot needs to know: **$ARGUMENTS**

Delegate to the `kb-curator` subagent, which owns the `KnowledgeDoc` contract and the house
voice.

Instruct it to:

1. Grep `src/knowledge/docs/` first. Extending an existing doc beats adding a near-duplicate —
   two docs covering the same ground is how the bot ends up contradicting itself.
2. Write or extend the doc, keeping it free of anything that varies between renders (the whole
   knowledge base sits inside a prompt-cached system prompt).
3. Register it in `src/knowledge/index.ts` — both the import and the `KNOWLEDGE_BASE` entry.
   An unregistered doc silently does nothing.
4. Add an eval case in `evals/cases.ts` covering the new claim. Untested knowledge is
   knowledge nobody will notice regressing.
5. Run `npm test`.

If the new fact contradicts something already in the knowledge base, stop and surface the
conflict rather than picking a winner — that is a decision for a human who knows which one
is true.

Report back: the doc changed, the claims added, and the eval case covering them.
