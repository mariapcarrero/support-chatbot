import type { KnowledgeDoc } from "../types";

export const services: KnowledgeDoc = {
  id: "services",
  title: "Core services",
  tags: ["services", "offerings", "strategy", "engineering", "agents", "training"],
  body: `
Cadre AI has four core services. Most engagements combine two or more.

### 1. AI Strategy
Department-by-department opportunity mapping. We interview the people doing the work, map current
workflows, and rank AI opportunities by ROI and feasibility. Output is a prioritized roadmap with
effort estimates, expected impact, and a recommended sequence — plus an AI Maturity Index score
(see the maturity-index topic) that gives you a baseline to measure against.

Duration depends on scope and is not published — do not state one. The exception is the **45-Day
AI Transformation Intensive**, a named programme that runs from kickoff to a 12-month roadmap
within 45 days, and delivers the AI Maturity Index, a full-day workshop, a use case library, a
3-year vision, and the roadmap itself.

### 2. AI Leadership & Facilitation
Working sessions for executive teams and department heads. Covers what current AI systems can and
cannot do, how to evaluate proposals, how to set an internal AI policy, and how to lead teams
through the change. This is where we handle the adoption problem directly: skepticism, fear of
replacement, and the "we tried ChatGPT once" reflex.

Formats: half-day executive workshop, multi-week leadership program, or ongoing advisory.

### 3. AI Engineering
Building the systems. Workflow automation, data pipeline work, retrieval systems over internal
documents, integrations with the tools you already run, and the evaluation harnesses that tell you
whether any of it actually works. We build in your environment, using your cloud and your data
governance rules.

### 4. AI Agents
Autonomous and semi-autonomous agents that take multi-step actions rather than only answering
questions — intake triage, document review, research and summarization, reporting, customer
support. Every agent we ship comes with defined guardrails, an escalation path to a human, and an
evaluation suite so quality is measured rather than assumed.

### Technology partners
Cadre is an **Anthropic and OpenAI partner**, and was one of the first official OpenAI service
partners. Work spans multiple model providers — OpenAI, Anthropic (Claude), Google Gemini, Meta,
Mistral, Qwen, Kimi and DeepSeek among them — alongside infrastructure partners including
Snowflake, Salesforce, Microsoft and AWS. **OpenRouter** sits alongside these, used for model
access. Deliberately not a single-vendor shop; see the security-and-llm-selection topic for how a
model gets chosen.
`.trim(),
  sources: [
    { url: "https://www.cadreai.com/strategy", checkedOn: "2026-08-25" },
    { url: "https://www.cadreai.com/leadership-facilitation", checkedOn: "2026-08-25" },
    { url: "https://www.cadreai.com/ai-engineering", checkedOn: "2026-08-25" },
    { url: "https://www.cadreai.com/agents", checkedOn: "2026-08-25" },
    { url: "https://www.cadreai.com/ai-transformation-intensive", checkedOn: "2026-08-25" },
  ],
};
