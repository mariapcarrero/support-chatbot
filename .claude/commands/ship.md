---
description: Full pre-deploy gate — typecheck, lint, tests, evals, build
allowed-tools: Bash, Read, Grep, Glob, Task
---

Run the release gate in order, stopping at the first failure. Later stages are slower and
cost money, so there is no point running them behind a broken typecheck.

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run eval:judge-check` — is the judge still discriminating? A judge that has started
   passing everything turns stage 5 green regardless of what the bot did, so it is checked
   first. Costs a few cents.
5. `npm run eval`
6. `npm run build`

Stages 1-3 are free and offline. Stages 4-5 call the API and cost money — which is the whole
reason for the ordering.

**Check the provider before stage 4.** The eval runner prints it on startup. If the deployed
app has moved to OpenRouter, run the eval stages against the Anthropic key instead — a shell
variable beats `.env.local`:

```bash
LLM_PROVIDER=anthropic npm run eval
```

The OpenRouter key has a hard, non-rechargeable cap and costs roughly an order of magnitude
more per case. A full suite run there is not a slightly worse idea; it is most of the balance.

On failure: report which stage broke and the relevant output, then stop. For a failing eval,
hand off to the `eval-triager` subagent rather than guessing at a fix.

**One failing case is not yet a finding.** These cases are model-graded and some are
intermittent. Re-run a single failure 3-5 times (`npm run eval -- <substring>`) before
reporting it as a regression — during this build, two "regressions" were pre-existing
flakiness and one was a bug in the test script rather than the app.

On success, print a short summary — test count, eval pass rate, build status — and confirm
the tree is ready to deploy. Then check two things that a green build does not cover:

- `git status` is clean, or the remaining changes are intentional.
- No secret has been staged. `.env.local` must never be committed; `.env.example` is the
  file that gets committed.

Do not deploy, push, or commit as part of this command. This is a gate, not a release —
the human decides when to ship.
