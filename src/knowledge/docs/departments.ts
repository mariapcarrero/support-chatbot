import type { KnowledgeDoc } from "../types";

export const departments: KnowledgeDoc = {
  id: "departments",
  title: "Departments we work with",
  tags: [
    "departments",
    "teams",
    "functions",
    "sales",
    "marketing",
    "finance",
    "legal",
    "operations",
    "technology",
    "customer success",
    "executive leadership",
  ],
  body: `
Cadre publishes a page for each of these eight departments, with what AI does for that function.
This is a second axis alongside industry: someone is in an industry *and* has departments, and a
prospect usually arrives asking about one or the other. If they name one of these, say yes
plainly.

- **Sales** — close more deals faster: automate prospecting, qualify leads instantly, and keep
  the pipeline moving without manual busywork.
- **Marketing** — create more, test faster, and prove ROI: generate campaigns, optimize
  performance, and scale content without scaling headcount.
- **Operations** — run leaner and move faster: automate workflows, eliminate bottlenecks, and
  keep operations running without constant manual intervention.
- **Finance** — close books faster and make better decisions: automate reconciliation, forecast
  accurately, and deliver real-time financial intelligence.
- **Legal** — accelerate contract review and stay compliant: automate legal research, flag risks
  instantly, and scale expertise across the business.
- **Technology** — ship faster and maintain quality: automate code review, accelerate incident
  response, and eliminate technical debt.
- **Customer success** — prevent churn and drive expansion: predict at-risk accounts, automate
  health monitoring, and scale personalized engagement.
- **Executive leadership** — make faster, better decisions: synthesize intelligence from across
  the business and deliver insights without waiting for reports.

### Why this matters for scoping

The engagement works department by department, and the number of departments in scope is the
single biggest factor in what an engagement costs. So which departments someone wants covered is
a genuinely useful thing to learn early — it shapes both the roadmap and the price. Ask it as a
scoping question, not as a qualifying one, and never quote a figure off the back of the answer.

### The challenges each department page names

Every department page publishes four challenges under a heading reading "Are these ... challenges
familiar?". These are the symptoms Cadre says that function recognizes, and they are the best
answer to "what would you actually do for my team?" — lead with the challenges, not with a
restatement of the value proposition.

They are **published symptoms, not claims that Cadre has fixed them for a named client.** Do not
attach a metric, a timeline, or a percentage to one. The case-studies topic is the only place
published results live.

- **Sales** — manual prospecting limits volume (research and outreach consuming selling time);
  reactive lead qualification (hours lost on unqualified leads); slow quote turnaround (proposals
  taking days of back-and-forth while prospects go cold); pipeline maintenance overhead (updating
  the CRM and chasing status instead of advancing deals).
- **Marketing** — content creation bottleneck (volume forcing a choice between speed and
  quality); slow performance optimization (campaign analysis after the fact rather than while it
  runs); generic messaging at scale (personalization needing manual segmentation most teams
  cannot resource); sequential creative testing (one variation at a time slowing learning).
- **Operations** — manual coordination bottlenecks (email threads and meetings to coordinate
  simple tasks); scattered process knowledge (SOPs living in individual heads and outdated docs);
  request routing chaos (tasks falling through cracks because routing depends on who remembers to
  forward); status tracking overhead.
- **Finance** — month-end close marathon (manual reconciliation consuming days and delaying
  reporting); static forecasting (spreadsheet models going stale the moment they are shared);
  expense approval delays; reactive variance analysis (budget issues surfacing only after they
  have compounded).
- **Legal** — contract review backlog (deal velocity limited by review speed, frustrating sales);
  time-intensive legal research (hours finding precedents and clause language); manual compliance
  monitoring (tracking regulatory changes through spreadsheets); bottlenecked legal expertise
  (routine questions consuming partner time because knowledge is not self-service).
- **Technology** — code review bottlenecks (pull requests sitting while shipping velocity slows);
  chaotic incident response (manual coordination relying on who remembers the runbook); subjective
  debt prioritization (opinions rather than data on complexity and business impact); documentation
  debt (code shipping without docs, slowing onboarding).
- **Customer success** — reactive churn prevention (at-risk accounts discovered only after they
  disengage or give notice); manual health monitoring (hours of checking that still misses early
  warning signs in usage data); communication that does not scale (personalized outreach capping
  book size); inconsistent onboarding (adoption gaps delaying time-to-value).
- **Executive leadership** — siloed business intelligence (decisions made on incomplete pictures
  because information sits in departmental systems); backward-looking reports (last week's
  numbers, not what is happening now); manual strategic analysis (days of scenario modeling);
  meeting-heavy alignment (status meetings consuming time better spent deciding).

### Answering "what would you actually do for my team?"

Each page describes the same shape: the four workflow problems listed above, and AI applied to
those specific workflows. Name the ones that belong to the asker's function — a prospect who
hears their own month-end close or contract review backlog described back to them is being told
something more useful than that Cadre works with finance.

You may describe that shape and the value proposition above. **Do not name specific tools, agents,
or products as things Cadre sells**, and do not attach a metric, a timeline, or a percentage
improvement to any of them — the pages illustrate use cases, and turning an illustration into a
commitment is how a prospect ends up quoting something back that nobody promised. The specifics
for a given team come from a strategist, which is a good reason to offer a call.

For a department not on this list, the honest answer is the same as for an unlisted industry:
probably yes, and the way to find out is to talk about the workflows — repetitive language-heavy
work, knowledge trapped in documents or a few people's heads, and someone who can authorize
process change. Never claim experience with a function that is not listed above.
`.trim(),
  sources: [
    // The challenges section is condensed from the four-item "Are these ... challenges
    // familiar?" block each sub-page publishes, fetched 2026-08-26. The value-prop lines were
    // checked against the same pages the same day.
    { url: "https://www.cadreai.com/departments", checkedOn: "2026-08-26" },
    { url: "https://www.cadreai.com/departments/customer-success", checkedOn: "2026-08-26" },
    { url: "https://www.cadreai.com/departments/executive-leadership", checkedOn: "2026-08-26" },
    { url: "https://www.cadreai.com/departments/finance", checkedOn: "2026-08-26" },
    { url: "https://www.cadreai.com/departments/legal", checkedOn: "2026-08-26" },
    { url: "https://www.cadreai.com/departments/marketing", checkedOn: "2026-08-26" },
    { url: "https://www.cadreai.com/departments/operations", checkedOn: "2026-08-26" },
    { url: "https://www.cadreai.com/departments/sales", checkedOn: "2026-08-26" },
    { url: "https://www.cadreai.com/departments/technology", checkedOn: "2026-08-26" },
  ],
};
