import { describe, it, expect, afterAll } from "vitest";
import { anonClient, serviceClient, uniqueTestEmail, TEST_PASSWORD } from "../fixtures/supabaseClients";

/**
 * Task 1.7: with mailer_autoconfirm = false, an unconfirmed account must not
 * be able to log in, and confirming it must make login work.
 *
 * This deliberately avoids the public signUp() call, which would trigger a
 * real outbound confirmation email and count against this project's shared
 * rate_limit_email_sent quota (2/hour by default, raisable only via custom
 * SMTP — see docs/implementation/phase-0-1-plan.md Task 1.5 Layer 3). Admin-
 * created users and admin.generateLink() send no email at all, so this test
 * exercises the same confirmation-gate behavior without consuming that quota.
 */
describe("signup email confirmation gate", () => {
  const email = uniqueTestEmail("signupconfirm");
  let userId: string;

  afterAll(async () => {
    if (userId) await serviceClient().auth.admin.deleteUser(userId);
  });

  it("an unconfirmed account cannot log in", async () => {
    const svc = serviceClient();
    const { data, error } = await svc.auth.admin.createUser({ email, password: TEST_PASSWORD, email_confirm: false });
    expect(error).toBeNull();
    userId = data.user!.id;

    const client = anonClient();
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({ email, password: TEST_PASSWORD });
    expect(signInError).not.toBeNull();
    expect(signInError?.code).toBe("email_not_confirmed");
    expect(signInData.session).toBeNull();
  });

  it("confirming (via the same link-follow path as a real email) allows login afterward", async () => {
    const svc = serviceClient();
    const { data, error } = await svc.auth.admin.generateLink({
      type: "signup",
      email,
      password: TEST_PASSWORD,
      options: { redirectTo: "http://localhost:3000/megerositve" },
    });
    expect(error).toBeNull();

    const client = anonClient();
    const { data: verifyData, error: verifyError } = await client.auth.verifyOtp({
      email,
      token: data.properties!.email_otp!,
      type: "signup",
    });
    expect(verifyError).toBeNull();
    expect(verifyData.session).not.toBeNull();

    const loginClient = anonClient();
    const { data: loginData, error: loginError } = await loginClient.auth.signInWithPassword({ email, password: TEST_PASSWORD });
    expect(loginError).toBeNull();
    expect(loginData.session).not.toBeNull();
  });
});
