import type { KnowledgeDoc } from "../types";

export const industries: KnowledgeDoc = {
  id: "industries",
  title: "Industries we serve",
  tags: ["industries", "verticals", "do you work with", "sectors", "fit"],
  body: `
These are the nine industries Cadre publishes, with what Cadre says AI does for each. If someone
names one of these, say yes plainly — do not hedge as though you were unsure.

- **Professional services** — turn billable hours into scalable profit: automate delivery,
  accelerate timelines, and let experts focus on the work only they can do.
- **Private equity** — accelerate deal flow, compress due diligence timelines, and extract more
  value from portfolio companies.
- **Financial services** — accelerate client onboarding, automate compliance, and deliver
  personalized advice, turning regulatory burden into advantage.
- **Mortgage & lending** — close loans faster and protect margins: automate underwriting and
  accelerate approvals.
- **Real estate** — automate property analysis, qualify leads instantly, and keep the pipeline
  moving.
- **Construction** — win more bids and protect margins: automate takeoffs, track project health,
  keep jobs on schedule.
- **Manufacturing & logistics** — eliminate downtime, optimize inventory, and accelerate
  fulfillment by predicting problems before they happen.
- **Retail & e-commerce** — increase conversion, reduce returns, and maximize lifetime value,
  from inventory through checkout.
- **Hospitality** — personalize service, predict demand, and run the property at peak efficiency.

Use the full names — "Manufacturing & logistics", not "manufacturing"; "Retail & e-commerce", not
"retail" — because the scope is wider than the short version suggests and someone in logistics or
e-commerce should recognize themselves.

Several of these have published results you can cite: professional services, manufacturing &
logistics, hospitality, real estate, and mortgage & lending all appear in the case-studies topic.
Naming a concrete outcome in the asker's own industry is far stronger than confirming the industry
is on a list.

### The challenges each industry page names

Every industry page publishes four challenges under a heading reading "Are these ... challenges
familiar?". These are the symptoms Cadre says that industry recognizes, and they are the best
answer to "what problems do you solve for us?" — lead with the challenges, not with a case study.

They are **published symptoms, not claims that Cadre has fixed them for a named client.** Do not
attach a metric, a timeline, or a percentage to one. Where a published result genuinely exists it
lives in the case-studies topic; cite it from there, and only for the industry it belongs to.

- **Professional services** — billable hour ceiling (revenue capped by the hours the team can
  bill); manual document work (proposals, contracts, and research eating billable hours);
  scattered knowledge (expertise in individual minds and inboxes rather than searchable systems);
  client update overhead.
- **Private equity** — reactive deal sourcing (seeing opportunities only once they hit the
  market); manual due diligence (CIM review, contract analysis, and financial deep-dives eating
  weeks of partner time); fragmented relationship intelligence (warm intros scattered across
  emails and memories); backward-looking portfolio monitoring (problems visible in board decks,
  not real-time data).
- **Financial services** — slow client onboarding (KYC and account opening taking weeks);
  compliance burden (regulatory reporting and audit prep consuming growth resources); generic
  advisory at scale (personalized advice requiring manual analysis); reactive risk management
  (fraud surfacing after losses).
- **Mortgage & lending** — slow underwriting (manual document review and verification);
  documentation back-and-forth (income and asset verification over endless email threads);
  reactive rate competition; pipeline blindness (loans visible as at-risk only after they fall
  out).
- **Real estate** — slow property analysis (manual comps and market research); reactive lead
  qualification; transaction coordination chaos (email threads, manual follow-ups, status
  chasing); delayed market intelligence.
- **Construction** — time-intensive takeoffs (manual quantity takeoffs and estimating);
  reactive project management (issues visible only after they have delayed the schedule); change
  order chaos (scope creep eroding margin); static resource planning (labor and equipment
  schedules that cannot adapt to weather or delays).
- **Manufacturing & logistics** — reactive maintenance (equipment failing without warning);
  inventory guesswork (stockouts that halt production, excess that locks up capital); static
  production schedules; fragmented supply chain visibility (delays discovered after they hit
  delivery dates).
- **Retail & e-commerce** — generic personalization (recommendations that miss, costing
  conversion and average order value); inventory blind spots (stockouts or margin-killing
  markdowns); support team overload (repetitive questions crowding out complex issues); reactive
  fraud prevention (returns abuse and fraud surfacing after losses).
- **Hospitality** — reactive staffing (overstaffed and burning labor cost, or understaffed and
  delivering poor guest experiences); static pricing (manual revenue management missing dynamic
  pricing opportunities); generic guest communication (personalization at scale requiring time
  staff do not have); coordination gaps (manual handoffs between housekeeping, maintenance, and
  front desk).

Each page also lists named example agents — "Demand Forecasting Optimizer", "Guest Preference
Manager", and so on. **Do not name those as products Cadre sells.** They illustrate use cases; the
specifics for a given company come from a strategist, which is a good reason to offer a call.

### How to answer "do you work with my industry?"
For an industry not listed, the honest answer is: probably yes, and here is how to find out. The
method starts from *workflows* rather than a vertical template, so what matters is:

- Repetitive, language-heavy work done by expensive people.
- Knowledge trapped in documents, email, or a handful of experts' heads.
- A decision-maker who can actually authorize process change.

If those are present, Cadre can usually help regardless of sector. Ask about their workflows
rather than guessing — and **never claim experience in an industry that is not listed above**.
"We've done a lot of work in veterinary practices" is an invented claim; "that sounds like a fit,
here's why" is not.

Cadre works with companies of all sizes, and with B2B *and* B2C services businesses — do not
narrow this to B2B or to an employee-count range, neither of which is published.

### Where the fit is poor
- Organizations wanting a single one-off prompt or a training session with no follow-through.
- Teams looking to outsource an existing engineering backlog unrelated to AI.

Saying so early is better than selling an engagement that will not work.
`.trim(),
  sources: [
    { url: "https://www.cadreai.com/industries", checkedOn: "2026-08-25" },
    { url: "https://www.cadreai.com/industries/hospitality", checkedOn: "2026-08-26" },
    { url: "https://www.cadreai.com/industries/mortgage-lending", checkedOn: "2026-08-26" },
    // Added 2026-08-26. The per-industry value propositions above were originally taken from
    // the /industries index and were correct, but the seven sub-pages had never been opened —
    // so nothing here would have noticed one of them changing. Each was checked against the
    // line it supports; all matched.
    //
    // Re-fetched 2026-08-26 for the challenges section: all nine sub-pages publish a four-item
    // "Are these ... challenges familiar?" block, and the wording above is condensed from those
    // blocks verbatim. The bot previously had no answer to "what problems do you solve for my
    // industry?" and fell back to quoting a case study, which answers a different question.
    { url: "https://www.cadreai.com/industries/construction", checkedOn: "2026-08-26" },
    { url: "https://www.cadreai.com/industries/financial-services", checkedOn: "2026-08-26" },
    { url: "https://www.cadreai.com/industries/manufacturing-logistics", checkedOn: "2026-08-26" },
    { url: "https://www.cadreai.com/industries/private-equity", checkedOn: "2026-08-26" },
    { url: "https://www.cadreai.com/industries/professional-services", checkedOn: "2026-08-26" },
    { url: "https://www.cadreai.com/industries/real-estate", checkedOn: "2026-08-26" },
    { url: "https://www.cadreai.com/industries/retail-e-commerce", checkedOn: "2026-08-26" },
  ],
};
