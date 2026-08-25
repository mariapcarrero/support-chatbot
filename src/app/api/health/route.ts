import { NextResponse } from "next/server";

import { getAnthropicClient, getProvider, resolveModel } from "@/lib/ai/client";
import { CHAT_MODEL } from "@/lib/ai/config";
import { connectionSource, isDbEnabled } from "@/lib/db/client";
import { KNOWLEDGE_IDS } from "@/knowledge";
import { TOOLS } from "@/lib/ai/tools/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Deploy smoke-test endpoint.
 *
 * Persistence degrades silently by design (see `src/lib/db/client.ts`), so this is what
 * makes that state observable — a deploy missing DATABASE_URL still answers questions, and
 * without this endpoint nobody would notice the leads were not being recorded.
 *
 * Reports configuration presence only. It never echoes secret values and never calls the
 * Anthropic API, so it stays free to poll.
 *
 * `?probe=1` opts into one real, minimal API call that reports whether the key actually
 * WORKS. That distinction is not academic: on 2026-08-25 the Anthropic key hit a spend cap,
 * every chat request failed with a 400, and this endpoint went on reporting "ok" for hours
 * because a configured key and a working key are not the same thing. The probe is opt-in so
 * the default stays free to poll from uptime checks.
 */
export async function GET(request: Request) {
  const provider = getProvider();
  const keyConfigured = Boolean(
    provider === "openrouter" ? process.env.OPENROUTER_API_KEY : process.env.ANTHROPIC_API_KEY,
  );

  const wantsProbe = new URL(request.url).searchParams.get("probe") === "1";
  const probe = wantsProbe && keyConfigured ? await probeModel() : null;

  const healthy = keyConfigured && probe?.ok !== false;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      provider,
      model: resolveModel(CHAT_MODEL, provider),
      keyConfigured,
      ...(probe ? { modelReachable: probe.ok, ...(probe.error ? { probeError: probe.error } : {}) } : {}),
      databaseConfigured: isDbEnabled,
      databaseSource: connectionSource,
      knowledgeDocs: KNOWLEDGE_IDS.length,
      tools: TOOLS.map((tool) => tool.name),
    },
    { status: healthy ? 200 : 503 },
  );
}

/**
 * One token in, one token out — enough to prove auth, quota, and model id are all good.
 *
 * The error text is passed through deliberately. This endpoint is for whoever deployed the
 * thing, not for end users, and "You have reached your specified API usage limits" is the
 * single most useful string to see here. It reveals no secrets: the key is never echoed.
 */
async function probeModel(): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getAnthropicClient();
    await client.messages.create({
      model: resolveModel(CHAT_MODEL),
      max_tokens: 1,
      messages: [{ role: "user", content: "ping" }],
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message.slice(0, 300) : "unknown error",
    };
  }
}
