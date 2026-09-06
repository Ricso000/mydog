import { config } from "dotenv";

// Loads .env.test (gitignored, local-only) for `npm run test` on a developer
// machine. In CI, these same variable names are injected directly as GitHub
// Actions secrets, so this call is a no-op there (no .env.test file exists) —
// see .env.test.example for the required variable names.
config({ path: ".env.test", quiet: true });

const required = ["TEST_SUPABASE_URL", "TEST_SUPABASE_ANON_KEY", "TEST_SUPABASE_SERVICE_ROLE_KEY"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required test environment variables: ${missing.join(", ")}. ` +
      `Copy .env.test.example to .env.test and fill in the MyDog CI Test project's keys ` +
      `(never production's keys — see docs/implementation/phase-0-1-plan.md).`
  );
}
