import { spawn, type ChildProcess } from "node:child_process";
import { config } from "dotenv";

// globalSetup runs in its own process, separate from tests/setup.ts — it needs
// its own .env.test load.
config({ path: ".env.test", quiet: true });

/**
 * Vitest globalSetup: starts a `next dev` server on a dedicated test port,
 * with its Supabase env vars forced to the CI Test project (never whatever
 * .env.local happens to point at on a developer's machine — this is what
 * keeps `npm run test` safe to run even if .env.local points at production).
 * Only tests that need a real HTTP round-trip through a Next.js Route Handler
 * (currently: the /api/applications suite) depend on this — most tests talk
 * to Supabase directly and don't need it, but starting it once for the whole
 * run is simpler and fast enough not to matter.
 */
const TEST_SERVER_PORT = 3100;
export const TEST_SERVER_URL = `http://localhost:${TEST_SERVER_PORT}`;

let serverProcess: ChildProcess | undefined;

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Test Next.js server did not become ready within ${timeoutMs}ms`);
}

export async function setup(): Promise<void> {
  serverProcess = spawn("npx", ["next", "dev", "-p", String(TEST_SERVER_PORT)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: process.env.TEST_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY,
      // The app's own email helper (src/lib/email.ts) no-ops without this —
      // deliberately left unset here so test runs never attempt real sends.
      RESEND_API_KEY: "",
    },
    stdio: "ignore",
  });
  await waitForServer(TEST_SERVER_URL, 30000);
}

export async function teardown(): Promise<void> {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill("SIGTERM");
  }
}
