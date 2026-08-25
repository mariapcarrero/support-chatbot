import { z } from "zod";

import { saveLead } from "@/lib/db/repository";

import { emailSchema } from "./book-strategy-call";
import { defineTool } from "./types";

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
    interest: z
      .string()
      .trim()
      .min(1)
      .describe("What they were interested in and any timing they mentioned"),
  }),
  async run(input, ctx) {
    await saveLead(ctx.conversationId, {
      name: input.name,
      email: input.email,
      company: input.company ?? null,
      industry: input.industry ?? null,
      interest: input.interest,
      sourceTool: "capture_lead",
    });

    return {
      content:
        `Noted ${input.name} (${input.email}) for follow-up. Interest: ${input.interest}. ` +
        `Confirm briefly that someone will be in touch, and do not push for a call now.`,
      ui: { kind: "lead" as const, name: input.name, email: input.email },
    };
  },
});
