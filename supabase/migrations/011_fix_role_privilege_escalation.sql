-- SECURITY FIX: prevent self-service privilege escalation via profiles.role
--
-- "Users can update own profile" (001_initial_schema.sql) only restricts which
-- ROW a user may touch (auth.uid() = id) — it has no `with check`, so it does
-- not restrict which COLUMNS change. Any authenticated user could therefore
-- call `update profiles set role = 'admin' where id = auth.uid()` directly via
-- the public REST API and grant themselves admin access. Confirmed live via a
-- fresh throwaway test account on 2026-09-06 (see audit report 12).
--
-- Fix: a BEFORE UPDATE trigger blocks any change to `role` unless the caller
-- is already an admin (via the existing is_admin() security-definer helper).
-- This enforces the rule regardless of which RLS policy allowed the row-level
-- update (both "Users can update own profile" and "Admins update all
-- profiles" route through this same trigger), so role changes are only ever
-- possible through a trusted admin-authorized path.

create or replace function prevent_unauthorized_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not is_admin() then
      raise exception 'insufficient_privilege: only admins may change profiles.role'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_unauthorized_role_change on profiles;

create trigger trg_prevent_unauthorized_role_change
  before update on profiles
  for each row execute procedure prevent_unauthorized_role_change();
