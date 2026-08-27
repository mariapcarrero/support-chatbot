import Anthropic from "@anthropic-ai/sdk";

import { getAnthropicClient, MissingApiKeyError, resolveModel } from "./client";
import { CHAT_MODEL, EFFORT, MAX_OUTPUT_TOKENS, MAX_TOOL_ITERATIONS } from "./config";
import type { ChatEvent } from "./events";
import { ANTHROPIC_TOOLS, executeTool } from "./tools/registry";
import type { ToolContext } from "./tools/types";
import { SYSTEM_PROMPT } from "./system-prompt";
import { CONTACT_EMAIL } from "@/knowledge/contact";

export interface AgentTurn {
  /** Conversation replayed to the model, oldest first, excluding the new user message. */
  history: Anthropic.MessageParam[];
  userMessage: string;
  context: ToolContext;
}

/**
 * A message this agent can produce and persist.
 *
 * Narrower than `Anthropic.MessageParam`, whose `role` also allows "system" for
 * mid-conversation operator instructions. This agent never emits those (and Sonnet 5 does
 * not accept them), so narrowing here keeps the persistence layer's role column honest
 * instead of pushing a cast into the route.
 */
export interface PersistableMessage {
  role: "user" | "assistant";
  content: Anthropic.MessageParam["content"];
}

export interface AgentOutcome {
  /** Messages produced this turn, ready to persist (assistant turns and tool results). */
  newMessages: PersistableMessage[];
  usage: Anthropic.Usage | null;
}

/**
 * Run one user turn as an async generator of `ChatEvent`s.
 *
 * A manual streaming loop rather than the SDK's `toolRunner`. The runner would handle the
 * loop, but this turn needs three things it does not expose cleanly: per-token streaming
 * interleaved with tool-activity events for the UI, the exact message array for
 * persistence, and a hard iteration ceiling. Roughly forty lines buys full control over
 * all three, and the loop is simple enough to reason about in a review.
 *
 * The generator's return value carries the messages to persist; callers get it from the
 * `value` of the final `next()`, or via `collectOutcome`.
 */
export async function* runAgent(turn: AgentTurn): AsyncGenerator<ChatEvent, AgentOutcome> {
  const client = getAnthropicClient();

  const messages: Anthropic.MessageParam[] = [
    ...turn.history,
    { role: "user", content: turn.userMessage },
  ];
  const newMessages: PersistableMessage[] = [];
  let usage: Anthropic.Usage | null = null;

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const stream = client.messages.stream({
      model: resolveModel(CHAT_MODEL),
      max_tokens: MAX_OUTPUT_TOKENS,
      output_config: { effort: EFFORT },
      // Marking the system block ephemeral caches the whole static prefix (tools + system).
      // Measured at 23,954 tokens on 2026-08-26; it grows with every knowledge doc, so
      // re-measure rather than trust that figure. Resent on every turn of every conversation,
      // which is what makes this the single highest-leverage cost decision in the app.
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      tools: ANTHROPIC_TOOLS,
      messages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { type: "text", delta: event.delta.text };
      } else if (
        event.type === "content_block_start" &&
        event.content_block.type === "tool_use"
      ) {
        yield { type: "tool_start", name: event.content_block.name };
      }
    }

    const message = await stream.finalMessage();
    usage = message.usage;
    messages.push({ role: "assistant", content: message.content });
    newMessages.push({ role: "assistant", content: message.content });

    if (message.stop_reason !== "tool_use") {
      return { newMessages, usage };
    }

    const toolUses = message.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    // Run in parallel — the tools are independent — and return every result in a single
    // user message. Splitting results across messages teaches the model to stop making
    // parallel calls at all.
    const results = await Promise.all(
      toolUses.map(async (toolUse) => {
        const result = await executeTool(toolUse.name, toolUse.input, turn.context);
        return { toolUse, result };
      }),
    );

    const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];
    for (const { toolUse, result } of results) {
      yield { type: "tool_end", name: toolUse.name, ok: !result.isError, ui: result.ui };
      toolResultBlocks.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result.content,
        is_error: result.isError,
      });
    }

    messages.push({ role: "user", content: toolResultBlocks });
    newMessages.push({ role: "user", content: toolResultBlocks });
  }

  // Ceiling hit while the model still wanted to call tools. Rather than silently
  // returning a half-finished turn, tell the user plainly — this is a bug signal, and
  // pretending otherwise would hide it.
  yield {
    type: "error",
    message:
      `I got stuck working through that. Could you rephrase, or email ${CONTACT_EMAIL} and someone will pick it up?`,
    retryable: true,
  };
  return { newMessages, usage };
}

/**
 * Map an error to a user-safe message.
 *
 * Deliberately never surfaces the raw error: SDK messages can contain request metadata,
 * and stack traces have no business reaching a browser. Typed SDK exceptions are matched
 * most-specific-first rather than by string matching.
 */
export function describeError(error: unknown): { message: string; retryable: boolean; status: number } {
  if (error instanceof MissingApiKeyError) {
    return {
      message: `The assistant is not configured correctly. Please email ${CONTACT_EMAIL}.`,
      retryable: false,
      status: 500,
    };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return {
      message: "We're getting a lot of questions right now. Give it a few seconds and try again.",
      retryable: true,
      status: 429,
    };
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return {
      message: `The assistant is not configured correctly. Please email ${CONTACT_EMAIL}.`,
      retryable: false,
      status: 500,
    };
  }
  // Must be checked before APIError: APIConnectionError extends it (with no status).
  if (error instanceof Anthropic.APIConnectionError) {
    return {
      message: "I couldn't reach the model just then. Try again in a moment.",
      retryable: true,
      status: 503,
    };
  }
  if (error instanceof Anthropic.APIError) {
    const isServerFault = (error.status ?? 500) >= 500;
    return {
      message: isServerFault
        ? "Something went wrong on our side. Try again in a moment."
        : "I couldn't process that. Try rephrasing it.",
      retryable: isServerFault,
      status: isServerFault ? 502 : 400,
    };
  }
  console.error("[agent] unexpected error:", error);
  return {
    message: `Something went wrong. Try again, or email ${CONTACT_EMAIL}.`,
    retryable: true,
    status: 500,
  };
}
