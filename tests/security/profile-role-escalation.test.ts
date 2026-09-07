import { describe, it, expect, afterAll } from "vitest";
import { serviceClient } from "../fixtures/supabaseClients";
import { createFixtureUser, cleanupFixtureUser, type FixtureUser } from "../fixtures/userFixture";
import { getTestAdminSession } from "../fixtures/adminFixture";
import { anonClient } from "../fixtures/supabaseClients";

/**
 * Regression suite for supabase/migrations/011_fix_role_privilege_escalation.sql.
 * Automates the exact 5-case suite manually verified live against production
 * during the 2026-09-06 audit (see docs/audit-2026-09-launch-readiness/12-security-and-permissions.md §1).
 */
describe("profiles.role privilege escalation is blocked", () => {
  const created: FixtureUser[] = [];

  afterAll(async () => {
    for (const u of created) await cleanupFixtureUser(u.id);
  });

  it("rejects a user trying to grant themselves admin", async () => {
    const userA = await createFixtureUser("roleA");
    created.push(userA);

    const { error } = await userA.client.from("profiles").update({ role: "admin" }).eq("id", userA.id);
    expect(error).not.toBeNull();
    expect(error?.message).toContain("insufficient_privilege");

    const svc = serviceClient();
    const { data } = await svc.from("profiles").select("role").eq("id", userA.id).single();
    expect(data?.role).toBe("user");
  });

  it("rejects a user trying to grant admin to a different user", async () => {
    const userA = await createFixtureUser("roleA2");
    const userB = await createFixtureUser("roleB2");
    created.push(userA, userB);

    const { data, error } = await userA.client
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", userB.id)
      .select("id");
    // RLS row-scoping means this matches 0 rows (not userA's own row) — no error, no effect.
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);

    const svc = serviceClient();
    const { data: profile } = await svc.from("profiles").select("role").eq("id", userB.id).single();
    expect(profile?.role).toBe("user");
  });

  it("rejects an anonymous (unauthenticated) request", async () => {
    const userA = await createFixtureUser("roleAnon");
    created.push(userA);

    const anon = anonClient();
    const { data, error } = await anon.from("profiles").update({ role: "admin" }).eq("id", userA.id).select("id");
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("still allows a legitimate self-edit (full_name)", async () => {
    const userA = await createFixtureUser("roleSelfEdit");
    created.push(userA);

    const { error } = await userA.client
      .from("profiles")
      .update({ full_name: "Updated Name" })
      .eq("id", userA.id);
    expect(error).toBeNull();

    const svc = serviceClient();
    const { data } = await svc.from("profiles").select("full_name").eq("id", userA.id).single();
    expect(data?.full_name).toBe("Updated Name");
  });

  it("still allows a legitimate admin to grant another user's role", async () => {
    const userA = await createFixtureUser("roleAdminGrant");
    created.push(userA);

    const adminSession = await getTestAdminSession();
    const adminClient = anonClient();
    await adminClient.auth.setSession(adminSession);

    const { error } = await adminClient.from("profiles").update({ role: "admin" }).eq("id", userA.id);
    expect(error).toBeNull();

    const svc = serviceClient();
    const { data } = await svc.from("profiles").select("role").eq("id", userA.id).single();
    expect(data?.role).toBe("admin");
    // No revert needed: afterAll deletes this fixture user's auth account entirely
    // regardless of role — and note that even service_role could not revert this
    // via a plain UPDATE anyway, since the role-change trigger applies to every
    // caller including service_role (auth.uid() is null for it, so is_admin() is
    // false) — reverting a role requires the same disable-trigger bootstrap path
    // documented in fixtures/adminFixture.ts, not a casual cleanup call.
  });
});
