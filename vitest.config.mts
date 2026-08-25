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
    // Unit tests only. The eval suite (`npm run eval`) hits the real API and is a separate
    // runner on purpose — mixing a slow, non-deterministic, billable suite into `npm test`
    // makes the fast suite too painful to run often.
    include: ["src/**/*.test.ts"],
  },
});
