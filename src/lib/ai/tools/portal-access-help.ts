import { z } from "zod";

import { CONTACT_URL } from "@/knowledge/contact";
import { saveEscalation } from "@/lib/db/repository";

import { emailSchema } from "./book-strategy-call";
import { defineTool, type ToolResult } from "./types";
import { makeReference } from "./escalate-to-human";

export const getPortalAccessHelp = defineTool({
  name: "get_portal_access_help",
  description:
    "Help an existing client with accessing the Cadre portal. Use for sign-in problems, missing " +
    "magic links, or requests for an account. This explains the process and, if they give their " +
    "work email, files a request for the support team. It cannot authenticate anyone, look up " +
    "an account, or send an email — never claim it did.",
  schema: z.object({
    issue: z
      .enum(["cannot_sign_in", "no_link_received", "needs_account", "general"])
      .describe("What kind of portal problem they have"),
    email: emailSchema
      .optional()
      .describe("Their work email, only if they volunteered it — do not invent one"),
  }),
  async run(input, ctx): Promise<ToolResult> {
    const guidance: Record<typeof input.issue, string> = {
      cannot_sign_in:
        `Portal sign-in is by email magic link or SSO — there is no password to reset. Have ` +
        `them confirm they are using the work email their engagement lead provisioned, exactly ` +
        `as provisioned, and check spam for the link. Do not give out a portal web address: ` +
        `there is no public portal URL to send them to.`,
      no_link_received:
        `Portal sign-in is by email magic link or SSO — there is no password. Magic links ` +
        `most often land in spam or go to a different address than the one provisioned. Have ` +
        `them check spam and confirm the exact address. Do not give out a portal web address: ` +
        `there is no public portal URL to send them to.`,
      needs_account:
        `New portal accounts are created by their organization's Cadre engagement lead or by ` +
        `an existing admin on their account. There is no self-serve sign-up.`,
      general:
        `Portal access is by magic link or SSO, provisioned by their engagement lead — there is ` +
        `no public portal URL and no self-serve sign-up. Anyone who needs access can also reach ` +
        `the team at ${CONTACT_URL}.`,
    };

    // Only file a follow-up when we have somewhere to send it. Without an email there is
    // nothing actionable for support, so we ask for one instead of creating a dead ticket.
    if (!input.email) {
      return {
        content:
          `${guidance[input.issue]} No email was provided, so nothing has been filed. Give them ` +
          `this guidance and offer to pass it to support if they share their work email, or point ` +
          `them to ${CONTACT_URL}. Do not claim any link has been sent.`,
      };
    }

    const reference = makeReference();
    await saveEscalation(ctx.conversationId, {
      reference,
      category: "account_specific",
      reason: `Portal access (${input.issue}) for ${input.email}`,
      contactEmail: input.email,
    });

    return {
      content:
        `${guidance[input.issue]} A support request has been filed as ${reference} for ` +
        `${input.email}; the team will follow up within one business day. ` +
        `Relay the guidance above to the user — including explicitly that sign-in is by magic ` +
        `link or SSO and there is no password — then give them the reference ${reference}. ` +
        `Do not compress this into "I've logged it". State that the request is filed, not that ` +
        `a link has been sent, because no link has been sent.`,
      ui: { kind: "portal" as const, email: input.email },
    };
  },
});
