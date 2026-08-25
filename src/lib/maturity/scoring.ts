/**
 * AI Maturity Index scoring.
 *
 * Deliberately pure, deterministic TypeScript rather than something the model computes.
 * The model's job is to elicit five self-ratings conversationally; the score itself is a
 * product artifact that must be reproducible, testable, and identical for identical
 * inputs. An LLM doing arithmetic in prose is neither.
 *
 * The tiers here MUST match the table in `src/knowledge/docs/maturity-index.ts`. If you
 * change one, change the other — `scoring.test.ts` pins the boundaries.
 */

export const DIMENSIONS = [
  {
    key: "dataReadiness",
    label: "Data Readiness",
    lowAnchor: "scattered across inboxes and shared drives",
    highAnchor: "governed, documented, queryable",
  },
  {
    key: "toolingInfrastructure",
    label: "Tooling & Infrastructure",
    lowAnchor: "individuals pasting into consumer chatbots",
    highAnchor: "sanctioned platforms with SSO, logging, environment separation",
  },
  {
    key: "teamCapability",
    label: "Team Capability",
    lowAnchor: "a handful of curious individuals",
    highAnchor: "broad fluency plus in-house people who can build and assess",
  },
  {
    key: "processIntegration",
    label: "Process Integration",
    lowAnchor: "experiments living beside the real process",
    highAnchor: "AI steps embedded in core workflows with defined ownership",
  },
  {
    key: "governanceRisk",
    label: "Governance & Risk",
    lowAnchor: "no policy",
    highAnchor: "clear policy, approval paths, monitoring, incident handling",
  },
] as const;

export type DimensionKey = (typeof DIMENSIONS)[number]["key"];

export type DimensionScores = Record<DimensionKey, number>;

export type Tier = "Exploring" | "Experimenting" | "Operationalizing" | "Scaling" | "Leading";

export interface MaturityResult {
  readonly overall: number;
  readonly tier: Tier;
  readonly dimensions: { key: DimensionKey; label: string; score: number }[];
  /** Lowest-scoring dimension — the constraint, and where we recommend starting. */
  readonly weakest: { key: DimensionKey; label: string; score: number };
  readonly recommendation: string;
}

/**
 * Tier bands, ordered low to high. `maxExclusive` is exclusive so the bands are gapless
 * and total across the 1.0-5.0 range; the final band uses Infinity to catch a perfect 5.0.
 */
const TIERS: { tier: Tier; maxExclusive: number; guidance: string }[] = [
  {
    tier: "Exploring",
    maxExclusive: 2.0,
    guidance:
      "Start with education and one narrow, high-visibility pilot. The goal at this stage is a concrete win people can see, not a broad programme.",
  },
  {
    tier: "Experimenting",
    maxExclusive: 3.0,
    guidance:
      "There is real usage but no coordination, so effort is scattering. Consolidate onto sanctioned tooling and pick two or three workflows to do properly.",
  },
  {
    tier: "Operationalizing",
    maxExclusive: 4.0,
    guidance:
      "Workflows are in production. The work now shifts to measurement and governance so quality is monitored rather than assumed.",
  },
  {
    tier: "Scaling",
    maxExclusive: 4.5,
    guidance:
      "This is working practice across several departments. Focus on repeatability, enablement, and making the next rollout cheaper than the last.",
  },
  {
    tier: "Leading",
    maxExclusive: Infinity,
    guidance:
      "AI is part of how the business operates. The question becomes durable advantage: proprietary data, compounding workflows, and internal capability.",
  },
];

const MIN_SCORE = 1;
const MAX_SCORE = 5;

/** Thrown when a dimension score is outside the documented 1-5 integer scale. */
export class InvalidScoreError extends Error {
  constructor(key: string, value: number) {
    super(`Score for "${key}" must be an integer between 1 and 5, received ${value}`);
    this.name = "InvalidScoreError";
  }
}

function tierFor(overall: number): { tier: Tier; guidance: string } {
  // TIERS is ordered ascending and the last band is unbounded, so this always matches.
  const band = TIERS.find((t) => overall < t.maxExclusive) ?? TIERS[TIERS.length - 1];
  return { tier: band.tier, guidance: band.guidance };
}

/**
 * Score an assessment.
 *
 * @throws {InvalidScoreError} if any dimension is not an integer in [1, 5].
 */
export function scoreMaturity(scores: DimensionScores): MaturityResult {
  const dimensions = DIMENSIONS.map((dim) => {
    const score = scores[dim.key];
    if (!Number.isInteger(score) || score < MIN_SCORE || score > MAX_SCORE) {
      throw new InvalidScoreError(dim.key, score);
    }
    return { key: dim.key, label: dim.label, score };
  });

  const sum = dimensions.reduce((acc, d) => acc + d.score, 0);
  // Round to one decimal to match the published 1.0-5.0 scale. Computed from the integer
  // sum rather than a float average so the result is exact for every possible input.
  const overall = Math.round((sum / dimensions.length) * 10) / 10;

  // `reduce` rather than a sort so ties resolve to the first-listed dimension
  // deterministically, matching the documented dimension order.
  const weakest = dimensions.reduce((lowest, d) => (d.score < lowest.score ? d : lowest));

  const { tier, guidance } = tierFor(overall);

  return {
    overall,
    tier,
    dimensions,
    weakest,
    recommendation: `${guidance} Your lowest dimension is ${weakest.label} (${weakest.score}/5), which is usually the binding constraint — that is where we would start.`,
  };
}
