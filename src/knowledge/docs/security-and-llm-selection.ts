import type { KnowledgeDoc } from "../types";

export const securityAndLlmSelection: KnowledgeDoc = {
  id: "security-and-llm-selection",
  title: "Data security and how we select models",
  tags: ["security", "data", "privacy", "llm selection", "models", "compliance", "training"],
  body: `
### How we select models
Cadre's published position: **select the right LLM tailored to your use cases.** Model-agnostic in
practice — the right choice changes with the task, so it is chosen per workload rather than
standardizing the whole company on one vendor. Cadre is an **Anthropic and OpenAI partner**, and
was one of the first official OpenAI service partners.

The factors below are the ones that generally decide it. Offer them as how this kind of choice is
made, which is genuinely useful to someone weighing it — not as a documented Cadre checklist, and
never as a commitment about what will be used for their project:
- **Task fit.** Frontier reasoning models for genuinely hard analysis; smaller, faster, cheaper
  models for classification, extraction, and routing. Most production volume does not need the
  largest model, and paying for one everywhere is a common and expensive mistake.
- **Latency budget.** A customer-facing assistant and an overnight batch job have completely
  different constraints.
- **Cost at real volume.** We model projected token spend before committing, not after.
- **Data handling terms.** Whether the provider trains on your data, retention periods, and
  regional processing options. This frequently eliminates otherwise-good options.
- **Deployment constraints.** Some organizations can only run models inside a particular cloud
  or region, which narrows the field. Discuss this as a factor; do not state where Cadre would
  deploy anything, which is not published.
- **Switching cost.** Keeping prompts and evaluations alongside the rest of the system makes
  changing model a configuration change rather than a rewrite. Frame this as why per-workload
  selection is safe, not as a guarantee about a client's setup.

Cadre works across multiple providers — OpenAI, Anthropic (Claude), Google Gemini, Meta, Mistral,
Qwen, Kimi and DeepSeek among them — alongside infrastructure partners including Snowflake,
Salesforce, Microsoft and AWS. Different models can be used at different stages depending on what
the task needs.

### Data security — what Cadre actually publishes
Three commitments, and these are the ones to lead with because they are the ones that exist:

- **Your data is black-boxed so it is never used to train other models.**
- **Stopping employees putting company secrets into personal AI accounts.** This is the risk Cadre
  talks about most: staff using consumer chat products on personal logins with sensitive company
  information, which is why choosing a single company-wide AI platform is the second of the eight
  pillars.
- **Getting the whole team onto secure, compliant AI tools** rather than a scatter of individual
  accounts.

That is a real answer to "how do you handle our data", and it is the shape of the problem most
prospects actually have.

### What you must not claim
Beyond the three above, Cadre publishes no security detail. Do not state these as practice, however
standard they sound — a security answer that turns out to be invented is worse than no answer:

- Where systems are built or hosted. Not "in your own cloud", not "your identity provider", not
  "we never hold your data".
- Access model specifics: least-privilege, scoped or time-limited credentials.
- PII stripping or tokenization.
- Retention terms — zero-retention, short-retention, regional processing.
- Audit logging, or human-in-the-loop approval on consequential actions.
- Any certification, insurance, or framework compliance.

If asked about any of them, say it is a question for the team and escalate. Someone asking these
questions is usually doing vendor due diligence, and a wrong answer surfaces later in a security
review with Cadre's name attached to it.

### Boundary
Specific contractual questions — DPAs, BAAs, SOC 2 reports, security questionnaires, penetration
test results, cyber insurance — must go to a human. Describe the approach above, then escalate.
Never characterize the terms of a contract or the contents of a compliance report.

**Do not imply which of these artifacts exist.** You do not know whether Cadre holds a SOC 2
report, carries a particular insurance policy, or will sign a given agreement, and saying "so
the team can send you the SOC 2" asserts that it exists. Escalate in neutral terms — "so someone
who can speak to that gets back to you" — and let the human confirm what is available.
`.trim(),
};
