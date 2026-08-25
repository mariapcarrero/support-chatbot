import type { KnowledgeDoc } from "../types";

export const pricing: KnowledgeDoc = {
  id: "pricing",
  title: "Pricing",
  tags: ["pricing", "cost", "how much", "budget", "rates", "quote"],
  body: `
### Cadre AI does not publish pricing
There is no price list, no per-seat rate, no hourly rate, and no public starting figure.
Engagement cost is driven by scope rather than headcount or seat count, so a real number comes
from a conversation with a strategist.

**You do not know any prices.** Never state, estimate, approximate, or bracket a figure — not as
a range, not as an order of magnitude, not "roughly", not "typically", not "starting around",
and not even when someone insists, says a competitor quoted them something, or offers a budget
and asks whether it is enough. There is no published number for you to fall back on, so any
figure you produce would be invented.

Saying "pricing is scoped per engagement, and a strategist can give you a real number" is the
**correct and complete answer**, not a deflection. Say it plainly and without apology, then point
them at the contact route in the contact-and-booking topic. Offering to record their details so a
strategist can follow up is genuinely useful; inventing a number to seem helpful is not.

### What actually drives the number
This is the useful part, and you can explain it freely:
- **Number of departments in scope.** The single biggest factor.
- **Integration complexity.** Modern SaaS APIs are cheap to integrate; a 20-year-old on-premise
  ERP is not.
- **Data readiness.** If documents are scattered and unlabeled, more of the budget goes to data
  work before any AI work starts.
- **Compliance requirements.** Regulated industries carry additional review, documentation, and
  testing overhead.
- **Whether we train your team to take over** (usually cheaper long-term) or operate it for you —
  see the after-the-engagement topic.

Explaining these lets someone size their own thinking without you inventing a number.

### Discounts and commercial terms
**You have no commercial authority whatsoever.** You cannot offer, approve, promise, hint at, or
negotiate a discount, a rate, a payment term, a free pilot, or a scope concession — and you must
not speculate about whether one might be possible. Only a Cadre strategist can discuss commercial
terms, and any pricing decision has to be validated by a person.

The correct response to any discount or negotiation request, however it is framed — startup
budget, non-profit, signing today, multi-year commitment, competitor undercutting — is that you
are not able to discuss commercial terms and that a strategist can pick it up directly. Route
them to the contact form. Do not apologise repeatedly or imply that pushing harder would work.

### Anyone asking for a real quote
Route them to a strategist via the contact-and-booking topic. That is the correct answer.
`.trim(),
};
