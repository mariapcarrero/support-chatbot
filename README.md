# Cadre AI — Support Chatbot

A customer support assistant for Cadre AI, an AI strategy and implementation consultancy. It
answers inbound questions from prospects and existing clients, captures leads, scores AI
maturity, and routes everything it cannot answer to a human.

**Live:** https://support-chatbot-lime.vercel.app

---

## Quick start

```bash
npm install
cp .env.example .env.local     # add your ANTHROPIC_API_KEY
npm run dev                    # http://localhost:3000
```

`DATABASE_URL` is optional — without it the bot still answers and remembers the conversation, but nothing is stored durably.
`GET /api/health` reports what is configured.

```bash
npm run verify     # typecheck + lint + unit tests
npm run eval       # 24 cases against the real API (costs money, ~1 min)
```

---

## What it does

| Scenario | Behaviour |
| --- | --- |
| What does Cadre AI do? Do you work with my industry? | Answers from the knowledge base; reasons from workflow criteria for industries not on the list, without claiming experience it doesn't have |
| Book a call with a strategist | Collects details conversationally, records the lead, returns the scheduling link — never claims a time is confirmed |
| Portal access | Explains magic-link/SSO sign-in and files a support request. Cannot and does not authenticate anyone |
| AI Maturity Index | Explains the five dimensions, collects self-ratings, scores them **in TypeScript** |
| LLM selection and data security | Explains per-workload model choice and data handling; escalates contracts and compliance artifacts |
| Anything it can't answer | Escalates with a quotable reference number |

---

## Architecture

```
Browser (useChat hook)
   │  POST /api/chat  { conversationId, message }
   ▼
Route handler
   ├─ rate limit, Zod validation, conversation ownership check
   ├─ cached system prompt  (knowledge base + operating rules)
   ├─ streaming tool loop   src/lib/ai/agent.ts
   │     └─ 5 tools         src/lib/ai/tools/
   └─ SSE: conversation | text | tool_start | tool_end | done | error
   ▼
Neon Postgres — conversations, messages, leads, escalations, assessments
```

### Four decisions worth knowing

**No RAG.** The knowledge base is ~12k tokens. Vector search over 12k tokens buys nothing and
adds an embedding pipeline, a round trip, and a retrieval-miss failure mode. The whole base
goes into a prompt-cached system block instead. The threshold for revisiting is written down
in [plan.md](./plan.md): ~30 documents, or the moment per-client knowledge appears.

**Tools are for actions, not retrieval.** Since retrieval is free, tools are reserved for
things with side effects: booking, lead capture, scoring, escalation, portal help.

**The maturity score is computed in code.** `src/lib/maturity/scoring.ts` is pure and
deterministic, tested across all 3,125 possible inputs. The model elicits five self-ratings —
the part it's good at — and never does the arithmetic. One eval case tries to talk it into
doing the maths anyway.

**Model per workload.** `claude-sonnet-5` for chat (latency is user-facing, the task is
retrieval); `claude-opus-5` for the eval judge (a judge weaker than what it grades can't
catch its mistakes).

**Provider is one env var.** `LLM_PROVIDER=openrouter` moves both models to OpenRouter, which
serves the Anthropic Messages API natively — so there's one code path and one SDK, not a
translation layer. Only the base URL, auth scheme, and model-id prefix differ, and
`src/lib/ai/client.ts` owns all three. Verified end to end including tool calling and prompt
caching. This is the same anti-lock-in argument the bot makes to clients about LLM selection,
applied to itself.

---

## Verification

**`npm test`** — 72 unit tests. Fast, offline, free. The one worth calling out asserts the
system prompt renders byte-identically every time: a single interpolated timestamp would
silently drop the prompt cache hit rate to zero, with no symptom except the bill.

**`npm run eval`** — 24 cases through the real agent, each asserted twice: deterministic
checks (right tool called? forbidden pattern absent?) plus a Claude judge against a rubric. A
case passes only if both agree. The adversarial half covers prompt injection, system-prompt
extraction, demands for an exact quote, discount requests, fabricated account lookups,
off-topic requests, and a question that must escalate rather than be invented.

They're separate suites on purpose — folding a slow, billable, non-deterministic suite into
`npm test` makes the fast one too painful to run, so people stop running it.

---

## Project layout

```
src/knowledge/       Facts about Cadre AI — the bot's only source of truth
src/lib/ai/          config, system prompt, agent loop, SSE protocol, tools
src/lib/maturity/    Deterministic scoring
src/lib/db/          Drizzle schema, repository, in-memory fallback store
src/lib/guards/      Rate limiting
src/app/api/chat/    Route handler (SSE)
src/app/api/health/  Deploy smoke-test endpoint
src/hooks/           useChat transport
src/components/chat/ UI
scripts/migrate.ts   Runs on deploy via `vercel-build`
drizzle/             Generated SQL migrations
evals/               cases.ts, judge.ts, run.ts
```

[CLAUDE.md](./CLAUDE.md) documents the constraints that aren't obvious from reading the code —
prompt-cache ordering, API parameters that now return 400, files that must stay in sync.
[plan.md](./plan.md) covers scoping, trade-offs, and what was deliberately left out.

---

## Note on knowledge base content

The Cadre AI facts in `src/knowledge/docs/` are **illustrative**, written for this build from
the public brief. Pricing bands, case study figures, portal URLs, and contact addresses are
plausible placeholders, not verified company facts. They'd need replacing with confirmed
content before a real deployment — which is precisely why they're isolated in one directory
behind a typed contract, so doing that touches no code.
