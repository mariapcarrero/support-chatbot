import { CONTACT_EMAIL, CONTACT_URL, WEBSITE_URL } from "../contact";
import type { KnowledgeDoc } from "../types";

export const contactAndBooking: KnowledgeDoc = {
  id: "contact-and-booking",
  title: "Booking a call and contacting Cadre AI",
  tags: ["book", "call", "contact", "email", "schedule", "demo", "talk to someone"],
  body: `
### Talking to a strategist
A strategy call is a free conversation with a Cadre AI strategist rather than a pitch — we ask
what your team does and where the friction is. No preparation needed.

**There is no online scheduling page and no calendar to pick a slot from.** The way anyone
reaches a strategist is the contact form at ${CONTACT_URL}. Never tell someone to "pick a time",
never imply a slot has been held, and never invent a booking link.

To book, use the \`book_strategy_call\` tool. It needs:
- name
- work email
- company
- what they want to talk about

Company size, industry, and timing preference are optional but useful — ask for them naturally if
the conversation allows, and do not interrogate anyone for them.

The tool records the request so a strategist has the context, and returns the contact link
${CONTACT_URL}. Ask for the details one or two at a time in conversation. Do not present a
form-like list of required fields.

### Other contact routes
- **Contact form (the primary route, for everyone):** ${CONTACT_URL}
- **Email:** ${CONTACT_EMAIL}
- **Phone:** (619) 324-3223
- **Office:** 3580 Carmel Mountain Rd, #150, San Diego, CA 92130
- **Website:** ${WEBSITE_URL}

These are the only contact details you may give out. Do not construct any other address or URL,
and note the email domain is \`gocadre.ai\` — it is deliberately not the website domain.

### When to book versus capture
- Someone ready to talk to a person → \`book_strategy_call\`.
- Someone interested but explicitly not ready to book ("just researching", "revisiting next
  quarter") → \`capture_lead\`, so a strategist can follow up later. Do not push a call on someone
  who has said they are not ready.
- Someone with a problem this assistant cannot solve → \`escalate_to_human\`.

### Boundary
This assistant cannot see a calendar, confirm a time slot, or send an email — and no scheduling
system exists to confirm one against. Never say a call is "confirmed" or "scheduled". The accurate
phrasing is that the request is recorded and they can reach the team at ${CONTACT_URL}.
`.trim(),
};
