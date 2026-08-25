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

  // The first version of this knowledge base was written from a brief rather than the
  // website, and shipped a booking URL that 404s, six invented price bands, and four
  // fabricated case studies. The only safeguard was a sentence in a planning document,
  // which a running system cannot read. These tests are that safeguard in a form the
  // build can enforce.
  describe("provenance", () => {
    it("every document names at least one page it was checked against", () => {
      for (const doc of KNOWLEDGE_BASE) {
        expect(doc.sources.length, `${doc.id} has no sources`).toBeGreaterThan(0);
      }
    });

    it("every source is an https URL on cadreai.com", () => {
      for (const doc of KNOWLEDGE_BASE) {
        for (const source of doc.sources) {
          expect(source.url, `${doc.id}: ${source.url}`).toMatch(
            /^https:\/\/www\.cadreai\.com(\/|$)/,
          );
        }
      }
    });

    it("every checkedOn is a real YYYY-MM-DD date, not a placeholder", () => {
      for (const doc of KNOWLEDGE_BASE) {
        for (const source of doc.sources) {
          expect(source.checkedOn, `${doc.id}: ${source.checkedOn}`).toMatch(
            /^\d{4}-\d{2}-\d{2}$/,
          );
          // Catches 2026-13-45 and similar, which the regex alone would accept.
          const parsed = new Date(`${source.checkedOn}T00:00:00Z`);
          expect(Number.isNaN(parsed.getTime()), `${doc.id}: unparseable date`).toBe(false);
          expect(parsed.toISOString().slice(0, 10)).toBe(source.checkedOn);
        }
      }
    });

    it("keeps source metadata out of the rendered prompt", () => {
      // Provenance is for maintainers, not context for the model. If it rendered, then
      // re-checking a page would change a prompt that is cached by exact prefix and
      // silently invalidate the cache for every user.
      //
      // Asserts on `checkedOn` rather than `url`: a source URL can legitimately appear in a
      // body — cadreai.com/contact is the link the bot exists to hand out — so asserting on
      // URLs failed for a document doing exactly the right thing. The dates are the part
      // that is metadata and nothing else.
      const prompt = buildSystemPrompt();
      for (const doc of KNOWLEDGE_BASE) {
        for (const source of doc.sources) {
          expect(prompt, `${doc.id} leaked provenance metadata`).not.toContain(source.checkedOn);
        }
      }
    });
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
