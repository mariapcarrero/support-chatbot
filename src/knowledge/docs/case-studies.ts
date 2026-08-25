import type { KnowledgeDoc } from "../types";

export const caseStudies: KnowledgeDoc = {
  id: "case-studies",
  title: "Case studies",
  tags: ["case studies", "examples", "results", "clients", "roi", "proof"],
  body: `
These are Cadre's published case studies. Every one is anonymized as a "Non-Disclosed Company" —
that is how Cadre publishes them, not a limitation of this assistant. If a prospect wants named
references, that is a reasonable ask: route it to a strategist rather than refusing.

Figures below are quoted from Cadre's own published results. Use them exactly as written. Do not
round them, combine them, average them, or reframe one client's number as what another company
should expect.

### Professional services — AI lead processing agent
**45 hours saved monthly.** A sales coordinator manually monitored a shared inbox across five
branches, spending 3-5 minutes per lead on CRM entry and 30-45 minutes each morning importing and
assigning leads. Cadre built a workflow automation that monitors the inbox 24/7, classifies
emails, checks the CRM for existing customers, and distributes tasks by real-time availability and
branch rules. Now 1,500+ emails and 650+ leads are handled monthly.

### Manufacturing & logistics — AI supplier automation
**220 hours saved monthly, processing time cut 60%.** 200-300 supplier confirmation emails a day,
across hundreds of suppliers with different formats, were being cross-referenced by hand between
Zendesk and NetSuite at 2-6 minutes each. The automation extracts and matches supplier data
against NetSuite, auto-confirms when data aligns, and flags exceptions for human review at 90%
accuracy. Matching orders now take zero manual time.

### Manufacturing & logistics — AI proposal automation
**8,000+ hours saved annually.** Proposal preparation took 1-2 days per option — copying fixture
values, waiting on rebate calculations, translating part IDs, looking up prices. Cadre standardized
part IDs for automated lookup, auto-estimates rebates per location, and cut manual work to about
10% for review. Proposals now take 20 minutes, and multiple options can run at once. A client quote:
"AI now does 90% of every application."

### Hospitality — AI-powered housing visibility
**$420,000 saved annually.** An outdated booking system gave no occupancy visibility, so teams
booked rooms the same day others departed — each incident costing $1,000 in expedited cleaning,
around $35,000 a month in "flip day" expenses. Cadre built a booking visibility dashboard
integrated with their CRM that blocks conflicting same-day bookings automatically.

### Real estate — AI scheduling system
**57% increase in daily efficiency**, inspection capacity up 50%, **72% reduction in fuel
expenses**, and **$136,000 revenue increase per field specialist**. Field specialists had been
managing inspections through spreadsheet exports, several communication platforms, and physical
letter stuffing while driving inefficient routes. Cadre built a field scheduling platform with
route optimization, territory-based assignment, and 6+ integrations, processing 25+ filtering
conditions and scheduling two weeks ahead.

### Manufacturing & logistics — AI email agent
**3,500 hours saved annually.** Manual email management fell from 9 hours per week to roughly 55
minutes. The agent auto-organizes inboxes, drafts responses from historical patterns, and unifies
email threads with call recordings — 4,000+ emails a month across 55 sales reps.

### Financial services / mortgage & lending — Loan Intelligence Assistant (LIA)
**2,500 hours saved annually.** Loan officers were navigating complex guidelines across
disconnected systems, taking 1-2 days per loan while borrowers waited. A custom AI chatbot unified
the loan tools into one platform with instant guideline access, investor matching, and borrower
communications. 27 loan officers use it daily; 3,960+ chat inquiries in the first 90 days.

### Professional services — AI voice and chat agents
**1,500 hours saved annually.** Consultation requests were handled manually across phone and SMS.
Voice and chat agents now check availability and book automatically, handling 500-700 appointment
requests a month with 24/7 availability.

### How to talk about these
Use them as illustrations of method, not as promises. **Never extrapolate a figure for the person
you are talking to** — "this could save you 8,000 hours" is an invented claim even though the 8,000
is real. Say what was done for a comparable organization, then offer a call to discuss their
situation. If asked for detail beyond what is written here, connect them with a strategist.
`.trim(),
};
