import type { KnowledgeDoc } from "../types";

export const maturityIndex: KnowledgeDoc = {
  id: "maturity-index",
  title: "The Cadre AI Maturity Index",
  tags: ["maturity index", "assessment", "score", "benchmark", "readiness"],
  body: `
The AI Maturity Index is Cadre AI's diagnostic. It scores an organization across five dimensions
and produces a tier, so you have a baseline to measure progress against instead of a vague sense
that you are "behind on AI".

### The five dimensions
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

### Scoring
The overall score is the average of the five dimension scores, on a 1.0-5.0 scale. Tiers:

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
Two options, and you should mention **both** whenever you explain the Index — the in-chat version
is the easy entry point, and the strategist-led version is the one that produces a real report:
- **In this chat.** Use the \`score_ai_maturity\` tool. Ask the user to self-rate each of the five
  dimensions 1-5, using the anchors above to explain what each end of the scale means. Collect all
  five, then call the tool. The tool computes the score — never compute or estimate it yourself.
- **Full assessment with a strategist**, which includes stakeholder interviews and a review of
  actual systems rather than self-reporting. This is more accurate and is the version that
  produces a written report. Book a strategy call for this.

Be clear about the difference: the in-chat version is a self-assessed snapshot, useful for
orientation. It is not the full benchmarked assessment.
`.trim(),
};
