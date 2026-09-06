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

  it("rejects a message over the length cap", async () => {
    const res = await fetch(`${TEST_SERVER_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dogId: fixture.dogId,
        name: "Long Message Applicant",
        email: "long-message@example.com",
        message: "x".repeat(2001),
      }),
    });
    expect(res.status).toBe(400);
  });

  it("silently accepts (200, no row created) a honeypot-filled submission", async () => {
    const res = await fetch(`${TEST_SERVER_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dogId: fixture.dogId,
        name: "Bot",
        email: "bot@example.com",
        website: "https://spam.example.com",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    const svc = serviceClient();
    const { data } = await svc.from("adoption_applications").select("id").eq("contact_email", "bot@example.com");
    expect(data ?? []).toHaveLength(0);
  });

  it("rejects a duplicate submission for the same dog + email within the window", async () => {
    const payload = {
      dogId: fixture.dogId,
      name: "Duplicate Applicant",
      email: "duplicate-applicant@example.com",
      message: "First submission.",
    };
    const first = await fetch(`${TEST_SERVER_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(first.status).toBe(200);

    const second = await fetch(`${TEST_SERVER_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, message: "Second, duplicate submission." }),
    });
    expect(second.status).toBe(409);

    const svc = serviceClient();
    const { data } = await svc
      .from("adoption_applications")
      .select("id")
      .eq("contact_email", "duplicate-applicant@example.com");
    expect(data ?? []).toHaveLength(1);
  });

  it("still allows a submission for a different dog by the same email", async () => {
    const otherFixture = await createFixturePartner("application-other-dog");
    const res = await fetch(`${TEST_SERVER_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dogId: otherFixture.dogId,
        name: "Duplicate Applicant",
        email: "duplicate-applicant@example.com",
        message: "Same email, different dog — should succeed.",
      }),
    });
    expect(res.status).toBe(200);
    await cleanupFixturePartner(otherFixture);
  });

  it("still allows a submission for the same dog after the prior one was rejected", async () => {
    const svc = serviceClient();
    await svc
      .from("adoption_applications")
      .update({ status: "rejected" })
      .eq("dog_id", fixture.dogId)
      .eq("contact_email", "duplicate-applicant@example.com");

    const res = await fetch(`${TEST_SERVER_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dogId: fixture.dogId,
        name: "Duplicate Applicant",
        email: "duplicate-applicant@example.com",
        message: "Re-applying after rejection — should succeed.",
      }),
    });
    expect(res.status).toBe(200);
  });
});
