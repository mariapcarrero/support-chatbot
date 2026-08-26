import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/** Per-request context handed to every tool handler. */
export interface ToolContext {
  readonly conversationId: string;
  readonly sessionId: string;
}

/**
 * Result of a tool run.
 *
 * `content` is what the model sees and reasons about. `ui` is an optional structured
 * payload forwarded to the browser over SSE so the client can render a rich card
 * (a maturity score, a booking confirmation) instead of the model paraphrasing it.
 * Keeping these separate means the visual result is rendered from real data rather
 * than re-extracted from prose.
 */
export interface ToolResult {
  readonly content: string;
  readonly ui?: ToolUiPayload;
}

export type ToolUiPayload =
  | { kind: "booking"; contactUrl: string; name: string; email: string }
  | { kind: "lead"; name: string; email: string }
  | {
      kind: "maturity";
      overall: number;
      tier: string;
      dimensions: { label: string; score: number }[];
      weakest: string;
      recommendation: string;
    }
  | {
      kind: "escalation";
      reference: string;
      reason: string;
      contactName: string;
      contactEmail: string;
    }
  | { kind: "portal"; email: string | null };

/**
 * A tool the agent can call.
 *
 * The Zod schema is the single source of truth: it generates the JSON Schema sent to
 * the API and validates the model's arguments before the handler runs. Handlers can
 * therefore trust their input.
 */
export interface AgentTool<S extends z.ZodObject = z.ZodObject> {
  readonly name: string;
  readonly description: string;
  readonly schema: S;
  run(input: z.infer<S>, ctx: ToolContext): Promise<ToolResult>;
}

/** Helper preserving the schema's inferred type through to the handler. */
export function defineTool<S extends z.ZodObject>(tool: AgentTool<S>): AgentTool<S> {
  return tool;
}

/**
 * Convert a tool to the Anthropic wire format.
 *
 * `$schema` is stripped because the API rejects unknown top-level keys on input_schema.
 *
 * ## Why `strict: true` is not set
 *
 * Strict mode compiles every tool schema into a constrained decoding grammar, and that
 * grammar has a complexity budget which is **shared across the whole `tools` array**, not
 * applied per tool. Each of these five tools is accepted on its own with `strict: true`;
 * sending all five together returns `400 Schema is too complex`. Since the tool array is
 * sent on every request, that is a total outage, not a degraded tool.
 *
 * Worth knowing: `messages.count_tokens` accepts the strict array happily — only a real
 * Messages request enforces the budget. Validating tool definitions against count_tokens
 * proves nothing.
 *
 * Enabling it for an arbitrary subset would work today and break the moment a sixth tool is
 * added, with a failure mode that takes down every request. The guarantee strict provides —
 * arguments always validate — is already delivered one layer down: `executeTool` in
 * `registry.ts` runs `schema.safeParse` before any handler sees the input, and returns a
 * recovery message to the model on failure. That layer is strictly better here, because it
 * tells the model *what* was wrong instead of just refusing to generate.
 *
 * The schemas are still kept strict-compatible (no `minimum`/`maximum`, always
 * `additionalProperties: false`), so this is a one-line change if the budget ever rises.
 */
export function toAnthropicTool(tool: AgentTool): Anthropic.Tool {
  const jsonSchema = z.toJSONSchema(tool.schema) as Record<string, unknown>;
  delete jsonSchema.$schema;

  return {
    name: tool.name,
    description: tool.description,
    input_schema: jsonSchema as Anthropic.Tool.InputSchema,
  };
}
