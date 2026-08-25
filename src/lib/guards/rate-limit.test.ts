import { beforeEach, describe, expect, it } from "vitest";

import { RATE_LIMIT } from "@/lib/ai/config";

import { checkRateLimit, resetRateLimits } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(resetRateLimits);

  it("allows up to the configured limit", () => {
    for (let i = 0; i < RATE_LIMIT.maxRequests; i++) {
      expect(checkRateLimit("a").allowed, `request ${i + 1}`).toBe(true);
    }
  });

  it("blocks the request after the limit", () => {
    for (let i = 0; i < RATE_LIMIT.maxRequests; i++) checkRateLimit("a");
    const decision = checkRateLimit("a");
    expect(decision.allowed).toBe(false);
    expect(decision.retryAfter).toBeGreaterThan(0);
  });

  it("counts each key independently", () => {
    for (let i = 0; i < RATE_LIMIT.maxRequests; i++) checkRateLimit("a");
    expect(checkRateLimit("a").allowed).toBe(false);
    expect(checkRateLimit("b").allowed).toBe(true);
  });

  it("resets once the window has elapsed", () => {
    const start = 1_000_000;
    for (let i = 0; i < RATE_LIMIT.maxRequests; i++) checkRateLimit("a", start);
    expect(checkRateLimit("a", start).allowed).toBe(false);
    expect(checkRateLimit("a", start + RATE_LIMIT.windowMs).allowed).toBe(true);
  });

  it("reports remaining budget", () => {
    expect(checkRateLimit("a").remaining).toBe(RATE_LIMIT.maxRequests - 1);
    expect(checkRateLimit("a").remaining).toBe(RATE_LIMIT.maxRequests - 2);
  });
});
