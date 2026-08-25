import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

/**
 * Database handle, or null when `DATABASE_URL` is not configured.
 *
 * Persistence is deliberately optional. The chatbot's primary job — answering questions
 * — does not depend on it, and requiring a database to boot would make local development
 * and the offline eval suite need infrastructure they have no use for. When the URL is
 * absent the app runs fully, minus transcript and lead capture, and says so once at
 * startup rather than throwing on the first request.
 *
 * The trade-off is explicit: a misconfigured production deploy degrades quietly instead
 * of failing loudly. `/api/health` reports database status so that state is observable,
 * and it is checked as part of the deploy smoke test.
 */
/**
 * Connection-string variable names, in priority order.
 *
 * Not over-engineering: Vercel's Neon integration provisions several of these at once, and
 * setting a "custom prefix" during setup renames every one of them. Accepting the standard
 * aliases means a deploy works regardless of which the integration happened to inject.
 *
 * A pooled URL is preferred over an unpooled one — serverless functions open a connection
 * per invocation, so the pooled endpoint is the one that survives concurrency.
 */
const CONNECTION_VARS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "NEON_DATABASE_URL",
  "NEON_POSTGRES_URL",
] as const;

function resolveConnectionString(): { url: string; source: string } | null {
  for (const name of CONNECTION_VARS) {
    // Guard against an empty-string variable, which is a real case: a placeholder var left
    // set to "" is present but useless, and would otherwise be picked over a working one.
    const value = process.env[name]?.trim();
    if (value) return { url: value, source: name };
  }
  return null;
}

const resolved = resolveConnectionString();
const connectionString = resolved?.url;

let warned = false;

function warnOnce() {
  if (!warned && process.env.NODE_ENV !== "test") {
    console.warn(
      `[db] No connection string found (looked for ${CONNECTION_VARS.join(", ")}) — ` +
        "falling back to the in-process store. Conversations survive within a single " +
        "server instance but are not persisted. See src/lib/db/memory-store.ts.",
    );
    warned = true;
  }
}

/** Which variable supplied the connection string. Surfaced by /api/health for debugging. */
export const connectionSource = resolved?.source ?? null;

export const db = connectionString
  ? drizzle(neon(connectionString), { schema })
  : null;

export const isDbEnabled = db !== null;

if (!isDbEnabled) warnOnce();

export type Database = NonNullable<typeof db>;
