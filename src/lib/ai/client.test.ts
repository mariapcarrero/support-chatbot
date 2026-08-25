import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getProvider,
  getAnthropicClient,
  MissingApiKeyError,
  resetAnthropicClient,
  resolveModel,
} from "./client";
import { CHAT_MODEL, JUDGE_MODEL } from "./config";

const ORIGINAL = { ...process.env };

beforeEach(() => {
  resetAnthropicClient();
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  resetAnthropicClient();
});

describe("getProvider", () => {
  it("defaults to anthropic", () => {
    delete process.env.LLM_PROVIDER;
    expect(getProvider()).toBe("anthropic");
  });

  it("switches on LLM_PROVIDER=openrouter", () => {
    process.env.LLM_PROVIDER = "openrouter";
    expect(getProvider()).toBe("openrouter");
  });

  it("falls back to anthropic for an unrecognised value rather than throwing", () => {
    // A typo in an env var should not take the app down; the default is the safe one.
    process.env.LLM_PROVIDER = "openrouterr";
    expect(getProvider()).toBe("anthropic");
  });
});

/**
 * These exact ids were confirmed present on OpenRouter's /models endpoint. Kept as
 * literals rather than read from `config.ts`: this file tests the prefixing rule, and
 * asserting `resolveModel(JUDGE_MODEL)` against a hardcoded id only tested which model
 * `config.ts` happened to name. Changing the judge broke it for no real reason.
 */
const VERIFIED_ON_OPENROUTER = ["claude-sonnet-5", "claude-opus-5"] as const;

describe("resolveModel", () => {
  it("leaves ids untouched for the first-party API", () => {
    for (const id of VERIFIED_ON_OPENROUTER) {
      expect(resolveModel(id, "anthropic")).toBe(id);
    }
  });

  it("namespaces ids for OpenRouter", () => {
    for (const id of VERIFIED_ON_OPENROUTER) {
      expect(resolveModel(id, "openrouter")).toBe(`anthropic/${id}`);
    }
  });

  it("only uses models confirmed available on OpenRouter", () => {
    // The point the old assertions were reaching for: a model named in config must
    // actually resolve on both providers, or the cutover breaks on a model id nobody
    // checked. This survives changing either constant.
    for (const configured of [CHAT_MODEL, JUDGE_MODEL]) {
      expect(VERIFIED_ON_OPENROUTER, `${configured} not verified on OpenRouter`).toContain(
        configured,
      );
    }
  });

  it("does not double-prefix an already-namespaced id", () => {
    expect(resolveModel("anthropic/claude-sonnet-5", "openrouter")).toBe(
      "anthropic/claude-sonnet-5",
    );
  });
});

describe("getAnthropicClient", () => {
  it("throws a named error identifying the missing variable", () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.LLM_PROVIDER;
    expect(() => getAnthropicClient()).toThrow(MissingApiKeyError);
    expect(() => getAnthropicClient()).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("names OPENROUTER_API_KEY when that provider is selected", () => {
    process.env.LLM_PROVIDER = "openrouter";
    delete process.env.OPENROUTER_API_KEY;
    expect(() => getAnthropicClient()).toThrow(/OPENROUTER_API_KEY/);
  });

  it("points at OpenRouter's base URL when switched", () => {
    process.env.LLM_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "sk-or-v1-test";
    // No trailing /v1 — the SDK appends /v1/messages itself.
    expect(getAnthropicClient().baseURL).toBe("https://openrouter.ai/api");
  });

  it("uses the default base URL for the first-party API", () => {
    delete process.env.LLM_PROVIDER;
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    expect(getAnthropicClient().baseURL).toContain("api.anthropic.com");
  });

  it("does not hand back a stale client after the provider changes", () => {
    // Memoization is per provider precisely so this cannot happen. Getting it wrong would
    // mean a deploy that flips LLM_PROVIDER keeps talking to the old endpoint.
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.OPENROUTER_API_KEY = "sk-or-v1-test";

    delete process.env.LLM_PROVIDER;
    const first = getAnthropicClient();

    process.env.LLM_PROVIDER = "openrouter";
    const second = getAnthropicClient();

    expect(second).not.toBe(first);
    expect(second.baseURL).toBe("https://openrouter.ai/api");
  });
});
