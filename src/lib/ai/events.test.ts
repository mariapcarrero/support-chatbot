import { describe, expect, it } from "vitest";

import { encodeEvent, parseEventLine, type ChatEvent } from "./events";

describe("SSE event codec", () => {
  const samples: ChatEvent[] = [
    { type: "conversation", conversationId: "abc" },
    { type: "text", delta: "Hello" },
    { type: "tool_start", name: "book_strategy_call" },
    { type: "tool_end", name: "book_strategy_call", ok: true },
    { type: "done" },
    { type: "error", message: "boom", retryable: true },
  ];

  it.each(samples)("round-trips $type", (event) => {
    const line = encodeEvent(event).trim();
    expect(parseEventLine(line)).toEqual(event);
  });

  it("terminates every frame with a blank line", () => {
    // The client splits frames on "\n\n"; without the terminator it would buffer forever.
    expect(encodeEvent({ type: "done" }).endsWith("\n\n")).toBe(true);
  });

  it("survives text containing newlines and quotes", () => {
    // JSON-encoding the payload is what makes this safe — a raw multi-line delta would
    // otherwise be split across frames and corrupt the stream.
    const event: ChatEvent = { type: "text", delta: 'line one\nline "two"\n\nline three' };
    const line = encodeEvent(event).trim();
    expect(line.split("\n")).toHaveLength(1);
    expect(parseEventLine(line)).toEqual(event);
  });

  it("ignores non-data lines and malformed payloads", () => {
    expect(parseEventLine(": keep-alive")).toBeNull();
    expect(parseEventLine("")).toBeNull();
    expect(parseEventLine("data:")).toBeNull();
    expect(parseEventLine("data: {not json")).toBeNull();
  });
});
