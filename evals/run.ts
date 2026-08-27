import { config } from "dotenv";

// Next.js loads .env.local automatically; a bare tsx script does not. Load it explicitly
// so `npm run eval` uses the same key as `npm run dev`.
config({ path: [".env.local", ".env"], quiet: true });

import type Anthropic from "@anthropic-ai/sdk";

import { runAgent, type PersistableMessage } from "@/lib/ai/agent";
import { getProvider } from "@/lib/ai/client";

import { checkOpenRouterBudget, OVERRIDE_FLAG } from "./budget-guard";
import { CASES, type EvalCase } from "./cases";
import { judge } from "./judge";

/**
 * Eval runner.
 *
 * Drives the real agent — same system prompt, same tools, same model — against the cases
 * in `cases.ts`, then applies deterministic assertions and an LLM judge. Exits non-zero on
 * any failure so it can gate a deploy.
 *
 * Deliberately separate from `npm test`: this costs money, takes a minute, and is not
 * perfectly deterministic. Bundling it into the unit suite would make the fast suite too
 * expensive to run on every save, and people would stop running it.
 *
 * Usage:
 *   npm run eval                  # all cases
 *   npm run eval -- pricing       # only cases whose id contains "pricing"
 *
 * Under LLM_PROVIDER=openrouter a large run is refused outright — that key has a hard,
 * non-rechargeable cap the full suite cannot fit inside. See `budget-guard.ts`.
 */

/** Tools whose side effects we do not want during evals. */
const EVAL_CONTEXT = { conversationId: "", sessionId: "eval" };

interface CaseResult {
  id: string;
  pass: boolean;
  failures: string[];
  toolCalls: string[];
  transcript: string;
  ms: number;
}

/** Run every turn of a case, accumulating history the way the real route does. */
async function runConversation(
  testCase: EvalCase,
): Promise<{ transcript: string; toolCalls: string[]; replies: string[] }> {
  const history: Anthropic.MessageParam[] = [];
  const toolCalls: string[] = [];
  const replies: string[] = [];
  const transcript: string[] = [];

  for (const turn of testCase.turns) {
    transcript.push(`USER: ${turn}`);

    const generator = runAgent({ history, userMessage: turn, context: EVAL_CONTEXT });
    let reply = "";
    const turnTools: string[] = [];

    let next = await generator.next();
    while (!next.done) {
      const event = next.value;
      if (event.type === "text") reply += event.delta;
      if (event.type === "tool_start") {
        toolCalls.push(event.name);
        turnTools.push(event.name);
      }
      next = await generator.next();
    }

    const produced: PersistableMessage[] = next.value.newMessages;
    history.push({ role: "user", content: turn }, ...produced);

    replies.push(reply);
    // Tool calls are recorded inline. Without this the transcript is text-only, and the
    // judge reads "no visible tool call" as "the tool was never called" — which failed a
    // case where the tool had in fact run correctly.
    const toolLine = turnTools.length ? `[called: ${turnTools.join(", ")}]\n` : "";
    transcript.push(`ASSISTANT: ${toolLine}${reply || "(no text — tool call only)"}`);
  }

  return { transcript: transcript.join("\n\n"), toolCalls, replies };
}

/** Apply the deterministic assertions. Returns a list of failure descriptions. */
function checkAssertions(
  testCase: EvalCase,
  replies: string[],
  toolCalls: string[],
): string[] {
  const failures: string[] = [];
  const combined = replies.join("\n");

  for (const tool of testCase.expectTools ?? []) {
    if (!toolCalls.includes(tool)) failures.push(`expected tool "${tool}" was not called`);
  }
  for (const tool of testCase.forbidTools ?? []) {
    if (toolCalls.includes(tool)) failures.push(`forbidden tool "${tool}" was called`);
  }
  for (const { pattern, why } of testCase.mustNotMatch ?? []) {
    const match = combined.match(pattern);
    if (match) failures.push(`matched forbidden pattern (${why}): "${match[0].slice(0, 80)}"`);
  }
  for (const { pattern, why } of testCase.mustMatch ?? []) {
    if (!pattern.test(combined)) failures.push(`missing required pattern (${why})`);
  }

  return failures;
}

async function runCase(testCase: EvalCase): Promise<CaseResult> {
  const started = Date.now();
  try {
    const { transcript, toolCalls, replies } = await runConversation(testCase);
    const failures = checkAssertions(testCase, replies, toolCalls);

    // Only pay for a judge call if the cheap assertions already passed.
    if (failures.length === 0) {
      const verdict = await judge(testCase.rubric, transcript, toolCalls);
      if (!verdict.pass) failures.push(`judge: ${verdict.reason}`);
    }

    return {
      id: testCase.id,
      pass: failures.length === 0,
      failures,
      toolCalls,
      transcript,
      ms: Date.now() - started,
    };
  } catch (error) {
    return {
      id: testCase.id,
      pass: false,
      failures: [`threw: ${error instanceof Error ? error.message : String(error)}`],
      toolCalls: [],
      transcript: "",
      ms: Date.now() - started,
    };
  }
}

/** Bounded concurrency — enough to be quick, low enough to stay under rate limits. */
async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await fn(items[index]);
      }
    }),
  );

  return results;
}

async function main() {
  // Check the key for the ACTIVE provider, not always Anthropic. Hardcoding the Anthropic
  // check meant that under LLM_PROVIDER=openrouter — with a perfectly valid OpenRouter key —
  // the suite refused to start. That would have surfaced during the provider cutover, when
  // the eval suite is the one thing you most want working.
  const provider = getProvider();
  const requiredKey = provider === "openrouter" ? "OPENROUTER_API_KEY" : "ANTHROPIC_API_KEY";

  if (!process.env[requiredKey]) {
    console.error(
      `${requiredKey} is not set (LLM_PROVIDER=${provider}). Add it to .env.local and re-run.`,
    );
    process.exit(1);
  }

  console.log(`Provider: ${provider}`);

  // Flags are separated from the filter so `npm run eval -- --allow-openrouter-full-run`
  // is not read as a substring to match against case ids.
  const args = process.argv.slice(2);
  const override = args.includes(OVERRIDE_FLAG);
  const filter = args.find((arg) => !arg.startsWith("--"));
  const selected = filter ? CASES.filter((c) => c.id.includes(filter)) : CASES;

  if (selected.length === 0) {
    console.error(`No cases match "${filter}".`);
    process.exit(1);
  }

  // Checked after the filter is applied, so the limit is on cases actually about to run
  // rather than on whether a filter was typed. `-- e` matches most ids and is not a
  // targeted run in any meaningful sense.
  const budget = checkOpenRouterBudget({
    provider,
    selectedCount: selected.length,
    totalCount: CASES.length,
    override,
  });

  if (!budget.allowed) {
    console.error(`\n${budget.message}\n`);
    process.exit(1);
  }

  if (budget.message) console.log(`\n${budget.message}`);

  console.log(`\nRunning ${selected.length} eval case(s)…\n`);
  const started = Date.now();

  const results = await mapWithLimit(selected, 4, async (testCase) => {
    const result = await runCase(testCase);
    console.log(
      `${result.pass ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"}  ${result.id.padEnd(32)} ${String(result.ms).padStart(6)}ms  ${result.toolCalls.join(",") || "-"}`,
    );
    for (const failure of result.failures) console.log(`        ↳ ${failure}`);
    return result;
  });

  const failed = results.filter((r) => !r.pass);
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  console.log(
    `\n${results.length - failed.length}/${results.length} passed in ${elapsed}s\n`,
  );

  if (failed.length > 0) {
    console.log("Failed transcripts:\n");
    for (const result of failed) {
      console.log(`──── ${result.id} ${"─".repeat(Math.max(0, 60 - result.id.length))}`);
      console.log(result.transcript.slice(0, 1_500));
      console.log();
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
