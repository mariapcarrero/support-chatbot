import { describe, expect, it } from "vitest";

import { ANTHROPIC_TOOLS, TOOLS, executeTool } from "./registry";
import type { ToolContext } from "./types";

// No conversationId → repository writes short-circuit, so these run without a database.
const ctx: ToolContext = { conversationId: "", sessionId: "test-session" };

describe("tool registry", () => {
  it("exposes every tool in wire format", () => {
    expect(ANTHROPIC_TOOLS).toHaveLength(TOOLS.length);
  });

  it("is ordered deterministically, which the prompt cache depends on", () => {
    const names = ANTHROPIC_TOOLS.map((t) => t.name);
    expect(names).toEqual([...names].sort());
  });

  it("produces schemas the API will accept", () => {
    for (const tool of ANTHROPIC_TOOLS) {
      // NOT strict — the strict-mode grammar budget is shared across the whole tools
      // array, and these five together exceed it (400 "Schema is too complex"). Arguments
      // are validated by `executeTool` instead. See `toAnthropicTool` for the full story.
      expect(tool.strict, `${tool.name} must not be strict`).toBeUndefined();
      expect(tool.input_schema.type).toBe("object");
      expect(tool.input_schema).toHaveProperty("additionalProperties", false);
      expect(tool.input_schema).toHaveProperty("required");
      // $schema is stripped — the API rejects unknown top-level keys.
      expect(tool.input_schema).not.toHaveProperty("$schema");
      // Descriptions are how the model decides when to call a tool, so an empty or terse
      // one is a real defect, not a style nit.
      expect(tool.description, `${tool.name} needs a description`).toBeDefined();
      expect(tool.description!.length).toBeGreaterThan(40);
    }
  });

  it("keeps schemas strict-compatible so strict mode stays a one-line change", () => {
    // `z.number().int().min(1).max(5)` is the natural way to express a 1-5 rating and emits
    // `minimum`/`maximum`, which strict mode rejects outright. Strict is currently off (see
    // above), so this is not load-bearing today — it keeps the door open, and an `enum` is a
    // stronger hint to the model than a numeric range regardless.
    //
    // Checked statically because the unit suite stays offline and free. The API is the real
    // authority here, and it does not always agree with `count_tokens` — only `npm run eval`
    // exercises the path that actually enforces these limits.
    const UNSUPPORTED = ["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum"];

    const walk = (node: unknown, path: string): void => {
      if (!node || typeof node !== "object") return;
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        expect(
          UNSUPPORTED.includes(key),
          `${path}.${key} is not supported by strict tool schemas`,
        ).toBe(false);
        walk(value, `${path}.${key}`);
      }
    };

    for (const tool of ANTHROPIC_TOOLS) walk(tool.input_schema, tool.name);
  });
});

describe("executeTool", () => {
  it("returns an error result for an unknown tool rather than throwing", () => {
    // A thrown error would abort the user's whole turn; an error result lets the model recover.
    return expect(executeTool("not_a_tool", {}, ctx)).resolves.toMatchObject({ isError: true });
  });

  it("rejects invalid arguments and tells the model how to recover", async () => {
    const result = await executeTool(
      "book_strategy_call",
      { name: "Ada", email: "not-an-email", company: "Acme", topic: "AI" },
      ctx,
    );
    expect(result.isError).toBe(true);
    expect(result.content).toContain("email");
    expect(result.content).toContain("rather than guessing");
  });

  it("rejects a missing required field", async () => {
    const result = await executeTool("book_strategy_call", { name: "Ada" }, ctx);
    expect(result.isError).toBe(true);
  });

  it("normalises email casing and whitespace", async () => {
    const result = await executeTool(
      "capture_lead",
      { name: "Ada", email: "  Ada@Example.COM ", interest: "researching" },
      ctx,
    );
    expect(result.isError).toBe(false);
    expect(result.content).toContain("ada@example.com");
  });

  it("scores maturity through the deterministic scorer, not the model", async () => {
    const result = await executeTool(
      "score_ai_maturity",
      {
        dataReadiness: 1,
        toolingInfrastructure: 2,
        teamCapability: 3,
        processIntegration: 4,
        governanceRisk: 5,
      },
      ctx,
    );
    expect(result.isError).toBe(false);
    expect(result.content).toContain("3/5");
    expect(result.ui).toMatchObject({ kind: "maturity", overall: 3, tier: "Operationalizing" });
  });

  it("rejects an out-of-range maturity rating at the schema boundary", async () => {
    const result = await executeTool(
      "score_ai_maturity",
      {
        dataReadiness: 9,
        toolingInfrastructure: 2,
        teamCapability: 3,
        processIntegration: 4,
        governanceRisk: 5,
      },
      ctx,
    );
    expect(result.isError).toBe(true);
  });

  it("issues a quotable reference when escalating", async () => {
    const result = await executeTool(
      "escalate_to_human",
      { category: "contractual", reason: "Wants a signed DPA" },
      ctx,
    );
    expect(result.isError).toBe(false);
    expect(result.content).toMatch(/CAD-[0-9A-F]{6}/);
    expect(result.ui).toMatchObject({ kind: "escalation" });
  });

  it("does not file a portal request without an email, and says so", async () => {
    const result = await executeTool("get_portal_access_help", { issue: "cannot_access" }, ctx);
    expect(result.isError).toBe(false);
    expect(result.content).toContain("nothing has been filed");
    // Must not imply an email was sent — the tool cannot send one.
    expect(result.content).toContain("Do not");
    expect(result.ui).toBeUndefined();
  });

  it("files a portal request when an email is supplied", async () => {
    const result = await executeTool(
      "get_portal_access_help",
      { issue: "cannot_access", email: "ada@acme.com" },
      ctx,
    );
    expect(result.content).toMatch(/CAD-[0-9A-F]{6}/);
    expect(result.ui).toMatchObject({ kind: "portal", email: "ada@acme.com" });
  });
});
