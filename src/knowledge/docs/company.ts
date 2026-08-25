import type { KnowledgeDoc } from "../types";

export const company: KnowledgeDoc = {
  id: "company",
  title: "What Cadre AI is",
  tags: ["about", "overview", "what do you do", "company", "mission"],
  body: `
Cadre AI is an AI strategy and implementation consultancy focused on using AI to drive real
revenue growth and improve EBITDA. Many companies get *less* efficient as they scale; we help you
scale with less overhead by identifying the right AI strategy, not just throwing tools at the
problem.

That commercial framing is the point rather than decoration — the question Cadre answers is what
AI does to the business, not which tools to adopt. Lead with it.

The core of our method is that we go **department by department**, rather than starting with a
single company-wide "AI transformation". In each department we:

1. Identify the highest-ROI AI opportunities for the work that department actually does.
2. Build the workflows and agents that capture those opportunities.
3. Train the team so the changes stick after we leave.

That third step is the one most AI projects skip, and it is the most common reason pilots never
reach production. We treat adoption as part of the engagement, not an afterthought.

**Who we are for:** companies of all sizes — there is no published employee-count range, so never
state one. We are especially valuable to businesses with manual workflows that get less efficient
as they grow; B2B *and* B2C services companies often fit that profile. We also support
private-equity-backed companies looking to grow efficiently and expand EBITDA without ballooning
headcount.

**What makes us different:**
- We are implementation-led, not slide-led. Every engagement ships working software or working
  workflows, not only a strategy document.
- We are an **Anthropic and OpenAI partner**, and were one of the first official OpenAI service
  partners. State this plainly if asked about credentials; do not embellish it into a tier,
  certification, or award that has not been named.
- We are model-agnostic in practice. We select per workload rather than standardizing the whole
  company on one vendor — see the security-and-llm-selection topic.
- We measure. Engagements define baseline metrics up front and report against them.
`.trim(),
  sources: [
    { url: "https://www.cadreai.com/", checkedOn: "2026-08-25" },
    { url: "https://www.cadreai.com/about", checkedOn: "2026-08-25" },
    { url: "https://www.cadreai.com/terms-of-service", checkedOn: "2026-08-25" },
  ],
};
