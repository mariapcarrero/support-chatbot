import { describe, expect, it } from "vitest";

import {
  DIMENSIONS,
  InvalidScoreError,
  scoreMaturity,
  type DimensionScores,
} from "./scoring";

/** Build a score set with every dimension at `value`, overridable per key. */
function scores(value: number, overrides: Partial<DimensionScores> = {}): DimensionScores {
  const base = Object.fromEntries(DIMENSIONS.map((d) => [d.key, value])) as DimensionScores;
  return { ...base, ...overrides };
}

describe("scoreMaturity", () => {
  it("averages the five dimensions to one decimal place", () => {
    // 1+2+3+4+5 = 15 / 5 = 3.0
    const result = scoreMaturity({
      dataReadiness: 1,
      toolingInfrastructure: 2,
      teamCapability: 3,
      processIntegration: 4,
      governanceRisk: 5,
    });
    expect(result.overall).toBe(3);
    expect(result.dimensions).toHaveLength(5);
  });

  it("rounds to one decimal rather than leaving float noise", () => {
    // 2+2+2+2+3 = 11 / 5 = 2.2 exactly, but float division can produce 2.2000000000000002
    const result = scoreMaturity(scores(2, { governanceRisk: 3 }));
    expect(result.overall).toBe(2.2);
  });

  describe("tier boundaries", () => {
    // Pinned against the published table in the maturity-index knowledge doc. If these
    // change, the doc must change with them — the bot would otherwise state a tier the
    // knowledge base contradicts.
    const cases: [number, string][] = [
      [1, "Exploring"], // 1.0
      [2, "Experimenting"], // 2.0 — lower edge
      [3, "Operationalizing"], // 3.0 — lower edge
      [4, "Scaling"], // 4.0 — lower edge
      [5, "Leading"], // 5.0 — top
    ];

    it.each(cases)("all-%i scores as %s", (value, tier) => {
      expect(scoreMaturity(scores(value)).tier).toBe(tier);
    });

    it("places 1.8 in Exploring and 2.0 in Experimenting", () => {
      // 2+2+2+1+2 = 9 / 5 = 1.8
      expect(scoreMaturity(scores(2, { processIntegration: 1 })).tier).toBe("Exploring");
      expect(scoreMaturity(scores(2)).tier).toBe("Experimenting");
    });

    it("places 4.4 in Scaling and 4.6 in Leading", () => {
      // 5+5+5+5+2 = 22 / 5 = 4.4
      expect(scoreMaturity(scores(5, { governanceRisk: 2 })).tier).toBe("Scaling");
      // 5+5+5+5+3 = 23 / 5 = 4.6
      expect(scoreMaturity(scores(5, { governanceRisk: 3 })).tier).toBe("Leading");
    });

    it("assigns a valid tier for all 3,125 possible inputs", () => {
      // Exhaustive rather than sampled: the whole input space is five integers in 1..5,
      // which is small enough to enumerate completely. This proves the tier bands are
      // gapless and total, which a handful of spot checks cannot.
      const valid = new Set([
        "Exploring",
        "Experimenting",
        "Operationalizing",
        "Scaling",
        "Leading",
      ]);
      let count = 0;

      for (let a = 1; a <= 5; a++)
        for (let b = 1; b <= 5; b++)
          for (let c = 1; c <= 5; c++)
            for (let d = 1; d <= 5; d++)
              for (let e = 1; e <= 5; e++) {
                const result = scoreMaturity({
                  dataReadiness: a,
                  toolingInfrastructure: b,
                  teamCapability: c,
                  processIntegration: d,
                  governanceRisk: e,
                });
                expect(valid.has(result.tier)).toBe(true);
                expect(result.overall).toBeGreaterThanOrEqual(1);
                expect(result.overall).toBeLessThanOrEqual(5);
                // Rounded to exactly one decimal, never float noise.
                expect(Math.round(result.overall * 10)).toBe(result.overall * 10);
                count++;
              }

      expect(count).toBe(5 ** 5);
    });
  });

  it("identifies the weakest dimension as the constraint", () => {
    const result = scoreMaturity(scores(5, { dataReadiness: 2 }));
    expect(result.weakest.key).toBe("dataReadiness");
    expect(result.recommendation).toContain("Data Readiness");
  });

  it("breaks ties on the weakest dimension deterministically", () => {
    const result = scoreMaturity(scores(3, { teamCapability: 1, governanceRisk: 1 }));
    // Both are 1; the earlier-listed dimension wins, matching the documented order.
    expect(result.weakest.key).toBe("teamCapability");
  });

  it("is deterministic for identical input", () => {
    const input = scores(3, { dataReadiness: 1, governanceRisk: 5 });
    expect(scoreMaturity(input)).toEqual(scoreMaturity(input));
  });

  describe("rejects out-of-range input", () => {
    it.each([0, 6, -1, 2.5, Number.NaN])("rejects %s", (bad) => {
      expect(() => scoreMaturity(scores(3, { dataReadiness: bad }))).toThrow(InvalidScoreError);
    });
  });
});
