-- SECURITY FIX: prevent partner self-approval / self-verification
--
-- "Members can update own partner" (001_initial_schema.sql) only restricts
-- which ROW a partner member may touch (is_partner_member(id)) — it has no
-- `with check`, so it does not restrict which COLUMNS change. Any member of
-- a freshly self-registered (`status = 'draft'`, `verified = false`) partner
-- could therefore call
--   update partners set status = 'approved', verified = true where id = <own partner id>
-- directly via the public REST API, bypassing the admin moderation queue
-- entirely. Once `status = 'approved'`, the partner's dogs become publicly
-- visible on /kutyak (RLS: "Public can read dogs of approved partners"), and
-- the partner gets the "✓ Ellenőrzött" verified badge — both are supposed to
-- be admin-gated trust signals. Confirmed live via a fresh throwaway partner
-- on 2026-09-06 (see audit report 12).
--
-- Fix: a BEFORE UPDATE trigger blocks any change to `status` or `verified`
-- unless the caller is an admin. No legitimate non-admin code path in this
-- app ever changes these two columns (grep confirms /partner/register only
-- ever creates status='draft', verified defaults false; no partner-facing UI
-- attempts to change either column), so this cannot break any existing
-- feature — partners can still freely edit name/description/contact/etc.

create or replace function prevent_unauthorized_partner_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.status is distinct from old.status) or (new.verified is distinct from old.verified) then
    if not is_admin() then
      raise exception 'insufficient_privilege: only admins may change partners.status or partners.verified'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_unauthorized_partner_approval on partners;

create trigger trg_prevent_unauthorized_partner_approval
  before update on partners
  for each row execute procedure prevent_unauthorized_partner_approval();
