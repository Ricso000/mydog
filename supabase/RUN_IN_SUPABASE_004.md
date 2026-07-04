# Sprint 4 — Admin Portal RLS Migration

Run the following SQL in the **Supabase SQL Editor** for your MyDog project.

## File: `supabase/migrations/004_admin_portal.sql`

```sql
-- Allow admins to insert activity logs (browser client actions from admin portal)
create policy "Admins insert activity_logs"
  on activity_logs for insert
  with check (is_admin());

-- Allow admins to update any profile (for role management)
create policy "Admins update all profiles"
  on profiles for update
  using (is_admin());
```

## Notes

- `is_admin()` is a DB function that checks `profiles.role = 'admin'` for the current authenticated user.
- The `activity_logs` INSERT policy is required for `PartnerActions` and `DogStatusAction` client components to log admin actions.
- The `profiles` UPDATE policy is required for `UserRoleAction` client component to promote/demote users.
- If a policy already exists with the same name, drop it first: `drop policy "..." on <table>;`
