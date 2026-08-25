import type { KnowledgeDoc } from "../types";

export const company: KnowledgeDoc = {
  id: "company",
  title: "What Cadre AI is",
  tags: ["about", "overview", "what do you do", "company", "mission"],
  body: `
Cadre AI is an AI strategy and implementation consultancy. We help businesses move from
AI confusion to AI confidence.

The core of our method is that we go **department by department**, rather than starting with a
single company-wide "AI transformation". In each department we:

1. Identify the highest-ROI AI opportunities for the work that department actually does.
2. Build the workflows and agents that capture those opportunities.
3. Train the team so the changes stick after we leave.

That third step is the one most AI projects skip, and it is the most common reason pilots never
reach production. We treat adoption as part of the engagement, not an afterthought.

**Who we are for:** B2B organizations, typically 50-5,000 employees. Our clients range from lower
middle market private-equity-backed companies to professional services firms and financial
services organizations.

**What makes us different:**
- We are implementation-led, not slide-led. Every engagement ships working software or working
  workflows, not only a strategy document.
- We are model-agnostic. We select the model per workload rather than standardizing on one vendor.
- We measure. Engagements define baseline metrics up front and report against them.
`.trim(),
};
