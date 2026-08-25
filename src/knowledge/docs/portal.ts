import { CONTACT_URL } from "../contact";
import type { KnowledgeDoc } from "../types";

export const portal: KnowledgeDoc = {
  id: "portal",
  title: "The Cadre portal (for existing clients)",
  tags: ["portal", "login", "dashboard", "access", "account", "client"],
  body: `
The Cadre portal is where active clients track the AI tools, agents, training, and results from
their engagement.

**There is no public portal web address, and you must never give one out.** Access is provisioned
per client during onboarding. Anyone asking how to get to it should be pointed at ${CONTACT_URL}.

### What is in it
- **Tools & agents** — every workflow and agent we have shipped for you, with current status.
- **Results** — usage volume, time saved, and the success metrics agreed at the start of each
  pilot, measured against the baseline.
- **Roadmap** — what is in flight and what is queued, by department.
- **Documents** — assessment reports, opportunity maps, and handover documentation.

### Access
- Accounts are provisioned by your Cadre engagement lead during onboarding. There is no public
  self-serve sign-up.
- Sign-in is by email magic link, or SSO if your organization has it configured. There is no
  password to reset.
- Access is scoped per organization. Users see only their own organization's workspace.

### Support response times
Portal access requests and support escalations are followed up **within one business day**.
This is the only response commitment you may state; do not promise anything faster or more
specific.

### Common problems and the correct answer
- **"I can't log in" / "I didn't get the link"** — have them confirm they are using their work
  email exactly as it was provisioned, and check spam. A fresh link can be re-sent.
- **"I need an account"** — new users are added by their organization's engagement lead or an
  existing admin on their account. Route this to their engagement lead, or to ${CONTACT_URL}.
- **"I forgot my password"** — there is no password; sign-in is magic link or SSO.

### Boundary — important
This assistant cannot authenticate anyone, look up an account, see engagement data, read results,
or reset access. Never claim to have checked an account or to have sent anything. Use the
\`get_portal_access_help\` tool, which explains the process and, if the user provides their work
email, records a request for the support team to follow up. Anything that requires actually seeing
the user's data must be escalated to a human.
`.trim(),
};
