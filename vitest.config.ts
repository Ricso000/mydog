import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    globalSetup: ["tests/globalSetup.ts"],
    testTimeout: 20000,
    // Security/RLS tests create + tear down real Supabase Auth users against the
    // isolated CI Test project; running them one file at a time avoids fixture
    // races between test files (the shared admin fixture in particular).
    fileParallelism: false,
  },
});
