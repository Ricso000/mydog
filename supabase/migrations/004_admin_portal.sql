-- Sprint 4: Admin Portal RLS policies

-- Allow admins to insert activity logs (browser client actions from admin portal)
create policy "Admins insert activity_logs"
  on activity_logs for insert
  with check (is_admin());

-- Allow admins to update any profile (for role management)
create policy "Admins update all profiles"
  on profiles for update
  using (is_admin());
