import { anonClient, serviceClient, uniqueTestEmail, TEST_PASSWORD } from "./supabaseClients";

export interface FixtureUser {
  id: string;
  email: string;
  client: ReturnType<typeof anonClient>;
}

/** A fresh, throwaway, ordinary (non-admin, non-partner) authenticated user. */
export async function createFixtureUser(label: string): Promise<FixtureUser> {
  const svc = serviceClient();
  const email = uniqueTestEmail(`user-${label}`);
  const { data: created, error } = await svc.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !created.user) throw new Error(`Fixture user creation failed: ${error?.message}`);

  const client = anonClient();
  const { data: signIn, error: signInError } = await client.auth.signInWithPassword({ email, password: TEST_PASSWORD });
  if (signInError || !signIn.session) throw new Error(`Fixture user sign-in failed: ${signInError?.message}`);

  return { id: created.user.id, email, client };
}

export async function cleanupFixtureUser(userId: string): Promise<void> {
  const svc = serviceClient();
  await svc.auth.admin.deleteUser(userId);
}
