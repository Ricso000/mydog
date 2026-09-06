import type { Session } from "@supabase/supabase-js";
import { anonClient, serviceClient } from "./supabaseClients";

/**
 * Test-fixture bootstrap ONLY — never run any of this against production.
 *
 * `profiles.role` is protected by a BEFORE UPDATE trigger
 * (supabase/migrations/011_fix_role_privilege_escalation.sql) that rejects any
 * change to `role` unless the caller is already an admin. That is exactly the
 * behavior this test suite exists to enforce, so this fixture deliberately
 * does NOT try to grant admin through the normal RLS-scoped path (it can't —
 * that's the point of the fix). Instead, the CI Test project's one fixture
 * admin account (ci-fixture-admin@example.com) was bootstrapped ONCE, out of
 * band, via a direct Postgres connection that temporarily disabled the
 * trigger, exactly the way a project's very first-ever admin has to be
 * created in any system with this kind of protection:
 *
 *   supabase db query --db-url <CI-test-db-url> \
 *     "alter table profiles disable trigger trg_prevent_unauthorized_role_change"
 *   supabase db query --db-url <CI-test-db-url> \
 *     "update profiles set role = 'admin' where id = '<fixture-admin-uuid>'"
 *   supabase db query --db-url <CI-test-db-url> \
 *     "alter table profiles enable trigger trg_prevent_unauthorized_role_change"
 *
 * This helper only ever signs in as that already-admin fixture account. If it
 * doesn't exist (e.g. a freshly re-created CI Test project), it throws with
 * instructions rather than silently attempting to re-bootstrap it — bootstrap
 * is a deliberate, out-of-band, human-run action, not something the test
 * suite does for itself at runtime.
 */
export const TEST_ADMIN_EMAIL = "ci-fixture-admin@example.com";
export const TEST_ADMIN_PASSWORD = "CiFixtureAdmin123!";

export async function getTestAdminSession(): Promise<Session> {
  const svc = serviceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("id, role")
    .eq(
      "id",
      (
        await svc.auth.admin.listUsers()
      ).data.users.find((u) => u.email === TEST_ADMIN_EMAIL)?.id ?? "00000000-0000-0000-0000-000000000000"
    )
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    throw new Error(
      `Fixture admin account (${TEST_ADMIN_EMAIL}) does not exist or is not role='admin' in the ` +
        `CI Test project. This must be bootstrapped once, out of band, via a direct DB connection ` +
        `with the role-change trigger temporarily disabled — see this file's header comment for the ` +
        `exact commands. It is not something this test suite bootstraps itself.`
    );
  }

  const client = anonClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD,
  });
  if (error || !data.session) {
    throw new Error(`Could not sign in as the fixture admin: ${error?.message}`);
  }
  return data.session;
}
