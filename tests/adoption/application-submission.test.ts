import { describe, it, expect, afterAll } from "vitest";
import { serviceClient } from "../fixtures/supabaseClients";
import { createFixturePartner, cleanupFixturePartner, type FixturePartner } from "../fixtures/partnerFixture";
import { TEST_SERVER_URL } from "../globalSetup";

describe("POST /api/applications", () => {
  let fixture: FixturePartner;

  afterAll(async () => {
    if (fixture) await cleanupFixturePartner(fixture);
  });

  it("sets up a fixture partner + dog", async () => {
    fixture = await createFixturePartner("application");
    expect(fixture.dogId).toBeTruthy();
  });

  it("a valid submission persists with the correct fields", async () => {
    const res = await fetch(`${TEST_SERVER_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dogId: fixture.dogId,
        name: "Valid Applicant",
        email: "valid-applicant@example.com",
        message: "A real, valid test application.",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    const svc = serviceClient();
    const { data } = await svc
      .from("adoption_applications")
      .select("contact_name, contact_email, status")
      .eq("dog_id", fixture.dogId)
      .eq("contact_email", "valid-applicant@example.com")
      .single();
    expect(data?.contact_name).toBe("Valid Applicant");
    expect(data?.status).toBe("submitted");
  });

  it("rejects an invalid email format", async () => {
    const res = await fetch(`${TEST_SERVER_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dogId: fixture.dogId, name: "Bad Email Applicant", email: "not-an-email" }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects a request missing required fields", async () => {
    const res = await fetch(`${TEST_SERVER_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dogId: fixture.dogId }),
    });
    expect(res.status).toBe(400);
  });
});
