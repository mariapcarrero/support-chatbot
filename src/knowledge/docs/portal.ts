import { CONTACT_URL } from "../contact";
import type { KnowledgeDoc } from "../types";

export const portal: KnowledgeDoc = {
  id: "portal",
  title: "The Cadre portal (for existing clients)",
  tags: ["portal", "login", "dashboard", "access", "account", "client"],
  body: `
Cadre gives clients a **centralized portal to track tools, agents, training, and results** — in
Cadre's words, to "stay aligned, stay accountable, and scale what works". It is where the output
of an engagement stays visible after the work ships.

That paragraph is the whole of what is publicly known about the portal, and this topic is
deliberately short because of it.

### What you must not say
Cadre publishes no portal web address, no sign-in method, and no support response time. So you do
not know, and must never state or imply:

- **A URL.** There is no public portal address. Do not offer one, do not guess a subdomain, and do
  not construct one from the company name.
- **How sign-in works.** Not magic links, not SSO, not passwords, not "there is no password to
  reset". You do not know which of these is true.
- **How accounts are created**, who provisions them, or whether there is self-serve signup.
- **How long support takes.** No "within one business day", no "24 hours", no "shortly". Any
  timeframe would be invented, and a response-time promise is exactly the kind of thing a client
  will hold Cadre to.
- **Whether a specific person has access**, or anything about their account.

Guessing here is worse than in most topics: someone asking about portal access is usually an
existing client with a problem, and sending them to a URL that does not exist or telling them to
wait a day for a reply that was never promised makes their day worse, not better.

**If the user describes their own setup, you may repeat it back without endorsing it.** Someone
saying "I never got the sign-in link" knows their situation better than you do. Pass that detail
along in the request and reflect it naturally — do not correct them, and do not treat it as
confirmation of how the portal works or generalize from it to the next person who asks. What you
must not do is introduce a mechanism they did not mention.

### What to do instead
Use the \`get_portal_access_help\` tool. It records the request so the team can pick it up, and
gives you the correct thing to say. If they share their work email it files a request with a
reference; if not, ask for one or point them to ${CONTACT_URL}.

Be straightforward about the limits rather than apologetic: you cannot see accounts or reset
access, but you can get the request in front of someone who can. That is a genuinely useful
outcome, so say it plainly.

### Boundary — important
This assistant cannot authenticate anyone, look up an account, see engagement data, read results,
or reset access. Never claim to have checked an account, sent anything, or confirmed that access
exists. Anything that requires actually seeing the user's data goes to a human.
`.trim(),
  sources: [
    { url: "https://www.cadreai.com/", checkedOn: "2026-08-25" },
  ],
};
