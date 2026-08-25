import { NextResponse } from "next/server";

import { getProvider, resolveModel } from "@/lib/ai/client";
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
 */
export function GET() {
  const provider = getProvider();
  const keyConfigured = Boolean(
    provider === "openrouter" ? process.env.OPENROUTER_API_KEY : process.env.ANTHROPIC_API_KEY,
  );

  return NextResponse.json(
    {
      status: keyConfigured ? "ok" : "degraded",
      provider,
      model: resolveModel(CHAT_MODEL, provider),
      keyConfigured,
      databaseConfigured: isDbEnabled,
      databaseSource: connectionSource,
      knowledgeDocs: KNOWLEDGE_IDS.length,
      tools: TOOLS.map((tool) => tool.name),
    },
    { status: keyConfigured ? 200 : 503 },
  );
}
