import type { KnowledgeDoc } from "../types";

export const industries: KnowledgeDoc = {
  id: "industries",
  title: "Industries we serve",
  tags: ["industries", "verticals", "do you work with", "sectors", "fit"],
  body: `
Cadre AI works with B2B organizations. Industries where we have delivered engagements:

- **Professional services** — law, accounting, consulting, agencies. Document-heavy workflows,
  billable-hour leverage, knowledge retrieval.
- **Private equity** — deal sourcing, diligence acceleration, and portfolio-company value creation
  programs. We often run the same playbook across several portfolio companies.
- **Financial services** — banks, asset managers, insurance. Heavier compliance and audit
  requirements, which shapes model selection and data handling.
- **Real estate** — brokerage, property management, development.
- **Construction** — bid and proposal workflows, submittals, project documentation.
- **Manufacturing** — quality documentation, supplier communication, maintenance knowledge.
- **Retail** — merchandising, customer service, demand planning support.

### How to answer "do you work with my industry?"
The honest answer for an industry not on this list is: probably yes, and here is how to find out.
Our method is industry-agnostic because it starts from *workflows*, not from a vertical template.
What we look for is:

- Repetitive, language-heavy work done by expensive people.
- Knowledge trapped in documents, email, or a handful of experts' heads.
- A decision-maker who can actually authorize process change.

If those are present, we can usually help regardless of sector.

### Where we are a poor fit
- Pure B2C consumer apps looking for a growth-hacking partner.
- Organizations wanting a single one-off prompt or a ChatGPT training session with no follow-through.
- Teams looking to outsource an existing engineering backlog unrelated to AI.

We would rather say so early than sell an engagement that will not work.
`.trim(),
};
