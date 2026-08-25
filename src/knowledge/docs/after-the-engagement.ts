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
### Who owns what we build
The client does. Code, prompts, evaluation suites, pipelines, agent configurations, and the
documentation that goes with them are the client's to keep, run, modify, and extend.

This follows from how we build rather than from a clause at the end. We build **in your
infrastructure** — your cloud accounts, your repositories, your identity provider, your logging.
There is no Cadre-hosted black box in the middle, no per-seat licence to keep something running,
and nothing that stops working when the engagement ends. So the systems keep running without us,
and another vendor can take the work over: we hold nothing hostage through hosting, credentials,
or undocumented knowledge.

### Handover
Handover is continuous, not an event at the end. Work lands in your repositories as it is built,
and the material around it is written alongside it: architecture and design notes, runbooks for
operating it, the evaluation suite so quality can be measured rather than assumed, and the known
limitations and deliberately deferred decisions. Active clients find handover documentation in the
portal's Documents section.

### Training your team to take over
Taking over is specific work, not a final slide deck: a named owner per workflow on the client
side, identified while we are still there; the people who will run a system building it alongside
us; client ownership of the evaluation set, so their own team can tell whether quality has
drifted; and working sessions for the wider team whose work changes, via AI Leadership &
Facilitation. Where a client would rather not run it themselves, we can operate it instead — which
of the two is chosen is one of the cost drivers in the pricing topic.

### Ongoing support
Continuing after the initial build is normal. The usual shapes are a monthly retainer for ongoing
engineering or multi-department rollout, ongoing advisory for teams who own the systems but want
direction and review, Cadre operating it, or nothing at all — a clean end is a legitimate outcome.
Existing clients reach the team at ${CONTACT_URL}.

### Boundary
Describe the approach above; do not state contract specifics. Never quote or characterize IP
assignment or licensing language, warranty or indemnity terms, support SLAs, notice or termination
periods, or minimum retainer commitments. You have not seen any client's agreement. Retainer
pricing follows the pricing topic's rules — no figure, no hourly rate. Someone asking what their
agreement says, wanting ownership terms in writing, or negotiating post-engagement support needs a
human.
`.trim(),
};
