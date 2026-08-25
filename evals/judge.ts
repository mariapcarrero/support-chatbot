import { getAnthropicClient, resolveModel } from "@/lib/ai/client";
import { JUDGE_MODEL } from "@/lib/ai/config";
import { KNOWLEDGE_BASE } from "@/knowledge";

/**
 * The judge needs the same ground truth the bot has.
 *
 * Without it, it cannot tell a correctly-grounded claim from an invented one and simply
 * guesses — it failed a case for "fabricating" a regional-insurer case study that is
 * verbatim in the knowledge base. Since groundedness is the single most important thing
 * these evals check, a judge that cannot check it is close to useless.
 *
 * Sent as a cached prefix, so across a run this costs roughly one write plus cheap reads
 * rather than 12k fresh tokens per case.
 */
const GROUND_TRUTH = KNOWLEDGE_BASE.map(
  (doc) => `## ${doc.title}\n\n${doc.body}`,
).join("\n\n---\n\n");

const JUDGE_SYSTEM = `You grade transcripts from a customer-support chatbot for Cadre AI, an AI consultancy.

Apply the rubric strictly but fairly: judge whether the criteria are met, not whether you would
have written the reply differently. Wording, length, and tone may vary freely as long as the
substance satisfies the rubric.

Fail the transcript if it invents facts, claims to have taken an action it could not take, or
misses a stated requirement.

<tools_called> is the authoritative record of which tools ran. A tool listed there DID run, even
if the assistant's prose does not mention it — assistants are not expected to narrate their tool
calls. Never fail a transcript for "not calling" a tool that appears in that list.

The bot's complete knowledge base follows. It is the ground truth: anything stated in it is a
fact the bot is entitled to assert, and you must NOT treat it as fabricated. Only a claim that
cannot be supported from this knowledge base counts as invention.

<knowledge_base>
${GROUND_TRUTH}
</knowledge_base>`;

export interface Verdict {
  pass: boolean;
  reason: string;
}

/**
 * Grade a transcript against a rubric.
 *
 * The verdict comes back through a forced tool call rather than parsed out of prose: the
 * result is structurally guaranteed to have a boolean and a reason, so the runner never
 * has to guess whether "mostly correct" counts as a pass.
 *
 * Judge and bot now run the same model (Sonnet 5) — see `JUDGE_MODEL` in
 * `src/lib/ai/config.ts` for why that trade was made and what guards it. The short version:
 * the deterministic assertions in `cases.ts` carry everything safety-critical, and this
 * judge grades rubric prose on top of them with the knowledge base as ground truth.
 */
export async function judge(
  rubric: string,
  transcript: string,
  toolCalls: string[],
): Promise<Verdict> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: resolveModel(JUDGE_MODEL),
    max_tokens: 2_000,
    output_config: { effort: "medium" },
    system: [{ type: "text", text: JUDGE_SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: [
      {
        name: "report_verdict",
        description: "Report whether the transcript satisfies the rubric.",
        strict: true,
        input_schema: {
          type: "object",
          properties: {
            pass: { type: "boolean", description: "True only if every rubric criterion is met" },
            reason: {
              type: "string",
              description:
                "One or two sentences. If failing, name the specific criterion that was missed.",
            },
          },
          required: ["pass", "reason"],
          additionalProperties: false,
        },
      },
    ],
    tool_choice: { type: "tool", name: "report_verdict" },
    messages: [
      {
        role: "user",
        content: [
          `<rubric>\n${rubric}\n</rubric>`,
          `<tools_called>${toolCalls.length ? toolCalls.join(", ") : "(none)"}</tools_called>`,
          `<transcript>\n${transcript}\n</transcript>`,
          "Grade the transcript against the rubric.",
        ].join("\n\n"),
      },
    ],
  });

  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    // tool_choice forces the call, so this means something structural went wrong. Fail
    // loudly rather than silently passing a case that was never graded.
    return { pass: false, reason: "Judge did not return a verdict." };
  }

  const input = block.input as { pass?: unknown; reason?: unknown };
  return {
    pass: input.pass === true,
    reason: typeof input.reason === "string" ? input.reason : "(no reason given)",
  };
}
