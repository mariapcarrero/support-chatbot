# plan.md — Cadre AI Support Chatbot

How this was scoped, built, and where the lines were drawn.

---

## The problem

Cadre AI's inbound team fields a growing volume of repetitive questions — what do you do, do
you work with my industry, how much, how do I book, how do I get into the portal — which
crowds out the conversations actually worth a strategist's time. The bot's job is to absorb
the repetitive tier completely and hand off the rest fast.

Two failure modes are worse than being unhelpful, and the design is shaped around avoiding
them:

1. **Inventing a fact.** A confidently wrong price or an imagined certification damages trust
   in a way that "I don't know" never does.
2. **Claiming an action it did not take.** "I've sent you the link" when nothing was sent is
   worse than saying nothing at all.

Everything below follows from those two.

---

## Scope decisions

### What the bot knows
A curated knowledge base of twelve documents in `src/knowledge/docs/`, covering the six
scenarios in the brief plus pricing, case studies, engagement model, and an FAQ. This is the
**only** source it may use for factual claims — the system prompt says so explicitly, and the
eval suite tests it with adversarial cases.

### Where it draws the line
The bot escalates rather than stretching on: contracts and compliance artifacts (DPAs, SOC 2,
security questionnaires), anything needing a specific person's account data, firm quotes and
discounts, complaints, and anything outside the knowledge base. Escalation is a first-class
outcome with its own tool, database table, and user-visible reference number — not a fallback
apology.

### Deliberately out of scope

| Not built | Why |
| --- | --- |
| Real calendar integration | Calendly/Google OAuth is integration plumbing, not architecture. The booking tool captures the lead and returns the scheduling link — honest about what it did. |
| Real portal authentication | The bot cannot authenticate anyone, and building fake auth for a demo would be worse than not building it. It explains the process and files a request. |
| Admin dashboard | The data model is demonstrable with `npm run db:studio`. A CRUD UI would have consumed the time that went into evals, which are worth more. |
| Vector RAG | See below — the knowledge base is ~12k tokens. |
| Accounts, i18n, voice, file upload | No scenario in the brief needs them. |

---

## Architecture decisions

### No RAG, on purpose

The entire knowledge base is ~12k tokens. Vector search over 12k tokens adds an embedding
pipeline, a network round trip, and a retrieval-miss failure mode to buy nothing — the model
can simply hold all of it. So the whole base goes into a prompt-cached system block: one
round trip, no retrieval failures, and cached reads cost roughly a tenth of fresh input.

**The threshold for changing this is stated rather than left implicit:** past ~30 documents,
or as soon as per-client knowledge enters the picture (where the right documents differ by
who is asking), this flips to pgvector plus a `search_knowledge_base` tool. The knowledge
layer is already behind a typed interface, so that swap does not touch the agent or the route.

### Tools are for actions, not retrieval

Five tools, each a Zod schema + handler + tests: `book_strategy_call`, `capture_lead`,
`score_ai_maturity`, `escalate_to_human`, `get_portal_access_help`. Because retrieval is free
(above), tools are reserved for things with side effects — which is where they genuinely earn
the extra round trip.

### The maturity score is computed in TypeScript, not by the model

`src/lib/maturity/scoring.ts` is pure and deterministic. The model's job is the part it is
good at — explaining five dimensions and eliciting self-ratings conversationally. The
arithmetic and tier assignment are a product artifact that must be reproducible, so they live
in code with tests enumerating all 3,125 possible inputs. There is an eval case that
explicitly tries to talk the model into doing the maths itself.

### Model selection per workload

`claude-sonnet-5` for chat, `claude-opus-5` for the eval judge. Chat is knowledge-grounded Q&A
over a cached prompt where latency is felt directly by the user; the judge grades the chat
model's output offline at low volume, and a judge no stronger than what it grades cannot catch
its mistakes. This mirrors the advice the bot itself gives about LLM selection.

### Hand-written streaming loop over the SDK's tool runner

~85 lines in `src/lib/ai/agent.ts`. The runner would handle the loop but not the three things
this turn needs: per-token streaming interleaved with tool-activity events for the UI, the
exact message array for persistence, and a hard iteration ceiling. Full control, and simple
enough to walk through line by line.

### Structured tool output, not parsed prose

Tools return an optional `ui` payload alongside their text. The maturity card renders `3.4`
because the scoring function returned `3.4` — the model cannot drift the number in the card
even if it misstates it in prose.

---

## Verification

Two suites, deliberately separate.

**`npm test`** — 72 unit tests. Fast, offline, free, run constantly. Covers the deterministic
scorer (including an exhaustive sweep of all 3,125 inputs), tool schema validation and error
paths, the SSE codec, the rate limiter, and a **prompt-determinism test** that asserts the
system prompt is byte-identical across renders. That last one guards a failure with no visible
symptom: one interpolated timestamp silently drops the cache hit rate to zero.

**`npm run eval`** — 24 cases against the real API, each asserted twice: deterministic checks
(was the right tool called, does a forbidden regex appear) and a Claude judge against a rubric.
A case passes only if both agree. Bundling these into `npm test` would make the fast suite slow,
billable, and non-deterministic, and people would stop running it.

The adversarial cases are the interesting half: prompt injection claiming a system override,
an attempt to extract the system prompt, a demand for an exact quote, a discount request, a
request to fabricate an account lookup, an off-topic coding request, and a question about
Cadre's CFO and revenue that must escalate rather than invent.

---

## Build phases

0. Scaffold, `CLAUDE.md`, `.claude/` agents + commands + hook
1. Knowledge layer, system prompt, determinism tests
2. Streaming agent loop, SSE protocol, typed error handling
3. Tools, deterministic scoring, Drizzle schema, repository
4. UI — streaming, tool activity, result cards, empty state
5. Eval harness, 24 cases, judge
6. Deploy to Vercel + Neon, smoke test

---

## Claude Code workflow

- **`CLAUDE.md`** front-loads the things that would otherwise be discovered by breaking them:
  the cache-ordering constraints, the API parameters that now return 400, the two files that
  must stay in sync.
- **Subagents** (`.claude/agents/`) — `kb-curator` (knowledge, with the register-it-or-it-does-
  nothing rule that a real bug taught), `eval-triager` (diagnoses failures into buckets, and is
  explicitly forbidden from fixing them), `tool-smith` (the five-part tool contract).
- **Slash commands** (`.claude/commands/`) — `/eval`, `/add-knowledge`, `/ship`.
- **`PostToolUse` hook** runs `tsc --noEmit` after every TypeScript edit, so type breaks surface
  at the edit rather than at the next manual check.
- **Permission allowlist** for the read-only and routine commands, with `.env`, `.env.local`, and `.env.*.local` denied.

---

## Known limitations

- **Rate limiting is per serverless instance.** In-memory, so the effective global limit scales
  with warm instances and resets on cold start. Adequate for blunting one abusive client; a
  shared store (Upstash) is the fix at real traffic. Isolated to one function for that reason.
- **No streaming resume.** A dropped connection mid-answer loses that turn. The user message is
  persisted before the model runs, so nothing is lost from the record.
- **Knowledge base content is illustrative.** Written from the public brief; pricing bands,
  case study figures, and contact details are plausible placeholders, not verified Cadre facts.
  They are isolated in one directory behind a typed contract precisely so replacing them touches
  no code.
- **Eval cases are model-graded**, so a small amount of flakiness is inherent. The deterministic
  assertion layer carries everything safety-critical for that reason.
