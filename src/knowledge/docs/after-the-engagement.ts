import { CONTACT_URL } from "../contact";
import type { KnowledgeDoc } from "../types";

export const afterTheEngagement: KnowledgeDoc = {
  id: "after-the-engagement",
  title: "After the engagement: ownership, handover, and ongoing support",
  tags: [
    "after the engagement",
    "handover",
    "ownership",
    "who owns the code",
    "intellectual property",
    "ongoing support",
    "retainer",
    "maintenance",
    "what happens when you leave",
    "lock-in",
  ],
  body: `
### Who owns what Cadre builds — you do not know
This is the important boundary in this topic, and it is easy to get wrong because a confident
answer feels helpful.

**Cadre publishes nothing about ownership of engagement deliverables.** No statement about who
owns the code, the prompts, the agent configurations, or the documentation. The only intellectual
property language on the site is in the website terms of service, and that covers the website
itself and material submitted through it — not client work.

So when someone asks "who owns the code once you're gone?", the honest answer is that ownership
and IP are commercial terms settled in the agreement, and Cadre confirms them directly. Say that
plainly and route them to a human. **Never assert that the client owns what is built, that there
is no lock-in, or that systems are built in the client's own infrastructure.** Those are
reassuring, they are what a prospect wants to hear, and none of them is published — exactly the
combination that produces a confidently wrong answer to the question a prospect is most likely to
repeat back to Cadre.

Do not soften it into a hint either. "Typically the client owns everything" is the same invented
claim wearing a hedge.

### What is published, and genuinely useful
Enough is known to give a real answer about what happens after the build:

- **Training the team is part of the method, not an add-on.** Cadre goes department by department
  identifying use cases, implementing tools, **training the team, and managing that change so it
  sticks** — see the engagement-model topic. The stated reason most AI initiatives fail is absent
  ownership, so handing over capability is the point rather than a courtesy.
- **Internal champions are an explicit deliverable.** The 45-Day Intensive's final phase is
  "scale with confidence": expansion, developing internal champions, and a 3-year roadmap.
- **Results stay visible.** Clients get a centralized portal tracking tools, agents, training, and
  results — see the portal topic.
- **Ongoing advisory exists** as a format of AI Leadership & Facilitation, for teams who want
  direction and review rather than delivery. See the services topic.

That is a substantive answer to "what happens when you leave" without inventing a contract.

### Ongoing support
Continuing after an initial build is normal, and the shapes above are real. But **do not describe
commercial arrangements**: no retainer price, no minimum commitment, no notice period, no support
SLA, no statement about what an agreement includes. The pricing topic's rules apply here
unchanged.

Existing clients, and anyone negotiating post-engagement support, should reach the team at
${CONTACT_URL}.

### Boundary
Describe the approach; never the terms. Anyone asking what their agreement says, who owns what,
what happens to the systems if they stop working with Cadre, or wanting any of it in writing needs
a human. That is a commercial conversation and not yours to have.
`.trim(),
  sources: [
    { url: "https://www.cadreai.com/terms-of-service", checkedOn: "2026-08-25" },
    { url: "https://www.cadreai.com/ai-transformation-intensive", checkedOn: "2026-08-25" },
    { url: "https://www.cadreai.com/", checkedOn: "2026-08-25" },
  ],
};
