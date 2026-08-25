import { z } from "zod";

import { saveMaturityAssessment } from "@/lib/db/repository";
import { InvalidScoreError, scoreMaturity } from "@/lib/maturity/scoring";

import { defineTool } from "./types";

/**
 * 1-5 rating, matching the published Maturity Index scale.
 *
 * Expressed as a literal union rather than `z.number().int().min(1).max(5)`, which is the
 * obvious way to write it and is wrong here: that emits `minimum`/`maximum`, and the API
 * rejects those on integers under `strict: true` with a 400. Since tools are sent on every
 * request, that failure is not scoped to this tool — it breaks every chat request. A literal
 * union emits `enum: [1,2,3,4,5]`, which strict mode does accept, and it constrains the
 * value just as tightly.
 */
const rating = z.literal([1, 2, 3, 4, 5]);

export const scoreAiMaturity = defineTool({
  name: "score_ai_maturity",
  description:
    "Run a quick five-question AI maturity self-check from the user's own 1-5 ratings. Explain " +
    "the five dimensions and collect a rating for each before calling this. You must never " +
    "calculate, estimate, or predict the score or tier yourself — this tool is the only source " +
    "of a score, and the number it returns is the number you report. " +
    "This is NOT Cadre's AI Maturity Index, which grades eight pillars and comes from a " +
    "strategist: it is an indicative self-assessment, and you must describe it as one rather " +
    "than letting the user believe they have received Cadre's assessment.",
  schema: z.object({
    dataReadiness: rating.describe(
      "1 = data scattered across inboxes and shared drives, 5 = governed, documented, queryable",
    ),
    toolingInfrastructure: rating.describe(
      "1 = individuals pasting into consumer chatbots, 5 = sanctioned platforms with SSO and logging",
    ),
    teamCapability: rating.describe(
      "1 = a handful of curious individuals, 5 = broad fluency plus in-house builders",
    ),
    processIntegration: rating.describe(
      "1 = experiments beside the real process, 5 = AI embedded in core workflows with owners",
    ),
    governanceRisk: rating.describe(
      "1 = no policy, 5 = clear policy, approval paths, monitoring and incident handling",
    ),
  }),
  async run(input, ctx) {
    try {
      const result = scoreMaturity(input);

      await saveMaturityAssessment(ctx.conversationId, {
        dimensionScores: input,
        overall: result.overall,
        tier: result.tier,
      });

      const breakdown = result.dimensions.map((d) => `${d.label}: ${d.score}/5`).join(", ");

      return {
        content:
          `Overall ${result.overall}/5 — tier "${result.tier}". ${breakdown}. ` +
          `${result.recommendation} ` +
          `Report these exact numbers. Remind them this is a self-assessed snapshot, not the ` +
          `full benchmarked assessment, and offer the strategist-led version.`,
        ui: {
          kind: "maturity" as const,
          overall: result.overall,
          tier: result.tier,
          dimensions: result.dimensions.map((d) => ({ label: d.label, score: d.score })),
          weakest: result.weakest.label,
          recommendation: result.recommendation,
        },
      };
    } catch (error) {
      // Schema validation already enforces 1-5, so this is genuinely unexpected. Return it
      // as a tool result rather than throwing so the model can recover by re-asking, instead
      // of the whole turn failing in the user's face.
      if (error instanceof InvalidScoreError) {
        return {
          content: `Could not score: ${error.message}. Ask the user to re-rate that dimension from 1 to 5.`,
        };
      }
      throw error;
    }
  },
});
