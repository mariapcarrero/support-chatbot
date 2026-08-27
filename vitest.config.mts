import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Unit tests only, and that is about cost rather than location. The eval suite
    // (`npm run eval`) hits the real API and stays a separate runner on purpose — mixing a
    // slow, non-deterministic, billable suite into `npm test` makes the fast suite too
    // painful to run often.
    //
    // `evals/**` is included for the pure logic that lives beside that runner — the spend
    // guard, for one. Nothing billable is collected: `run.ts` is not a `*.test.ts` file, and
    // importing it would execute the suite, which is why the guard is its own module.
    include: ["src/**/*.test.ts", "evals/**/*.test.ts"],
  },
});
