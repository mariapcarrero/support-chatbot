import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

config({ path: [".env.local", ".env"], quiet: true });

/**
 * Apply pending migrations, then exit.
 *
 * Runs from the `vercel-build` script so migrations execute on the deploy, where the
 * connection string is available. That matters here: the Neon variable is marked Sensitive
 * in Vercel, so it is write-only and cannot be pulled to a laptop to migrate by hand.
 * Running on deploy also means the schema can never lag behind the code that expects it.
 *
 * Drizzle records applied migrations in its own table, so re-running is a no-op and
 * concurrent builds converge rather than conflict.
 */
const CONNECTION_VARS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "NEON_DATABASE_URL",
  "NEON_POSTGRES_URL",
] as const;

async function main() {
  const found = CONNECTION_VARS.map((name) => [name, process.env[name]?.trim()] as const).find(
    ([, value]) => Boolean(value),
  );

  if (!found) {
    // Not an error. A preview or local build without a database is a supported
    // configuration — the app falls back to the in-process store. Failing the build here
    // would make the database mandatory, which is a different design decision.
    console.log(
      `[migrate] No connection string (looked for ${CONNECTION_VARS.join(", ")}). ` +
        "Skipping migrations; the app will use the in-process store.",
    );
    return;
  }

  const [source, url] = found;
  console.log(`[migrate] Applying migrations using ${source}…`);

  const db = drizzle(neon(url!));
  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("[migrate] Done.");
}

main().catch((error) => {
  // A failed migration MUST fail the build. Deploying code against a schema that was not
  // applied produces runtime errors on live traffic, which is far worse than a red deploy.
  console.error("[migrate] Migration failed:", error);
  process.exit(1);
});
