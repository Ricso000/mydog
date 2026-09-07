import { describe, it, expect, afterAll } from "vitest";
import { anonClient, serviceClient, uniqueTestEmail, TEST_PASSWORD } from "../fixtures/supabaseClients";

/**
 * Task 1.7: partner registration defers the `partners` insert to the
 * confirmation-landing page (src/app/megerositve/page.tsx), since no session
 * exists between signUp() and email confirmation. This test drives the same
 * insert logic that page performs, against a real confirmed session, to
 * verify both the happy path and the concurrency/idempotency guarantee from
 * 014_partner_registration_idempotency.sql.
 */
describe("deferred partner-registration insert", () => {
  const userIds: string[] = [];
  const partnerIds: string[] = [];

  afterAll(async () => {
    const svc = serviceClient();
    for (const id of partnerIds) await svc.from("partners").delete().eq("id", id);
    for (const id of userIds) await svc.auth.admin.deleteUser(id);
  });

  async function confirmedSession() {
    const svc = serviceClient();
    const email = uniqueTestEmail("partnerconfirm");
    const { data } = await svc.auth.admin.generateLink({
      type: "signup",
      email,
      password: TEST_PASSWORD,
      options: { redirectTo: "http://localhost:3000/megerositve" },
    });
    userIds.push(data.user!.id);
    const client = anonClient();
    await client.auth.verifyOtp({ email, token: data.properties!.email_otp!, type: "signup" });
    return client;
  }

  it("creates the partner once a real session exists, attributed via created_by_user_id", async () => {
    const client = await confirmedSession();
    const slug = `partner-confirm-test-${Date.now()}`;
    const { data: userData } = await client.auth.getUser();

    const { error } = await client.from("partners").insert({
      name: "Partner Confirmation Test",
      slug,
      type: "shelter",
      country: "HU",
      status: "draft",
      verified: false,
      created_by_user_id: userData.user!.id,
    });
    expect(error).toBeNull();

    const svc = serviceClient();
    const { data: row } = await svc.from("partners").select("id, name").eq("slug", slug).single();
    expect(row?.name).toBe("Partner Confirmation Test");
    partnerIds.push(row!.id as string);
  });

  it("a second concurrent attempt for the same user does not create a duplicate partner", async () => {
    const client = await confirmedSession(); // fresh user for this test
    const { data: userData } = await client.auth.getUser();
    const userIdForThisTest = userData.user!.id;

    // Deliberately no .select() chained on the insert: with
    // Prefer: return=minimal (the default), a successful insert needs only
    // an INSERT-policy check, not a SELECT-policy check against the
    // just-inserted row — chaining .select() here reproduces an unrelated,
    // already-known RLS/RETURNING timing artifact (the auto-membership
    // trigger firing AFTER INSERT vs. the SELECT policy's visibility check),
    // and the real app code (src/app/megerositve/page.tsx) doesn't chain
    // .select() on this insert either.
    const attempt = (label: string) =>
      client.from("partners").insert({
        name: "Concurrency Test Partner",
        slug: `concurrency-test-${label}-${Date.now()}`,
        type: "shelter",
        country: "HU",
        status: "draft",
        verified: false,
        created_by_user_id: userIdForThisTest,
      });

    const [first, second] = await Promise.all([attempt("a"), attempt("b")]);

    // Exactly one of the two concurrent inserts succeeds; the other must hit
    // the unique-violation (23505), not succeed and not throw unhandled.
    const results = [first, second];
    const succeeded = results.filter((r) => !r.error);
    const conflicted = results.filter((r) => r.error?.code === "23505");
    expect(succeeded).toHaveLength(1);
    expect(conflicted).toHaveLength(1);

    const svc = serviceClient();
    const { data: rows } = await svc.from("partners").select("id").eq("created_by_user_id", userIdForThisTest);
    expect(rows ?? []).toHaveLength(1);
    partnerIds.push(...(rows ?? []).map((r) => r.id as string));
  });
});
