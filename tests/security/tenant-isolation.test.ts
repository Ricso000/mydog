import { describe, it, expect, afterAll } from "vitest";
import { serviceClient } from "../fixtures/supabaseClients";
import { createFixturePartner, cleanupFixturePartner, type FixturePartner } from "../fixtures/partnerFixture";

/**
 * New coverage per the post-audit master plan: two distinct partners, each
 * with their own dog, and assert Partner A's session cannot touch Partner B's
 * data — an RLS rejection, not merely "the UI doesn't show a button for it."
 */
describe("cross-partner tenant isolation", () => {
  let partnerA: FixturePartner;
  let partnerB: FixturePartner;

  afterAll(async () => {
    if (partnerA) await cleanupFixturePartner(partnerA);
    if (partnerB) await cleanupFixturePartner(partnerB);
  });

  it("sets up two independent, approved partners with their own dogs", async () => {
    partnerA = await createFixturePartner("tenantA");
    partnerB = await createFixturePartner("tenantB");
    expect(partnerA.partnerId).not.toBe(partnerB.partnerId);
  });

  it("Partner A cannot update Partner B's dog", async () => {
    const { data, error } = await partnerA.ownerClient
      .from("dogs")
      .update({ description: "hijacked" })
      .eq("id", partnerB.dogId)
      .select("id");
    expect(error).toBeNull(); // RLS silently excludes the row — no error, just 0 rows
    expect(data ?? []).toHaveLength(0);

    const svc = serviceClient();
    const { data: dog } = await svc.from("dogs").select("description").eq("id", partnerB.dogId).single();
    expect(dog?.description).not.toBe("hijacked");
  });

  it("Partner A cannot delete Partner B's dog", async () => {
    const { data, error } = await partnerA.ownerClient.from("dogs").delete().eq("id", partnerB.dogId).select("id");
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);

    const svc = serviceClient();
    const { data: dog } = await svc.from("dogs").select("id").eq("id", partnerB.dogId).maybeSingle();
    expect(dog).not.toBeNull();
  });

  it("Partner A cannot read Partner B's adoption applications", async () => {
    const svc = serviceClient();
    const { error: insertError } = await svc.from("adoption_applications").insert({
      dog_id: partnerB.dogId,
      partner_id: partnerB.partnerId,
      contact_name: "Isolation Test Applicant",
      contact_email: "isolation-test-applicant@example.com",
      status: "submitted",
    });
    expect(insertError).toBeNull();

    const { data, error } = await partnerA.ownerClient
      .from("adoption_applications")
      .select("id")
      .eq("partner_id", partnerB.partnerId);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });
});
