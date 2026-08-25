import type { KnowledgeDoc } from "./types";

import { afterTheEngagement } from "./docs/after-the-engagement";
import { caseStudies } from "./docs/case-studies";
import { company } from "./docs/company";
import { contactAndBooking } from "./docs/contact-and-booking";
import { engagementModel } from "./docs/engagement-model";
import { faq } from "./docs/faq";
import { industries } from "./docs/industries";
import { maturityIndex } from "./docs/maturity-index";
import { pricing } from "./docs/pricing";
import { portal } from "./docs/portal";
import { securityAndLlmSelection } from "./docs/security-and-llm-selection";
import { services } from "./docs/services";

export type { KnowledgeDoc };

/**
 * Every knowledge document, sorted by `id`.
 *
 * The sort is load-bearing, not cosmetic: these documents are concatenated into the
 * cached system prompt, and the Anthropic prompt cache is a prefix match. If the order
 * varied between requests (module resolution order, a Set, an object's key order) the
 * cache would miss on every single request and nobody would notice except the bill.
 */
export const KNOWLEDGE_BASE: readonly KnowledgeDoc[] = [
  afterTheEngagement,
  caseStudies,
  company,
  contactAndBooking,
  engagementModel,
  faq,
  industries,
  maturityIndex,
  portal,
  pricing,
  securityAndLlmSelection,
  services,
].sort((a, b) => a.id.localeCompare(b.id));

/** Look up a single document by id. Returns undefined for unknown ids. */
export function getDoc(id: string): KnowledgeDoc | undefined {
  return KNOWLEDGE_BASE.find((doc) => doc.id === id);
}

/** All document ids, in the same deterministic order as `KNOWLEDGE_BASE`. */
export const KNOWLEDGE_IDS: readonly string[] = KNOWLEDGE_BASE.map((doc) => doc.id);
