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
2. **AI Maturity Index assessment.** A structured scoring of where you are today across five
   dimensions. Can be done as part of the first call or as a standalone. See the
   maturity-index topic.
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

### Typical timelines
- Strategy engagement: 3-6 weeks.
- First pilot in production: 6-12 weeks from kickoff, depending on data access and integration
  complexity.
- Multi-department rollout: ongoing, usually quarterly waves.

Data access is the most common cause of delay. Teams that can get us representative data in the
first two weeks move roughly twice as fast as teams that cannot.
`.trim(),
};
