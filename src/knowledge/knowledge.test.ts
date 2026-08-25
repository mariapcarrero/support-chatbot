import { describe, expect, it } from "vitest";

import { KNOWLEDGE_BASE, KNOWLEDGE_IDS, getDoc } from "./index";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";

describe("knowledge base", () => {
  it("has unique ids", () => {
    expect(new Set(KNOWLEDGE_IDS).size).toBe(KNOWLEDGE_IDS.length);
  });

  it("is sorted by id, which the prompt cache depends on", () => {
    expect([...KNOWLEDGE_IDS]).toEqual([...KNOWLEDGE_IDS].sort());
  });

  it("uses kebab-case ids and has non-empty content", () => {
    for (const doc of KNOWLEDGE_BASE) {
      expect(doc.id, `${doc.id} should be kebab-case`).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(doc.title.length).toBeGreaterThan(0);
      expect(doc.body.length).toBeGreaterThan(100);
      expect(doc.tags.length).toBeGreaterThan(0);
    }
  });

  it("looks up documents by id", () => {
    expect(getDoc("pricing")?.title).toBe("Pricing");
    expect(getDoc("nope")).toBeUndefined();
  });

  it("covers every scenario the bot is expected to handle", () => {
    // Guards against a doc being deleted or renamed without the system prompt noticing.
    for (const required of [
      "company",
      "services",
      "industries",
      "pricing",
      "maturity-index",
      "portal",
      "security-and-llm-selection",
      "contact-and-booking",
    ]) {
      expect(KNOWLEDGE_IDS, `missing knowledge doc: ${required}`).toContain(required);
    }
  });
});

describe("system prompt", () => {
  it("is byte-for-byte identical across calls", () => {
    // The single most valuable test here. The prompt is sent with cache_control: ephemeral,
    // and the Anthropic cache is a prefix match — one interpolated Date.now() or UUID would
    // silently drop the cache hit rate to zero on every request, with no visible symptom
    // except the bill. Catching that in CI is much cheaper than catching it in production.
    expect(buildSystemPrompt()).toBe(buildSystemPrompt());
  });

  it("contains no volatile content", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/); // ISO timestamp
    expect(prompt).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  });

  it("includes every knowledge document body", () => {
    const prompt = buildSystemPrompt();
    for (const doc of KNOWLEDGE_BASE) {
      expect(prompt, `${doc.id} missing from prompt`).toContain(doc.title);
    }
  });

  it("states the grounding and escalation rules", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("Never invent a fact about Cadre AI");
    expect(prompt).toContain("escalate_to_human");
  });
});
