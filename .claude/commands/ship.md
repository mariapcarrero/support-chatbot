---
description: Full pre-deploy gate — typecheck, lint, tests, evals, build
allowed-tools: Bash, Read, Grep, Glob, Task
---

Run the release gate in order, stopping at the first failure. Later stages are slower and
cost money, so there is no point running them behind a broken typecheck.

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run eval`
5. `npm run build`

On failure: report which stage broke and the relevant output, then stop. For a failing eval,
hand off to the `eval-triager` subagent rather than guessing at a fix.

On success, print a short summary — test count, eval pass rate, build status — and confirm
the tree is ready to deploy. Then check two things that a green build does not cover:

- `git status` is clean, or the remaining changes are intentional.
- No secret has been staged. `.env.local` must never be committed; `.env.example` is the
  file that gets committed.

Do not deploy, push, or commit as part of this command. This is a gate, not a release —
the human decides when to ship.
