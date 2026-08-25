import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Same alias order as src/lib/db/client.ts — a prefixed Vercel/Neon variable must work
    // for migrations too, or the app connects to a database the CLI cannot migrate.
    // drizzle-kit is a CLI, never the request path, so failing loudly here is right.
    url:
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.NEON_DATABASE_URL ||
      process.env.NEON_POSTGRES_URL ||
      "",
  },
  strict: true,
  verbose: true,
});
