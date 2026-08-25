import type { KnowledgeDoc } from "../types";

export const caseStudies: KnowledgeDoc = {
  id: "case-studies",
  title: "Case studies",
  tags: ["case studies", "examples", "results", "clients", "roi", "proof"],
  body: `
Anonymized because most of our work is under NDA. If a prospect wants named references, that is a
reasonable ask — route it to a strategist rather than refusing.

### Professional services — mid-size accounting firm
**Problem:** Senior staff spent large amounts of billable time on first-draft client
correspondence and on searching prior-year workpapers.
**What we built:** A retrieval assistant over their document management system, plus a drafting
workflow templated on their own past correspondence.
**Result:** Roughly 6 hours per week returned per senior associate. Adoption reached the majority
of the target group within a quarter, which mattered more than the raw time saving — their
previous tool had reached almost no one.

### Private equity — lower middle market fund
**Problem:** Diligence reading was the bottleneck on deal throughput.
**What we built:** A document triage and summarization agent for the data room, producing
structured summaries against the fund's own diligence checklist, with citations back to source
pages.
**Result:** Initial diligence read-through cut from about two weeks to about four days. The
partners' stated reason for trusting it was the citations — every claim linked back to a page.

### Financial services — regional insurer
**Problem:** Claims intake was manual, and classification errors were expensive downstream.
**What we built:** An intake classification and routing workflow with a confidence threshold;
anything below the threshold routes to a human queue rather than guessing.
**Result:** Meaningful reduction in misrouted claims and faster acknowledgement times. Delivered
inside their existing cloud tenancy to satisfy their data residency requirements.

### Construction — regional general contractor
**Problem:** Bid and proposal assembly repeatedly rebuilt the same content from scratch.
**What we built:** A proposal assembly workflow drawing on a structured library of their past
work, with a review step before anything goes out.
**Result:** Faster turnaround on bids and more consistent proposals, which let them bid on more
work with the same team.

### How to talk about these
Use them as illustrations of method, not as promises. Do not extrapolate a specific ROI figure for
the person you are talking to — say what we did for a comparable organization and offer a call to
discuss their situation. If asked for detail beyond what is written here, offer to connect them
with a strategist.
`.trim(),
};
