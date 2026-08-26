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
| Vector RAG | See below — the knowledge base is ~12k tokens. |
| Accounts, i18n, voice, file upload | No scenario in the brief needs them. |

**One reversal.** An admin dashboard was on this list, on the grounds that a CRUD UI would eat
the time that went into evals. It was built late, once the evals were done and the repository
already owned every query it needed — which made it about an hour's work rather than a day's.
It is `/admin`, gated behind HTTP Basic auth, and it exists because demonstrating the bot
otherwise meant asserting a database row existed somewhere. The original reasoning was right at
the time and stopped being right once its cost changed; recording the reversal is more useful
than quietly editing the table.

---

## Grounding: the knowledge base was invented, and then it wasn't

This is the part of the build worth reading.

The first version of `src/knowledge/docs/` was written from the public brief rather than from
Cadre's website, and it was **plausible rather than true**. It was labelled as illustrative in
this document, which felt like an adequate disclaimer right up until the bot started handing
users a booking link that 404s.

### What was actually wrong

| The bot said | Reality on cadreai.com |
| --- | --- |
| Book at `cadre.ai/book` | No such page. No scheduling page at all — a contact form is the only route |
| Portal at `portal.cadre.ai` | Does not resolve. No public portal address exists |
| `hello@cadre.ai` | The address is `hello@gocadre.ai` — deliberately not the website domain |
| Six price bands, $10k–$150k | **No pricing is published anywhere** |
| Four case studies with outcomes | All fabricated. Eight real ones are published, with figures |
| AI Maturity Index scores five dimensions | It grades **eight named pillars** |
| Serves seven industries | Nine — hospitality and mortgage & lending were missing, both with published case studies |
| Support replies "within one business day" | No response time is published |
| Client owns the code; no lock-in; built in your infrastructure | Nothing about deliverable ownership is published |
| Least-privilege, PII minimization, zero-retention, audit trails | None of it published |

### Why it took a dead link to notice

None of these announced themselves. `cadre.ai/book` was caught because a human clicked it. The
rest were found only by going topic by topic against the live site — and the pattern is that the
*most confident, most reassuring* claims were the most likely to be invented. "Yes, you own
everything you paid us to build" is what a prospect hopes to hear, is the sentence they would
repeat back to Cadre in a commercial conversation, and was written by a language model that had
never seen a contract.

That is the actual lesson: a disclaimer in a planning document does not constrain a running
system. Nothing in the code distinguished a verified fact from a fluent invention.

### What changed

- **Every claim was traced to a page**, using raw page HTML rather than a summarizer — the
  summarizing step is itself a place inventions enter. The eight pillars were confirmed against
  a section literally headed "The 8 Pillars of AI Transformation"; the Index's connection to them
  came verbatim from the homepage FAQ.
- **Where nothing is published, the bot now says so and routes to a human**, rather than
  producing the helpful-sounding answer. Pricing, ownership, security practice, portal sign-in
  and support response times all work this way. Refusing to answer is a feature here.
- **The eval suite enforces it.** `INVENTED_PRICE` matches any dollar figure outside the four
  published case-study savings. Guards exist for ownership phrasing, for security practices that
  were never published, and for invented SLAs.
- **Contact details were centralized** into `src/knowledge/contact.ts`. Previously a constant
  existed to be "the one place you change" while the same literal was hardcoded in three
  documents — so changing it would have made the bot contradict itself depending on whether a
  tool fired.

### Making it structural

Reconciling the content fixes today; it does not stop the next document being written from
imagination. So `KnowledgeDoc` now requires `sources: {url, checkedOn}[]`, and
`knowledge.test.ts` fails the build when a document has none, when a URL is not an https
cadreai.com address, or when a date is not real.

The field is "pages this was **checked against**", not "pages this was taken from". Several
documents exist mainly to record that something is *not* published — no pricing, no portal URL,
no statement about deliverable ownership — and an absence has no paragraph to cite. What it has
is a set of pages someone looked at, which is the thing worth recording.

It does not prove the body matches the page; only a human or a fetch can do that. What it removes
is the option of never having looked, which is exactly how the first version happened.

**Still not built:** a `knowledge:audit` script that re-fetches each source and reports drift.
`checkedOn` is the hook for it — the dates are there so staleness is visible — but the site
changing under a correct document remains something a person has to notice.

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

**`npm test`** — 83 unit tests. Fast, offline, free, run constantly. Covers the deterministic
scorer (including an exhaustive sweep of all 3,125 inputs), tool schema validation and error
paths, the SSE codec, the rate limiter, and a **prompt-determinism test** that asserts the
system prompt is byte-identical across renders. That last one guards a failure with no visible
symptom: one interpolated timestamp silently drops the cache hit rate to zero.

**`npm run eval`** — 25 cases against the real API, each asserted twice: deterministic checks
(was the right tool called, does a forbidden regex appear) and a Claude judge against a rubric.
A case passes only if both agree. Bundling these into `npm test` would make the fast suite slow,
billable, and non-deterministic, and people would stop running it.

The adversarial cases are the interesting half: prompt injection claiming a system override,
an attempt to extract the system prompt, a demand for an exact quote, a discount request, a
request to fabricate an account lookup, an off-topic coding request, and a question about
Cadre's CFO and revenue that must escalate rather than invent.

**`npm run eval:judge-check`** — five transcripts whose verdict is not in doubt: three planted
failures (an invented price, a booking it could not have made, a SOC 2 certification it cannot
assert) and two correct refusals. An LLM judge can fail by starting to pass everything, which
turns a real regression into a green run and which nothing else in the suite would notice. Run
it whenever `JUDGE_MODEL` changes.

### Bugs the tooling caught, and the ones it didn't

Worth recording because the split is instructive.

- **Typecheck could not see it.** Four error messages interpolated `${CONTACT_EMAIL}` inside
  *double-quoted* strings, so users would have been shown the literal text `${CONTACT_EMAIL}`.
  Valid TypeScript, valid string, completely wrong output. Only reading it caught it.
- **The tests were wrong, not the bot.** Three eval rubrics asserted claims that turned out to be
  invented — one *required* the bot to state that clients own the code. A correct refusal failed
  the suite. The judge diagnosed the contradiction itself.
- **Guards that failed correct answers.** `INVENTED_PRICE` was tightened to match any dollar
  amount, which then failed a bot for correctly citing "$420,000 saved" from a real case study.
  Fixed by whitelisting the published figures — then it failed again because the bot writes
  "$136K", not "$136,000". Every pattern here is now checked against a set of known-good answers
  before being trusted, a habit that a comment on `discount-refusal` records the origin of: an
  early pattern flagged "I can't offer discounts" because "I can" is a prefix of "I can't".
- **Sampling, not single runs.** `capture_lead` fired on roughly one run in three — a prospect
  handed over name and email and nothing was recorded. Two single-sample runs had "confirmed" it
  as a regression from an unrelated change; five samples showed it was pre-existing. Anything
  intermittent is now measured over repeated runs before conclusions get drawn.

---

## Build phases

0. Scaffold, `CLAUDE.md`, `.claude/` agents + commands + hook
1. Knowledge layer, system prompt, determinism tests
2. Streaming agent loop, SSE protocol, typed error handling
3. Tools, deterministic scoring, Drizzle schema, repository
4. UI — streaming, tool activity, result cards, empty state
5. Eval harness, 25 cases, judge
6. Deploy to Vercel + Neon, smoke test
7. Reconcile every knowledge document against cadreai.com; remove what is not published
8. `/admin` ops inbox behind basic auth; `/api/health?probe=1` deploy check

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

### Managing context, in practice

The parts that actually changed the working loop, as opposed to the parts that look tidy:

- **`CLAUDE.md` is written against specific past failures**, not as a description of the project.
  "The prompt cache is a prefix match", "`strict: true` must stay off because the complexity
  budget is shared across the tools array", "these two files must stay in sync" — each is there
  because getting it wrong cost real time. A file that merely describes the directory structure
  would not have prevented anything.
- **Verification is scoped to blast radius.** A knowledge edit changes the cached system prompt,
  which is technically global, and treating that as "run everything" collapses into running the
  full suite for every change. Targeted runs (`npm run eval -- portal`) are the default; the full
  suite is a ship gate. That distinction was learned the expensive way — one full run plus a
  flaky-test chase came to about 40 case executions in a session.
- **The model doing the work is a cost decision.** The eval judge moved from Opus to Sonnet after
  measuring that it dominated spend, on the reasoning that the deterministic assertions carry
  everything safety-critical and the judge grades prose on top of them. `eval:judge-check` exists
  precisely because that trade needed a guard.
- **Assume the harness is wrong before the app is.** Two "production is broken" findings during
  this build were faults in the test script — one parsed for a `tool` SSE event when the protocol
  emits `tool_start`/`tool_end`, the other sent no session cookie, so the server correctly refused
  to replay conversation history and it looked like memory loss. Both were reported as app bugs
  before being checked. Verifying the instrument before trusting the reading is the habit that
  matters when an AI is generating both the code and the test.

---

## Known limitations

- **Rate limiting is per serverless instance.** In-memory, so the effective global limit scales
  with warm instances and resets on cold start. Adequate for blunting one abusive client; a
  shared store (Upstash) is the fix at real traffic. Isolated to one function for that reason.
- **No streaming resume.** A dropped connection mid-answer loses that turn. The user message is
  persisted before the model runs, so nothing is lost from the record.
- **Provenance is a discipline, not a mechanism.** Every claim now traces to cadreai.com, but
  nothing in the code enforces that — no `sources` field, no drift check. See the grounding
  section above for the designed fix. A new document can still assert something unverified and
  the build will pass.
- **The site is the only source.** Anything Cadre knows but has not published — real timelines,
  ownership terms, security practice — the bot cannot answer, and correctly routes to a human.
  That is the right default for a public assistant, but it means a Cadre-supplied fact sheet
  would immediately make it substantially more useful.
- **`/admin` is a demo surface.** Basic auth against a single shared secret, no roles, no audit
  log. Fine for a walkthrough; not a real ops tool.
- **Eval cases are model-graded**, so a small amount of flakiness is inherent. The deterministic
  assertion layer carries everything safety-critical for that reason.
