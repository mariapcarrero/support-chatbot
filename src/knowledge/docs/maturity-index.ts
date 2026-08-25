import type { KnowledgeDoc } from "../types";

export const maturityIndex: KnowledgeDoc = {
  id: "maturity-index",
  title: "The Cadre AI Maturity Index",
  tags: ["maturity index", "assessment", "score", "benchmark", "readiness"],
  body: `
The AI Maturity Index is Cadre AI's diagnostic. It scores your company across Cadre's
**eight-pillar framework for AI transformation**: you get a grade in each area with clear
explanations, plus actionable insights on how to improve and move further along in your AI
journey. That gives you a baseline to measure progress against instead of a vague sense that you
are "behind on AI".

### The eight pillars Cadre grades against
1. **Build your dedicated AI team** — an accountable leader supported by product, strategy,
   research and engineering people working across departments.
2. **Deploy your AI Command Center** — choosing one AI platform company-wide, rather than
   letting employees put company data through personal accounts.
3. **Create an AI-first culture shift** — clear policies, leadership communication that addresses
   people's concerns, and real change management.
4. **Connect and enable your tech stack** — API access so agents can move data between fragmented
   systems, plus auditing existing tools for AI features you already pay for.
5. **AI-healthy data assessment** — knowing where data originates, changes, and lives, because
   garbage in is garbage out.
6. **Build your framework for AI agent readiness** — mapping high-impact agents, documenting the
   workflows they touch, and setting up monitoring.
7. **Departmental AI deep dives** — assessing each team's people, process and technology to find
   what is worth automating.
8. **Find your 3-year AI vision** — the dream state as a fully AI-enabled organization, and a
   benchmark to measure progress against.

**Getting the real Index is a conversation with Cadre, not something this assistant can produce.**
Point anyone who wants it to the contact route in the contact-and-booking topic.

### The quick self-check in this chat
Separately, this assistant can run a **short self-assessment** — five questions, self-rated, giving
an indicative score and tier. It is a useful orientation exercise and a way to find your weakest
area in two minutes.

**It is not Cadre's AI Maturity Index, and you must never present it as one.** The five dimensions
below and the tier bands are this assistant's own simplified model, not Cadre's published
framework, and the real Index grades the eight pillars above. Say so plainly when offering it:
something like "I can run a quick five-question self-check to give you a rough picture — the full
Index from Cadre goes deeper and covers eight areas." Never say the user has "received their AI
Maturity Index" or quote the self-check score as Cadre's assessment.

### The five self-check dimensions
Each is scored 1-5.

1. **Data Readiness** — Is the data that matters accessible, reasonably clean, and permitted to be
   used? 1 = scattered across inboxes and shared drives; 5 = governed, documented, queryable.
2. **Tooling & Infrastructure** — What is actually deployed? 1 = individuals pasting into consumer
   chatbots; 5 = sanctioned platforms with SSO, logging, and environment separation.
3. **Team Capability** — Can the team use and evaluate these tools? 1 = a handful of curious
   individuals; 5 = broad fluency plus in-house people who can build and assess.
4. **Process Integration** — Has AI changed how work is actually done? 1 = experiments that live
   beside the real process; 5 = AI steps embedded in core workflows with defined ownership.
5. **Governance & Risk** — Are there rules, and are they followed? 1 = no policy; 5 = clear policy,
   defined approval paths, monitoring, and incident handling.

### Self-check scoring
The overall score is the average of the five dimension scores, on a 1.0-5.0 scale. These bands are
this assistant's own, for the self-check only — Cadre does not publish a numeric scale or tier
names, so never attribute them to Cadre:

| Overall | Tier | What it means |
| --- | --- | --- |
| 1.0 - 1.9 | **Exploring** | Interest but little deployment. Start with education and one narrow pilot. |
| 2.0 - 2.9 | **Experimenting** | Pockets of usage, no coordination. Biggest risk is scattered effort. |
| 3.0 - 3.9 | **Operationalizing** | Real workflows in production. Focus shifts to governance and measurement. |
| 4.0 - 4.4 | **Scaling** | Working practice in several departments. Focus is repeatability and enablement. |
| 4.5 - 5.0 | **Leading** | AI is part of how the business operates. Focus is durable advantage. |

The lowest-scoring dimension is usually the constraint, and it is where we recommend starting —
a company at 5 on tooling and 1 on data readiness does not have a tooling problem.

### How to get scored
Mention **both** whenever someone asks about the Index, and keep them clearly distinct:

- **The AI Maturity Index itself** — graded against the eight pillars, with explanations and
  actionable insights. This comes from Cadre, and the way to get it is the contact route in the
  contact-and-booking topic. This is the answer for anyone asking "how do I get scored?".
- **The quick self-check here** — use the \`score_ai_maturity\` tool. Ask the user to self-rate
  each of the five dimensions 1-5, using the anchors above to explain the ends of the scale.
  Collect all five, then call the tool. The tool computes the score; never compute, estimate, or
  predict it yourself, however obvious the arithmetic looks.

A good answer offers the self-check as the immediate thing you can do together, and the real Index
as the next step — without blurring them. Someone who came here asking about the AI Maturity Index
and leaves thinking a five-question chat gave them one has been misled, even if every number in it
was correct.
`.trim(),
};
