import { z } from "zod";

import { CONTACT_URL } from "@/knowledge/contact";
import { saveEscalation } from "@/lib/db/repository";

import { emailSchema } from "./book-strategy-call";
import { defineTool, type ToolResult } from "./types";
import { makeReference } from "./escalate-to-human";

export const getPortalAccessHelp = defineTool({
  name: "get_portal_access_help",
  description:
    "File a request for an existing client who cannot get into the Cadre portal, or who needs " +
    "access. If they give their work email this records a request with a reference for the " +
    "support team. It cannot authenticate anyone, look up an account, send anything, or tell " +
    "them how sign-in works — Cadre publishes none of that. Never claim it did.",
  schema: z.object({
    issue: z
      .enum(["cannot_access", "needs_account", "general"])
      .describe(
        "cannot_access: they have an account but cannot get in. needs_account: they need " +
          "access set up. general: anything else about the portal.",
      ),
    email: emailSchema
      .optional()
      .describe("Their work email, only if they volunteered it — do not invent one"),
  }),
  async run(input, ctx): Promise<ToolResult> {
    // Every string here is about what happens next, never about how the portal works.
    // Cadre publishes no sign-in method, no URL, and no response time, so guidance that
    // explained any of those would be invented — see the `portal` knowledge document.
    const guidance: Record<typeof input.issue, string> = {
      cannot_access:
        `You cannot see accounts or reset access, and you do not know how portal sign-in ` +
        `works, so do not speculate about passwords, links, or SSO, and do not give out a ` +
        `portal address. Say plainly that you are putting this in front of the team who can ` +
        `check the account.`,
      needs_account:
        `You do not know how access is provisioned, so do not describe the process. Say that ` +
        `the request goes to the team who set access up.`,
      general:
        `Do not state a portal address, a sign-in method, or a response time — none are ` +
        `published. Anyone who needs access can also reach the team at ${CONTACT_URL}.`,
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
        `${input.email}. Give them the reference ${reference} and say the team will follow ` +
        `up — but do NOT attach a timeframe to that, because Cadre publishes none. ` +
        `Do not compress this into "I've logged it": state that the request is filed and that ` +
        `nothing has been sent to them, because nothing has.`,
      ui: { kind: "portal" as const, email: input.email },
    };
  },
});
