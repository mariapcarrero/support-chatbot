import { z } from "zod";

import { CONTACT_URL } from "@/knowledge/contact";
import { saveLead } from "@/lib/db/repository";

import { defineTool } from "./types";
import { recordedFields } from "./untrusted";

/**
 * Loose on purpose. This validates shape, not deliverability — the goal is to catch the
 * model inventing "user@example.com" or passing a name into the email field, not to
 * enforce RFC 5322. Rejecting a real address because of an unusual TLD would be a worse
 * failure than accepting a typo, which a human will catch on follow-up.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "must be a valid email address");

export const bookStrategyCall = defineTool({
  name: "book_strategy_call",
  description:
    "Record a request to speak with a Cadre AI strategist and return the contact link. Use when " +
    "someone wants to speak to a person. Collect the details conversationally first — never " +
    "invent a value for a field. This records the request and points them at the contact form; " +
    "there is no scheduling page and no time is booked.",
  schema: z.object({
    name: z.string().trim().min(1).describe("The person's full name, as they gave it"),
    email: emailSchema.describe("Their work email address"),
    company: z.string().trim().min(1).describe("Their company name"),
    topic: z
      .string()
      .trim()
      .min(1)
      .describe("What they want to discuss, in your own words based on the conversation"),
    industry: z.string().trim().optional().describe("Their industry, only if mentioned"),
    companySize: z
      .enum(["1-50", "51-200", "201-1000", "1000+"])
      .optional()
      .describe("Approximate headcount, only if mentioned"),
  }),
  async run(input, ctx) {
    await saveLead(ctx.conversationId, {
      name: input.name,
      email: input.email,
      company: input.company,
      industry: input.industry ?? null,
      companySize: input.companySize ?? null,
      interest: input.topic,
      sourceTool: "book_strategy_call",
    });

    return {
      // The recorded values are appended as delimited data rather than interpolated here.
      // `topic` and `company` are free text from the user, and this string is read in
      // operator voice — see `untrusted.ts`.
      content:
        `Their details are recorded (listed below). ` +
        `This recorded their details only — it did NOT contact anyone and no call is booked. ` +
        `You must now send them to ${CONTACT_URL} and be clear that submitting that form is the ` +
        `step that actually reaches a strategist, and that they have to do it themselves. ` +
        `It asks for four quick things: name, email, a subject, and a short message — you may ` +
        `say that to lower the barrier, but do not recite exact field labels. ` +
        `Do NOT say a call is confirmed or scheduled, that they can "pick a time", or that the ` +
        `team "will be in touch" — nothing reaches Cadre until they submit the form.\n\n` +
        recordedFields({
          name: input.name,
          email: input.email,
          company: input.company,
          industry: input.industry,
          topic: input.topic,
        }),
      ui: {
        kind: "booking" as const,
        contactUrl: CONTACT_URL,
        name: input.name,
        email: input.email,
      },
    };
  },
});
