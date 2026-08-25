import { CONTACT_URL } from "../contact";
import type { KnowledgeDoc } from "../types";

export const engagementModel: KnowledgeDoc = {
  id: "engagement-model",
  title: "How an engagement works",
  tags: ["process", "engagement", "how it works", "getting started", "onboarding", "timeline"],
  body: `
Cadre describes the work in three movements: **find the right problems, prepare your people to
lead the change, and implement solutions that drive measurable results.**

The team **goes department by department**, identifying high-ROI use cases, implementing the right
tools, training the team, and managing the change so it actually sticks — all against the
eight-pillar framework in the maturity-index topic. Cadre positions this as acting as your
integrated AI team: strategists, AI managers, and AI engineers, rather than a report and a
handshake.

The change-management half is not decoration. Cadre's stated reason most AI work fails is absent
ownership — tools adopted by individuals with no strategy behind them, which burns time and money
and leaves nobody able to say what value was delivered.

### The 45-Day AI Transformation Intensive
The one named programme with a published shape, in four phases:

1. **Discover use cases** — interviews, ROI calculation, prioritization.
2. **Survey the landscape** — tool research and capability tracking.
3. **Implement solutions** — deployment, training, monitoring.
4. **Scale with confidence** — expansion, developing internal champions, and a 3-year roadmap.

It runs from kickoff to a 12-month roadmap **within 45 days**, and delivers the AI Maturity Index,
a full-day workshop, a use case library, a 3-year vision, and the roadmap.

### Getting started
There is one route: the contact form at ${CONTACT_URL}. See the contact-and-booking topic.

You do not need a defined AI strategy before getting in touch — not having one is the usual reason
people call. Someone can start from "we know we should be doing something and don't know where to
begin"; that is the normal starting point, not a disqualification.

### Timelines
**Apart from the 45-day Intensive, Cadre publishes no timelines, and you must not state one.** No
"3-6 weeks", no "pilot in production by week 12", no "usually a couple of months" — those numbers
were never published and would be invented. Duration depends on scope, data access, and
integration complexity, and a strategist can give a real answer for a specific situation.

### What tends to be needed from the client
General guidance rather than a published requirements list, so offer it as what usually helps
rather than as Cadre's terms:

- Someone senior enough to authorize process change.
- Access to the people who actually do the work being automated, not only their managers.
- Access to representative documents and data for the workflows in scope.

Data access is the most common cause of delay. Say that qualitatively — do not attach a
multiplier, a percentage, or a number of weeks to it.

What happens when an engagement ends is covered in the after-the-engagement topic.
`.trim(),
  sources: [
    { url: "https://www.cadreai.com/", checkedOn: "2026-08-25" },
    { url: "https://www.cadreai.com/strategy", checkedOn: "2026-08-25" },
    { url: "https://www.cadreai.com/ai-transformation-intensive", checkedOn: "2026-08-25" },
  ],
};
