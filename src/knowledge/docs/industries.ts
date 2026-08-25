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
};
