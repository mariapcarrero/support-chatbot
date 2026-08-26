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
    "data. " +
    "No human is watching this chat, so this record IS the handoff — it needs a name, an " +
    "email, and a summary before it can be filed, because nobody can act on a request they " +
    "cannot reply to. Collect those conversationally first (see the system prompt), then call " +
    "this. Never invent any of them.",
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
      .describe("What the user is asking for, in one line, written for the colleague picking it up"),
    summary: z
      .string()
      .trim()
      .min(1)
      .describe(
        "Short summary of the conversation so the user does not have to repeat themselves: " +
          "the problem, what they are ultimately trying to achieve, and anything already " +
          "suggested or ruled out. Two or three sentences. " +
          "Write it from what has ALREADY been said — 'wants to discuss a contract issue, no " +
          "detail given' is a perfectly good summary. Never ask a further question just to " +
          "enrich this field; the full transcript is filed alongside it anyway.",
      ),
    contactName: z
      .string()
      .trim()
      .min(1)
      .describe("Their name, as they gave it. Required — ask for it before calling this."),
    contactEmail: emailSchema.describe(
      "Their email. Required — the team has no other way to reach them.",
    ),
    contactPhone: z
      .string()
      .trim()
      .optional()
      .describe(
        "Their phone number, only if they offered it. Ask once; never withhold the escalation " +
          "over it, and never invent one.",
      ),
  }),
  async run(input, ctx) {
    const reference = makeReference();

    await saveEscalation(ctx.conversationId, {
      reference,
      category: input.category,
      reason: input.reason,
      summary: input.summary,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone ?? null,
    });

    return {
      content:
        `Filed as ${reference} (${input.category}) for ${input.contactName} ` +
        `<${input.contactEmail}>${input.contactPhone ? `, ${input.contactPhone}` : ""}. ` +
        `The summary and the full conversation went with it, so they will not have to repeat ` +
        `themselves. ` +
        `Tell the user it is with the team, give them the reference ${reference}, and say they ` +
        `will be contacted on the email they gave. Do NOT promise a timeframe — none is ` +
        `published — and do not say anyone has been emailed or notified right now. ` +
        `**Then stop working the problem.** Do not keep suggesting fixes or asking diagnostic ` +
        `questions on this issue: it is handed over, and continuing to troubleshoot invites them ` +
        `to keep talking to you instead of waiting for the person who can actually help. Answer ` +
        `anything genuinely new, and otherwise let it rest. ` +
        `They can also reach the team directly at ${CONTACT_EMAIL}. ` +
        `Frame this as connecting them with the right person, not as a failure, and do not ` +
        `apologise repeatedly.`,
      ui: {
        kind: "escalation" as const,
        reference,
        reason: input.reason,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
      },
    };
  },
});
