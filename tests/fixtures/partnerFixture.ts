import { anonClient, serviceClient, uniqueTestEmail, TEST_PASSWORD } from "./supabaseClients";
import { getTestAdminSession } from "./adminFixture";

export interface FixturePartner {
  ownerId: string;
  ownerEmail: string;
  ownerClient: ReturnType<typeof anonClient>;
  partnerId: string;
  dogId: string;
}

/**
 * Creates a fresh, throwaway, approved+verified partner with one available
 * dog, using only real end-user sessions at every step (never service_role
 * for the actual creation/approval calls) — mirroring the real
 * register -> approve -> list-a-dog flow exactly, so these tests exercise the
 * real RLS boundary rather than a shortcut around it. service_role is used
 * only to sign the owner up (so the test doesn't depend on email delivery).
 */
export async function createFixturePartner(label: string): Promise<FixturePartner> {
  const svc = serviceClient();
  const email = uniqueTestEmail(`partner-${label}`);

  const { data: created, error: createError } = await svc.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (createError || !created.user) throw new Error(`Fixture user creation failed: ${createError?.message}`);
  const ownerId = created.user.id;

  const ownerClient = anonClient();
  const { data: signIn, error: signInError } = await ownerClient.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });
  if (signInError || !signIn.session) throw new Error(`Fixture owner sign-in failed: ${signInError?.message}`);

  const slug = `fixture-${label}-${Date.now()}`;
  const { error: insertError } = await ownerClient
    .from("partners")
    .insert({ name: `Fixture Partner ${label}`, slug, type: "shelter", country: "HU" });
  if (insertError) throw new Error(`Fixture partner insert failed: ${insertError.message}`);

  const { data: partnerRow, error: fetchError } = await ownerClient
    .from("partners")
    .select("id")
    .eq("slug", slug)
    .single();
  if (fetchError || !partnerRow) throw new Error(`Could not read back fixture partner: ${fetchError?.message}`);
  const partnerId = partnerRow.id as string;

  const adminSession = await getTestAdminSession();
  const adminClient = anonClient();
  await adminClient.auth.setSession(adminSession);
  const { error: approveError } = await adminClient
    .from("partners")
    .update({ status: "approved", verified: true })
    .eq("id", partnerId);
  if (approveError) throw new Error(`Fixture partner approval failed: ${approveError.message}`);

  const { data: dogRow, error: dogError } = await ownerClient
    .from("dogs")
    .insert({ partner_id: partnerId, name: `Fixture Dog ${label}`, status: "available", gender: "male", size: "medium" })
    .select("id")
    .single();
  if (dogError || !dogRow) throw new Error(`Fixture dog insert failed: ${dogError?.message}`);

  return { ownerId, ownerEmail: email, ownerClient, partnerId, dogId: dogRow.id as string };
}

/** Deletes a fixture partner (cascades its dogs/applications) and its owner auth user. */
export async function cleanupFixturePartner(fixture: FixturePartner): Promise<void> {
  const svc = serviceClient();
  await svc.from("partners").delete().eq("id", fixture.partnerId);
  await svc.auth.admin.deleteUser(fixture.ownerId);
}
