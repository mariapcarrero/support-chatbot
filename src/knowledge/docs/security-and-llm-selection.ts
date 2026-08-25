import type { KnowledgeDoc } from "../types";

export const securityAndLlmSelection: KnowledgeDoc = {
  id: "security-and-llm-selection",
  title: "Data security and how we select models",
  tags: ["security", "data", "privacy", "llm selection", "models", "compliance", "training"],
  body: `
### How we select models
We are deliberately model-agnostic. We select per workload rather than standardizing the whole
company on one vendor, because the right choice changes with the task.

What we evaluate for each workload:
- **Task fit.** Frontier reasoning models for genuinely hard analysis; smaller, faster, cheaper
  models for classification, extraction, and routing. Most production volume does not need the
  largest model, and paying for one everywhere is a common and expensive mistake.
- **Latency budget.** A customer-facing assistant and an overnight batch job have completely
  different constraints.
- **Cost at real volume.** We model projected token spend before committing, not after.
- **Data handling terms.** Whether the provider trains on your data, retention periods, and
  regional processing options. This frequently eliminates otherwise-good options.
- **Deployment surface.** Some clients require the model to run inside their own cloud tenancy —
  AWS Bedrock, Azure, or Google Cloud — which narrows the field.
- **Exit cost.** We keep prompts, evaluations, and orchestration in your codebase so switching
  models is a configuration change rather than a rewrite. Avoiding lock-in is a design goal.

We work across OpenAI, Anthropic (Claude), Google, Microsoft, AWS, Salesforce, and Snowflake, and
use OpenRouter for broad model access. We benchmark candidates against an evaluation set built
from your actual work before recommending one.

### Data security
Our defaults on every engagement:
- **Enterprise API tiers, never consumer chat products,** for anything touching client data.
  Business/enterprise API terms do not train on your inputs.
- **Your infrastructure by default.** We build in your cloud, with your identity provider and your
  logging. Cadre does not become a permanent processor of your data.
- **Least-privilege access.** Scoped, time-limited credentials for the specific systems in scope.
- **PII minimization.** We strip or tokenize personal data before it reaches a model wherever the
  workflow allows it.
- **Retention control.** Zero-retention or short-retention processing options where the provider
  supports it, which is often a deciding factor in financial services engagements.
- **Audit trails.** Agent actions are logged so decisions can be reviewed after the fact.
- **Human-in-the-loop on consequential actions.** Agents propose; a person approves anything
  irreversible or externally visible.

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
