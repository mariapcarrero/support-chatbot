import { z } from "zod";

import { saveLead } from "@/lib/db/repository";

import { emailSchema } from "./book-strategy-call";
import { defineTool } from "./types";
import { recordedFields } from "./untrusted";

/**
 * What the `interest` column carries when the model filed the lead without one. Says plainly
 * that nothing was recorded, rather than an empty cell that looks like a rendering fault.
 */
const INTEREST_NOT_STATED = "Not stated";

export const captureLead = defineTool({
  name: "capture_lead",
  description:
    "Record the details of someone who is interested in Cadre AI but has said they are not " +
    "ready to book a call, so a strategist can follow up later. Use this instead of " +
    "book_strategy_call when the person is researching, comparing options, or looking at a " +
    "future quarter. Do not push a call on someone who has declined one.",
  schema: z.object({
    name: z.string().trim().min(1).describe("The person's name"),
    email: emailSchema.describe("Their email address"),
    company: z.string().trim().optional().describe("Their company, only if mentioned"),
    industry: z.string().trim().optional().describe("Their industry, only if mentioned"),
    /**
     * Optional on purpose, for the reason `escalate_to_human.summary` is (see `ce9ec80`).
     *
     * As a required field this stalled the tool: handed a name and an email by someone who
     * had said only that they were "looking into AI", the model asked what specifically they
     * were interested in and filed nothing. The instruction not to do that was already in the
     * prompt AND in this description, and it still dropped the lead roughly two runs in three.
     * A required field is a thing to go and fetch, and no wording reliably beats that.
     *
     * The prompt already told the model this tool needs "a name and email" — so the schema was
     * contradicting the prompt, and the schema wins. Now they agree.
     *
     * The column is `notNull`, so `run` falls back to a literal rather than letting the row
     * carry an empty string that reads like a UI bug in the ops inbox.
     */
    interest: z
      .string()
      .trim()
      .optional()
      .describe(
        "What they were interested in and any timing they mentioned, in their own words. " +
          "Optional: write it from what they have ALREADY said, or leave it out entirely. " +
          "'Just researching, revisiting next quarter' is a complete answer; so is omitting " +
          "it. Never ask a further question to fill this in before calling the tool.",
      ),
  }),
  async run(input, ctx) {
    await saveLead(ctx.conversationId, {
      name: input.name,
      email: input.email,
      company: input.company ?? null,
      industry: input.industry ?? null,
      interest: input.interest?.trim() || INTEREST_NOT_STATED,
      sourceTool: "capture_lead",
    });

    return {
      // Instructions first, then the user's own words as delimited data. Interpolating
      // `interest` into this prose would put user-controlled text inside operator voice —
      // see `untrusted.ts`.
      content:
        `Recorded for follow-up. Confirm briefly that someone will be in touch, and do not ` +
        `push for a call now. Read the details back only if it helps confirm them.\n\n` +
        recordedFields({
          name: input.name,
          email: input.email,
          company: input.company,
          industry: input.industry,
          interest: input.interest,
        }),
      ui: { kind: "lead" as const, name: input.name, email: input.email },
    };
  },
});
