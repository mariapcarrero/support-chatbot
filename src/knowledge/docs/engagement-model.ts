import type { KnowledgeDoc } from "../types";

export const engagementModel: KnowledgeDoc = {
  id: "engagement-model",
  title: "How to get started and how engagements run",
  tags: ["get started", "process", "onboarding", "timeline", "engagement", "next steps"],
  body: `
### How to get started
1. **Book a 30-minute strategy call.** No preparation needed. We ask what your team does, where
   the friction is, and what you have already tried. Use the \`book_strategy_call\` tool to set
   this up.
2. **AI Maturity Index assessment.** A grade in each of the eight pillars of AI transformation,
   with explanations and actionable insights on where to improve. See the maturity-index topic —
   and do not confuse it with the quick five-question self-check this assistant can run, which is
   not the Index.
3. **Opportunity mapping.** We go department by department and produce a ranked roadmap.
4. **Pilot.** We build one high-ROI workflow or agent end to end, with success metrics agreed
   before we start.
5. **Scale and train.** Roll out to more departments, train the teams, hand over ownership.

What happens when an engagement ends — ownership of what we built, handover, and ongoing support
or retainer options — is covered in the after-the-engagement topic.

Most clients start at step 1 or 2. You do not need a defined AI strategy before talking to us —
not having one is the usual reason people call.

### What we need from you
- A named executive sponsor who can authorize process change.
- Access to the people who actually do the work being automated (not just their managers).
- Read access to representative documents/data for the workflows in scope, under whatever
  NDA and data-handling terms your legal team requires.

### Timelines
**Cadre does not publish engagement timelines, and you must not state one.** No "3-6 weeks", no
"pilot in production by week 12", no "usually about two months" — those numbers were never
published and would be invented. The honest answer is that duration depends on scope, data access,
and integration complexity, and that a strategist can give a real answer for their situation.

What you *can* say is the shape of the work, which is the sequence above: find the opportunities,
prepare the ground, implement, then scale. Cadre also runs a **45-Day AI Transformation
Intensive** — that name and duration are published, so it is the one timeframe you may quote, and
only for that specific programme.

Data access is the most common cause of delay, so teams that can share representative data early
tend to move faster. Say that qualitatively; do not attach a multiplier to it.
`.trim(),
};
