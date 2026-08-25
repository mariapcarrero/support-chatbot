---
description: Run the eval suite and triage any failures
argument-hint: "[case-id-substring]"
allowed-tools: Bash, Read, Grep, Glob, Task
---

Run the Cadre chatbot eval suite: `npm run eval $1`

Then:

- **All passing** — report the pass count and the total wall time. Stop there. Do not
  refactor anything, and do not add cases nobody asked for.
- **Anything failing** — delegate to the `eval-triager` subagent to classify the failures
  into prompt / knowledge / tool / test / flake buckets with evidence.

Relay the triage back with a recommendation, and wait for approval before changing any file.

Two things to hold onto when a case is red:

1. A failing eval is sometimes a **correct bot and a wrong test**. Check the case against the
   knowledge base before assuming the bot is at fault.
2. Never edit the system prompt just to make a specific case go green. That converts the suite
   from a specification into a mirror, and it stops catching regressions.

Safety-relevant failures — invented facts, fabricated tool results, a guardrail that did not
hold, a leaked system prompt — outrank everything else regardless of how many cases fail.
Report those first.
