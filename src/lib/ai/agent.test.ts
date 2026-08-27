import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";

import { addUsage } from "./agent";

/** A `Usage` with only the fields these tests care about set. */
function usage(fields: Partial<Anthropic.Usage>): Anthropic.Usage {
  return {
    cache_creation: null,
    cache_creation_input_tokens: null,
    cache_read_input_tokens: null,
    inference_geo: null,
    input_tokens: 0,
    output_tokens: 0,
    output_tokens_details: null,
    server_tool_use: null,
    service_tier: null,
    ...fields,
  };
}

describe("addUsage", () => {
  it("returns the first call's usage unchanged", () => {
    const first = usage({ input_tokens: 100, output_tokens: 20 });
    expect(addUsage(null, first)).toBe(first);
  });

  it("sums token counters across the round trips in a turn", () => {
    // The bug this guards: a tool-calling turn is several API calls, and overwriting rather
    // than summing persisted only the last one — understating the turn's cost.
    const total = addUsage(
      usage({ input_tokens: 100, output_tokens: 20 }),
      usage({ input_tokens: 40, output_tokens: 5 }),
    );
    expect(total.input_tokens).toBe(140);
    expect(total.output_tokens).toBe(25);
  });

  it("sums cache counters, which is what makes a cache hit visible across a whole turn", () => {
    // Reading `cache_read_input_tokens` off the final call alone is how a turn that missed
    // the cache three times and hit it once reads as a clean hit.
    const total = addUsage(
      usage({ cache_creation_input_tokens: 23_954, cache_read_input_tokens: 0 }),
      usage({ cache_creation_input_tokens: 0, cache_read_input_tokens: 23_954 }),
    );
    expect(total.cache_creation_input_tokens).toBe(23_954);
    expect(total.cache_read_input_tokens).toBe(23_954);
  });

  it("keeps null when neither call reported a counter", () => {
    // Null means "not reported", which is not the same as a measured zero.
    const total = addUsage(usage({}), usage({}));
    expect(total.cache_read_input_tokens).toBeNull();
  });

  it("treats a null on one side as zero rather than discarding the other", () => {
    const total = addUsage(
      usage({ cache_read_input_tokens: null }),
      usage({ cache_read_input_tokens: 512 }),
    );
    expect(total.cache_read_input_tokens).toBe(512);
  });

  it("carries the most recent call's non-additive metadata", () => {
    // `service_tier` describes one request; summing it would invent a value the API never
    // returned, so the latest call wins.
    const total = addUsage(
      usage({ service_tier: "batch" }),
      usage({ service_tier: "standard" }),
    );
    expect(total.service_tier).toBe("standard");
  });
});
