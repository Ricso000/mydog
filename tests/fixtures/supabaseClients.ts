import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * All Supabase access in this test suite targets the isolated `MyDog CI Test`
 * project (see docs/implementation/phase-0-1-plan.md) — never production.
 */
export function anonClient(): SupabaseClient {
  return createClient(process.env.TEST_SUPABASE_URL!, process.env.TEST_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * service_role client — bypasses RLS. Used ONLY for test-fixture bootstrap and
 * teardown (creating/deleting throwaway auth users, reading ground truth to
 * assert against). Never used to perform or verify the actual security
 * assertions under test — those always go through `anonClient()` sessions,
 * exactly like a real user or attacker would.
 */
export function serviceClient(): SupabaseClient {
  return createClient(process.env.TEST_SUPABASE_URL!, process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let counter = 0;
/** A unique, valid-format throwaway email for one test's lifetime. */
export function uniqueTestEmail(label: string): string {
  counter += 1;
  return `test-${label}-${Date.now()}-${counter}@example.com`;
}

export const TEST_PASSWORD = "TestPassword123!";
