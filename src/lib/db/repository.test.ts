import { beforeEach, describe, expect, it } from "vitest";

import { resetMemoryStore } from "./memory-store";
import { loadHistory, resolveConversation, saveMessage } from "./repository";

/**
 * Covers the conversation-memory path.
 *
 * This is the gap that let a real bug ship: the eval suite carries history in-process
 * (`evals/run.ts` pushes onto its own array), so it exercises the agent but never the
 * route's load/save cycle. Every eval passed while the deployed HTTP path had no memory at
 * all and multi-turn booking silently broke.
 *
 * These run against the in-memory backend, which implements the same contract as the SQL
 * one — including the ownership rule.
 */
describe("conversation persistence", () => {
  beforeEach(resetMemoryStore);

  it("creates a conversation when none is supplied", async () => {
    const id = await resolveConversation("session-a", null);
    expect(id).toBeTruthy();
  });

  it("round-trips history across turns", async () => {
    const id = await resolveConversation("session-a", null);

    await saveMessage(id, "user", "My name is Zebediah");
    await saveMessage(id, "assistant", "Nice to meet you, Zebediah");
    await saveMessage(id, "user", "What is my name?");

    const history = await loadHistory(id);
    expect(history).toHaveLength(3);
    expect(history.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(history[0].content).toBe("My name is Zebediah");
  });

  it("resumes the same conversation when the id is replayed", async () => {
    const first = await resolveConversation("session-a", null);
    await saveMessage(first, "user", "turn one");

    const second = await resolveConversation("session-a", first);
    expect(second).toBe(first);
    expect(await loadHistory(second)).toHaveLength(1);
  });

  it("does not hand another session's conversation over", async () => {
    // The authorization boundary. Conversation ids are client-supplied, so without this
    // check anyone could read someone else's transcript by replaying an id.
    const owned = await resolveConversation("session-a", null);
    await saveMessage(owned, "user", "confidential");

    const attacker = await resolveConversation("session-b", owned);

    expect(attacker).not.toBe(owned);
    expect(await loadHistory(attacker)).toHaveLength(0);
  });

  it("preserves content blocks, not just text", async () => {
    // Tool calls live in the content array. Flattening to text would make a conversation
    // that used tools impossible to replay — the API requires the blocks.
    const id = await resolveConversation("session-a", null);
    const blocks = [
      { type: "tool_use", id: "toolu_1", name: "book_strategy_call", input: { name: "Ada" } },
    ];

    await saveMessage(id, "assistant", blocks);

    const [stored] = await loadHistory(id);
    expect(stored.content).toEqual(blocks);
  });

  it("returns empty history for a null conversation", async () => {
    expect(await loadHistory(null)).toEqual([]);
  });

  it("ignores writes for a null conversation instead of throwing", async () => {
    await expect(saveMessage(null, "user", "dropped")).resolves.toBeUndefined();
  });
});
