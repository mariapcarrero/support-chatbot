# CLAUDE.md

Customer support chatbot for **Cadre AI**, an AI strategy and implementation consultancy.
It answers inbound questions from prospects and existing clients, and routes everything it
cannot answer to a human.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server on :3000 |
| `npm run typecheck` | `tsc --noEmit` — run this after every edit |
| `npm test` | Vitest unit suite. Fast, offline, free. |
| `npm run eval` | Eval suite against the real API. **Costs money, ~1 min.** |
| `npm run eval -- pricing` | Only cases whose id contains "pricing" |
| `npm run eval:judge-check` | Is the judge still discriminating? Run when `JUDGE_MODEL` changes. |
| `npm run verify` | typecheck + lint + test |
| `npm run db:generate` / `db:migrate` | Drizzle migrations |
| `npm run db:studio` | Browse the database |
| `npm run vercel-build` | What Vercel runs: applies migrations, then builds |
| `npm run lint` / `build` / `start` / `test:watch` | Standard Next.js + Vitest |

Slash commands: `/eval`, `/add-knowledge <topic>`, `/ship`.
Subagents: `kb-curator`, `eval-triager`, `tool-smith` (see `.claude/agents/`).

## Architecture

```
src/knowledge/          Facts about Cadre AI. The bot's ONLY source of truth.
  docs/*.ts             One KnowledgeDoc per topic
  index.ts              Registry — sorted, deterministic
src/lib/ai/
  config.ts             Models and limits. Every tunable number lives here.
  system-prompt.ts      Knowledge base + operating rules -> one cached string
  agent.ts              Streaming tool loop. The core of the app.
  events.ts             SSE protocol shared by server and client
  tools/                One file per tool + registry.ts (dispatch & validation)
src/lib/maturity/       Deterministic AI Maturity Index scoring (pure, no LLM)
src/lib/db/             Drizzle schema + repository. All DB access via repository.ts.
  memory-store.ts       In-process fallback when DATABASE_URL is absent
src/lib/guards/         Rate limiting
src/lib/session.ts      Anonymous session cookie
src/app/api/chat/       The route handler. Rate limit, validation, ownership, SSE.
src/app/api/health/     Deploy smoke test. `?probe=1` makes one real call — proves the key WORKS
src/app/admin/          Demo ops inbox: leads and escalations as rows (basic auth)
src/middleware.ts       Gates /admin. Fails closed: no ADMIN_PASSWORD -> 404 in production
src/hooks/use-chat.ts   Client transport
src/components/chat/    UI
scripts/migrate.ts      Applied on deploy via the vercel-build script
drizzle/                Generated SQL migrations
evals/                  cases.ts, judge.ts, run.ts
```

**Request flow:** `POST /api/chat` → rate limit → validate (Zod) → resolve conversation
(ownership-checked) → load history → `runAgent()` streams SSE → persist.
Rate limiting runs **before** validation, so a flood costs no parsing work.

## Non-obvious things that will bite you

### The prompt cache is a prefix match

The whole knowledge base (~12k tokens) is sent as a `cache_control: ephemeral` system block
on every request. Cache render order is **tools → system → messages**. Consequences:

- `KNOWLEDGE_BASE` in `src/knowledge/index.ts` is `.sort()`ed, and `TOOLS` in
  `registry.ts` is alphabetical. **This is load-bearing, not tidiness.** Reordering either
  invalidates the cache for every user.
- Never interpolate a timestamp, UUID, user name, or anything request-varying into the
  system prompt. It fails silently — the bot works perfectly and the bill goes up ~10x.
  `knowledge.test.ts` asserts byte equality across renders. Do not delete that test.
- Verify with `usage.cache_read_input_tokens` — zero across repeated requests means
  something is invalidating the prefix.

### Anthropic API surface (Sonnet 5 / Opus 5)

Patterns from older models **return HTTP 400** here:

- `temperature`, `top_p`, `top_k` — removed. Do not add them back.
- `thinking: { budget_tokens: N }` — removed. Adaptive thinking is the only mode.
- Assistant message prefill — removed.
- `effort` goes inside `output_config`, **not** top-level.
- Sonnet 5 does **not** accept mid-conversation `role: "system"` messages (Opus 5 does).
  All operator instructions belong in the top-level cached `system` block.
- This SDK version has no `APIStatusError`. The base class is `Anthropic.APIError` with an
  optional `.status`, and `APIConnectionError` **extends** it — so check
  `APIConnectionError` first or it will be swallowed by the generic branch.

### `strict: true` on tools is off, and must stay off

The strict-mode grammar has a complexity budget **shared across the entire `tools` array**.
Each of the five tools passes `strict` on its own; all five together return
`400 Schema is too complex`. Because the tool array goes out on every request, enabling it
is a total outage, not a degraded tool. Argument validation happens in `executeTool`
(`schema.safeParse`) instead, which is better anyway — it tells the model *what* was wrong.

**`messages.count_tokens` does not enforce this.** It accepted the strict array happily while
every real request failed. Never treat count_tokens as validation for tool definitions; only
`npm run eval` exercises the path that enforces them.

Schemas are kept strict-compatible regardless (no `minimum`/`maximum` — use a literal union,
which emits `enum`), so re-enabling is one line if the budget ever changes.

### Switching provider is one env var

`LLM_PROVIDER=openrouter` moves both models to OpenRouter. It works because OpenRouter
exposes the Anthropic Messages API natively at `/api/v1/messages` — content blocks,
`stop_reason`, tool use, and `cache_control` all behave identically — so there is one code
path and one SDK, not a translation layer. `src/lib/ai/client.ts` handles the three
differences: base URL, Bearer auth (`authToken`, **not** `apiKey`), and the `anthropic/`
model-id prefix.

Verified end to end: tool calling, the judge, and prompt caching (10,148 tokens written then
read back). `/api/health` reports the active provider.

- **Base URL has no `/v1`.** The SDK appends `/v1/messages` itself, so the base is
  `https://openrouter.ai/api`. Adding `/v1` yields `/api/v1/v1/messages`, which returns a
  404 **HTML page** — the SDK error is a wall of markup, not a JSON message.
- **Cost warning:** eval cases against OpenRouter are roughly an order of magnitude more
  expensive than on the Anthropic key, and that key has a hard, non-rechargeable cap. Run
  targeted cases there (`npm run eval -- <substring>`), never the full suite.
- **Evals do not have to follow the app to OpenRouter.** `evals/run.ts` reads `LLM_PROVIDER`
  from the environment, and a shell variable beats `.env.local` (dotenv does not override
  what is already set). So after the cutover, keep validation on the cheap key:

  ```bash
  LLM_PROVIDER=anthropic npm run eval -- <substring>
  ```

  The deployed app uses OpenRouter via Vercel's env; local eval runs stay on Anthropic. The
  failure mode this prevents is running the suite post-cutover out of habit, which burns the
  entire OpenRouter balance in a handful of cases.

### Model choice is per workload

`claude-sonnet-5` for chat (latency is felt by the user; the task is retrieval, not hard
reasoning). `claude-sonnet-5` for the eval judge too, as of 2026-08-24 — it was
`claude-opus-5`, and the reasoning for the switch (plus what to check if evals start passing
things they should not) is written out above `JUDGE_MODEL` in `src/lib/ai/config.ts`. Both
are single constants there.

The short version: the judge dominated eval cost, and every safety-critical assertion in
`evals/cases.ts` is deterministic (`expectTools`, `mustMatch`, `mustNotMatch`) and unaffected
by the judge's model. **If you suspect a false pass, flip `JUDGE_MODEL` back to
`claude-opus-5` and re-run the same cases before suspecting anything else.**

### The maturity score is not computed by the model

`src/lib/maturity/scoring.ts` is pure TypeScript. The model gathers five self-ratings and
calls the tool; it must never do the arithmetic itself. The tier bands there and the table
in `src/knowledge/docs/maturity-index.ts` **must stay in sync** — change one, change both.
`scoring.test.ts` pins every boundary and enumerates all 3,125 possible inputs.

### Persistence degrades silently by design

The connection string is read from the first non-empty of `DATABASE_URL`, `POSTGRES_URL`,
`NEON_DATABASE_URL`, `NEON_POSTGRES_URL` — Vercel's Neon integration renames what it injects
when a "custom prefix" is set, and production uses `NEON_DATABASE_URL`. `/api/health` reports
`databaseSource` so you can see which one won. `drizzle.config.ts` and `scripts/migrate.ts`
resolve the same order, so migrations cannot target a different database than the app reads.

With none of them set → the repository falls back to an in-process store
(`src/lib/db/memory-store.ts`). Conversations survive within one server instance but are
not persisted. This keeps local dev and evals infrastructure-free.

It is a **real store, not a no-op**, and that distinction is load-bearing: the client never
sends history (a client could forge assistant turns), so the server owning it is what makes
multi-turn flows work at all. A no-op made every turn look like the first and silently broke
booking. The trade-off: a misconfigured production deploy
loses leads without erroring. `/api/health` reports `databaseConfigured` — check it after
every deploy.

### Tool handlers must not throw for expected conditions

Return an error `ToolResult` instead. A throw aborts the user's whole turn; an error result
lets the model apologise, retry, or escalate. `registry.ts` catches unexpected throws as a
backstop, not as the design.

## Conventions

- **Adding a fact the bot can state** → a `KnowledgeDoc`, never a string in the system
  prompt. Register it in `index.ts` (import *and* array entry) or it silently does nothing.
- **Adding an action** → a tool via the `tool-smith` agent. Zod schema is the source of
  truth for both the JSON Schema and runtime validation.
- **All DB access** goes through `src/lib/db/repository.ts`.
- **All tunable numbers** live in `src/lib/ai/config.ts`.
- Never surface a raw error to the browser. Map it in `describeError()`.

## Definition of done

1. `npm run typecheck` clean.
2. `npm test` passes.
3. `npm run eval` passes — **required** for any change to the prompt, knowledge base, or
   tools. Unit tests cannot tell you the bot got worse at its job.
4. New knowledge or a new tool has a matching eval case.

## Working on this repo

- Run `npm run typecheck` after edits; a `PostToolUse` hook does this automatically.
- Prefer editing a knowledge doc over editing the system prompt. The prompt holds *behaviour*;
  docs hold *facts*. Blurring that makes both harder to change.
- When an eval fails, first ask whether the test is wrong. Do not tune the prompt to make one
  case pass — that turns the suite into a mirror of current behaviour instead of a spec.
- `.env.local` is never committed. `.env.example` documents the variables.

## Knowledge base accuracy — read before editing any doc

**Every factual claim in `src/knowledge/docs/` traces to cadreai.com.** The first version was
written from the public brief instead, and shipped a booking URL that 404s, six invented price
bands, four fabricated case studies, a five-part framework where the real one has eight, and an
invented support SLA. All of that is corrected. See the grounding section of `plan.md`.

The rule when adding or editing a doc:

1. **Check the page before you write the claim.** Use raw HTML (`curl … | sed 's/<[^>]*>//g'`),
   not a summarizer — a summarizing step is itself a place inventions enter. The eight pillars
   were confirmed against a heading that literally reads "The 8 Pillars of AI Transformation".
2. **If it is not published, the bot does not say it.** Pricing, deliverable ownership, security
   practice, portal sign-in, and support response times all fall here. The doc should say so and
   route to a human. Refusing is the correct answer, not a failure to be helpful.
3. **The reassuring claim is the dangerous one.** "The client owns everything we build" is what a
   prospect wants to hear, is what they will repeat back to Cadre, and is published nowhere.
   Confidence is not evidence.
4. **Add a `mustNotMatch` guard** for the invented version of anything commercially sensitive,
   and test the pattern against known-good answers before trusting it — several guards here have
   failed *correct* refusals.

There is no `sources` field enforcing this yet, so it is a discipline rather than a build error.
The designed fix is in `plan.md`.

Facts stay isolated in one directory behind a typed contract, so replacing them with a
Cadre-supplied fact sheet touches no code.

@AGENTS.md
