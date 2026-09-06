import { describe, it, expect, afterAll } from "vitest";
import { anonClient, serviceClient, uniqueTestEmail, TEST_PASSWORD } from "../fixtures/supabaseClients";

/**
 * Automated version of the 5-step password-reset acceptance criterion from
 * docs/implementation/phase-0-1-plan.md Task 1.4: reset request -> recovery
 * session -> new password -> old password fails -> new password succeeds.
 *
 * The real UI (src/app/jelszo-visszaallitas/*) establishes the recovery
 * session by parsing the email link's URL fragment in the browser — not
 * something this Node test suite can click through. Supabase's admin
 * generateLink API returns an `email_otp` for the same recovery request,
 * which `verifyOtp()` exchanges for a real session via the same underlying
 * GoTrue verification path the email link itself uses — this test exercises
 * that shared path, not a mock.
 */
describe("password reset (5-step acceptance flow)", () => {
  const email = uniqueTestEmail("passwordreset");
  const oldPassword = TEST_PASSWORD;
  const newPassword = "NewPassword456!";
  let userId: string;

  afterAll(async () => {
    if (userId) await serviceClient().auth.admin.deleteUser(userId);
  });

  it("sets up a fixture user with a known password", async () => {
    const svc = serviceClient();
    const { data, error } = await svc.auth.admin.createUser({ email, password: oldPassword, email_confirm: true });
    expect(error).toBeNull();
    userId = data.user!.id;
  });

  it("step 1: a reset request generates a real recovery link/OTP", async () => {
    const svc = serviceClient();
    const { data, error } = await svc.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: "http://localhost:3000/jelszo-visszaallitas/uj-jelszo" },
    });
    expect(error).toBeNull();
    expect(data.properties?.email_otp).toBeTruthy();
    (globalThis as unknown as { __otp: string }).__otp = data.properties!.email_otp!;
  });

  it("steps 2-3: following the link establishes a session, and a new password can be set", async () => {
    const otp = (globalThis as unknown as { __otp: string }).__otp;
    const client = anonClient();
    const { data: verifyData, error: verifyError } = await client.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery",
    });
    expect(verifyError).toBeNull();
    expect(verifyData.session).not.toBeNull();

    const { error: updateError } = await client.auth.updateUser({ password: newPassword });
    expect(updateError).toBeNull();
  });

  it("step 4: the old password no longer works", async () => {
    const client = anonClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password: oldPassword });
    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });

  it("step 5: the new password works", async () => {
    const client = anonClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password: newPassword });
    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
  });
});
