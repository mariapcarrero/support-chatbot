import { z } from "zod";

import { saveEscalation } from "@/lib/db/repository";

import { emailSchema } from "./book-strategy-call";
import { defineTool } from "./types";
import { CONTACT_EMAIL } from "@/knowledge/contact";

/**
 * Short, human-quotable reference (e.g. "CAD-K3F9QX").
 *
 * `crypto.randomUUID` is available in Node 19+ and in the Workers/edge runtime, so this
 * works wherever the route runs. Uniqueness only has to hold well enough for a support
 * queue, and the column carries a unique constraint as the real guarantee.
 */
export function makeReference(): string {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `CAD-${suffix}`;
}

export const escalateToHuman = defineTool({
  name: "escalate_to_human",
  description:
    "Hand the conversation to a human at Cadre AI. Use when you cannot answer, the user asks " +
    "for a person, the user is frustrated, or the question involves contracts, compliance " +
    "documents, security questionnaires, pricing commitments, or anyone's specific account " +
    "data. Escalating early is better than guessing.",
  schema: z.object({
    category: z
      .enum([
        "contractual",
        "account_specific",
        "commercial",
        "complaint",
        "unanswerable",
        "other",
      ])
      .describe(
        "contractual = legal/compliance/security docs; account_specific = needs their account " +
          "data; commercial = quote/discount/terms; complaint = unhappy user; unanswerable = " +
          "outside the knowledge base",
      ),
    reason: z
      .string()
      .trim()
      .min(1)
      .describe("What they need, written for the colleague who will pick this up"),
    contactEmail: emailSchema
      .optional()
      .describe("Their email, only if they have given it — do not invent one"),
  }),
  async run(input, ctx) {
    const reference = makeReference();

    await saveEscalation(ctx.conversationId, {
      reference,
      category: input.category,
      reason: input.reason,
      contactEmail: input.contactEmail ?? null,
    });

    const followUp = input.contactEmail
      ? `The team will reply to ${input.contactEmail}. Do not promise a timeframe — none is published.`
      : `Ask for their email so the team can reply, or point them to ${CONTACT_EMAIL}.`;

    return {
      content:
        `Escalated as ${reference} (${input.category}). ${followUp} ` +
        `Give them the reference ${reference}. Frame this as connecting them with the right ` +
        `person, not as a failure, and do not apologise repeatedly.`,
      ui: { kind: "escalation" as const, reference, reason: input.reason },
    };
  },
});
