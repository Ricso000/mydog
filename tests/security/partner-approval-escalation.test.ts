import { describe, it, expect, afterAll } from "vitest";
import { serviceClient, anonClient, uniqueTestEmail, TEST_PASSWORD } from "../fixtures/supabaseClients";
import { getTestAdminSession } from "../fixtures/adminFixture";

/**
 * Regression suite for supabase/migrations/012_fix_partner_approval_escalation.sql.
 * Automates the 4-case suite manually verified live against production during
 * the 2026-09-06 audit (see docs/audit-2026-09-launch-readiness/12-security-and-permissions.md §1b).
 */
describe("partners self-approval/self-verification is blocked", () => {
  const createdUserIds: string[] = [];
  const createdPartnerIds: string[] = [];

  afterAll(async () => {
    const svc = serviceClient();
    for (const id of createdPartnerIds) await svc.from("partners").delete().eq("id", id);
    for (const id of createdUserIds) await svc.auth.admin.deleteUser(id);
  });

  async function createDraftPartner(label: string) {
    const svc = serviceClient();
    const email = uniqueTestEmail(`partnerescalation-${label}`);
    const { data: created, error } = await svc.auth.admin.createUser({ email, password: TEST_PASSWORD, email_confirm: true });
    if (error || !created.user) throw new Error(`setup failed: ${error?.message}`);
    createdUserIds.push(created.user.id);

    const client = anonClient();
    const { data: signIn, error: signInError } = await client.auth.signInWithPassword({ email, password: TEST_PASSWORD });
    if (signInError || !signIn.session) throw new Error(`setup sign-in failed: ${signInError?.message}`);

    const slug = `escalation-test-${label}-${Date.now()}`;
    const { error: insertError } = await client
      .from("partners")
      .insert({ name: "Escalation Test Partner", slug, type: "shelter", country: "HU" });
    if (insertError) throw new Error(`setup partner insert failed: ${insertError.message}`);

    const { data: row, error: fetchError } = await client.from("partners").select("id").eq("slug", slug).single();
    if (fetchError || !row) throw new Error(`setup readback failed: ${fetchError?.message}`);
    createdPartnerIds.push(row.id as string);

    return { client, partnerId: row.id as string };
  }

  it("rejects a partner member trying to self-approve (status)", async () => {
    const { client, partnerId } = await createDraftPartner("selfapprove");
    const { error } = await client.from("partners").update({ status: "approved" }).eq("id", partnerId);
    expect(error).not.toBeNull();
    expect(error?.message).toContain("insufficient_privilege");

    const svc = serviceClient();
    const { data } = await svc.from("partners").select("status").eq("id", partnerId).single();
    expect(data?.status).toBe("draft");
  });

  it("rejects a partner member trying to self-verify", async () => {
    const { client, partnerId } = await createDraftPartner("selfverify");
    const { error } = await client.from("partners").update({ verified: true }).eq("id", partnerId);
    expect(error).not.toBeNull();
    expect(error?.message).toContain("insufficient_privilege");

    const svc = serviceClient();
    const { data } = await svc.from("partners").select("verified").eq("id", partnerId).single();
    expect(data?.verified).toBe(false);
  });

  it("still allows a legitimate field edit (description/phone/city)", async () => {
    const { client, partnerId } = await createDraftPartner("legitedit");
    const { error } = await client
      .from("partners")
      .update({ description: "Updated description", phone: "+36 1 000 0000", city: "Debrecen" })
      .eq("id", partnerId);
    expect(error).toBeNull();

    const svc = serviceClient();
    const { data } = await svc.from("partners").select("description, phone, city").eq("id", partnerId).single();
    expect(data?.description).toBe("Updated description");
    expect(data?.city).toBe("Debrecen");
  });

  it("still allows a legitimate admin approval + verification", async () => {
    const { partnerId } = await createDraftPartner("adminapprove");
    const adminSession = await getTestAdminSession();
    const adminClient = anonClient();
    await adminClient.auth.setSession(adminSession);

    const { error } = await adminClient
      .from("partners")
      .update({ status: "approved", verified: true })
      .eq("id", partnerId);
    expect(error).toBeNull();

    const svc = serviceClient();
    const { data } = await svc.from("partners").select("status, verified").eq("id", partnerId).single();
    expect(data?.status).toBe("approved");
    expect(data?.verified).toBe(true);
  });
});
