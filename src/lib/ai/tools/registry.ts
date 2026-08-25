import type Anthropic from "@anthropic-ai/sdk";

import { bookStrategyCall } from "./book-strategy-call";
import { captureLead } from "./capture-lead";
import { escalateToHuman } from "./escalate-to-human";
import { getPortalAccessHelp } from "./portal-access-help";
import { scoreAiMaturity } from "./score-ai-maturity";
import { toAnthropicTool, type AgentTool, type ToolContext, type ToolResult } from "./types";
import { CONTACT_EMAIL } from "@/knowledge/contact";

/**
 * The agent's tool surface.
 *
 * Order is fixed and alphabetical by name. Tools are rendered before the system prompt in
 * the cache prefix, so a reordered tool list invalidates the cached system prompt too —
 * the ordering here is as load-bearing as the knowledge base sort.
 */
export const TOOLS: readonly AgentTool[] = [
  bookStrategyCall,
  captureLead,
  escalateToHuman,
  getPortalAccessHelp,
  scoreAiMaturity,
] as AgentTool[];

/** Wire-format tool definitions, built once at module load. */
export const ANTHROPIC_TOOLS: Anthropic.Tool[] = TOOLS.map(toAnthropicTool);

const BY_NAME = new Map(TOOLS.map((tool) => [tool.name, tool]));

/**
 * Execute a tool call from the model.
 *
 * Returns a `ToolResult` in every case, including failure. A thrown error here would abort
 * the user's turn; an error *result* lets the model apologise, try another approach, or
 * escalate — which is the behaviour we want. The distinction matters: tools fail, and the
 * conversation should survive it.
 */
export async function executeTool(
  name: string,
  rawInput: unknown,
  ctx: ToolContext,
): Promise<ToolResult & { isError: boolean }> {
  const tool = BY_NAME.get(name);

  if (!tool) {
    // Only reachable if the model hallucinates a tool name.
    return { content: `Unknown tool "${name}". Do not try it again.`, isError: true };
  }

  const parsed = tool.schema.safeParse(rawInput);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    return {
      content: `Invalid arguments for ${name} — ${issues}. Ask the user for the missing or correct information rather than guessing.`,
      isError: true,
    };
  }

  try {
    const result = await tool.run(parsed.data, ctx);
    return { ...result, isError: false };
  } catch (error) {
    console.error(`[tool:${name}] execution failed:`, error);
    return {
      content: `The ${name} tool failed unexpectedly. Apologise briefly and offer to connect the user with a human at ${CONTACT_EMAIL}.`,
      isError: true,
    };
  }
}
