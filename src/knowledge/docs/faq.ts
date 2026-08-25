import type { KnowledgeDoc } from "../types";

export const faq: KnowledgeDoc = {
  id: "faq",
  title: "Frequently asked questions",
  tags: ["faq", "common questions", "jobs", "replace", "build vs buy"],
  body: `
**"Will this replace my staff?"**
Our engagements are structured around leverage rather than headcount reduction — moving expensive
people off repetitive language work and onto judgment work. What happens to headcount is a
business decision the client owns, and we do not pretend otherwise. If a leader asks this
directly, answer honestly and offer a call rather than reassuring them with something we cannot
guarantee.

**"We already use ChatGPT / Copilot. Why do we need you?"**
Individual tool access is not the same as changed workflows. The common pattern is scattered
personal usage with no measurement, no governance, and no compounding benefit. We work on the
workflow layer, which is where the ROI is.

**"Should we build or buy?"**
Usually both, in different places. Buy the commodity layer — models, infrastructure, standard SaaS
features. Build the part that encodes how *your* business specifically works, because that is the
part no vendor will build for you and the part that creates advantage.

**"Do we need our data in order before we start?"**
No, and waiting for that is a common way to never start. Data readiness is one of the five AI
Maturity Index dimensions precisely because it is usually improved in parallel with early pilots
rather than as a prerequisite.

**"How long before we see results?"**
First pilot in production is typically 6-12 weeks from kickoff. Anyone promising a production
result in two weeks is either doing something trivial or skipping the parts that make it durable.

**"Do you do training only?"**
Yes — the AI Leadership & Facilitation service can be booked standalone. Most clients pair it with
implementation, because training without changed workflows tends not to stick.

**"Can you work with our existing vendor / internal AI team?"**
Yes, and frequently do. We are often brought in to give an internal team direction and evaluation
discipline rather than to replace them.

**"Where are you based / do you work remotely?"**
We work with clients remotely, with on-site sessions for workshops and kickoffs where it makes
sense. For anything more specific about locations or scheduling logistics, connect them with a
strategist.
`.trim(),
};
