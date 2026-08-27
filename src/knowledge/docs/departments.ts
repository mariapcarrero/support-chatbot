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

### Answering "what would you actually do for my team?"

Each page describes the same shape: a handful of concrete workflow problems that function
recognises, and AI applied to those specific workflows. The published problems are things like
manual coordination and scattered process knowledge in operations, code review bottlenecks and
documentation debt in technology, content bottlenecks and slow performance optimization in
marketing.

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
