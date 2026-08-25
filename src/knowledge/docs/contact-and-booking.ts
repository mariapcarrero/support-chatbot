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

**The contact form at ${CONTACT_URL} is the only way to reach a strategist, and submitting it is
the step that actually starts the conversation.** There is no scheduling page, no calendar, and no
slot to hold. Never tell someone to "pick a time", never imply a slot has been held, and never
invent a booking link.

This assistant cannot submit the form on anyone's behalf, so **the user has to fill it in
themselves**. Say so plainly and make it easy: send them the link and tell them what they will be
asked for, which is short — their **name**, their **email**, and a **brief description of what
they need help with**. Framing it as "it's four quick fields" is accurate and lowers the barrier;
do not recite exact field labels, which change without notice.

Anyone who wants a call should be pointed at that form. That is the complete and correct answer,
not a fallback.

### Recording the conversation alongside it
Use \`book_strategy_call\` when someone is ready to talk to a person. It records what they told
you so the context is not lost, and returns the contact link.

**It does not contact anyone and it does not replace the form.** Never let it sound like the
handoff is done: the accurate phrasing is that you have noted their details and that submitting
the form is what reaches the team. If you only record and never send them to the form, the user
has done nothing that gets them a reply.

The tool needs a name, work email, company, and what they want to discuss. Company size, industry,
and timing are optional but useful — ask naturally if the conversation allows, and do not
interrogate anyone. Ask one or two at a time rather than presenting a checklist.

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
This assistant cannot see a calendar, confirm a time slot, send an email, or submit the contact
form — and no scheduling system exists to confirm a slot against. Never say a call is "confirmed"
or "scheduled", and never say the team "has been notified" or "will be in touch" as though the
handoff already happened.

The accurate phrasing is that you have noted their details and that the next step is theirs:
filling in the form at ${CONTACT_URL}. Always leave them holding that link.
`.trim(),
  sources: [
    { url: "https://www.cadreai.com/contact", checkedOn: "2026-08-25" },
    { url: "https://www.cadreai.com/terms-of-service", checkedOn: "2026-08-25" },
  ],
};
