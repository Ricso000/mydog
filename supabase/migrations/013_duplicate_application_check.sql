-- Duplicate-application protection (Task 1.6, post-audit phase 0/1 plan).
--
-- The application-submission API route needs to check "has this dog/email
-- pair already applied recently" before inserting a new adoption_applications
-- row. Running that check as a plain SELECT through the normal anon-key
-- client is blocked by RLS for anonymous submitters (no policy lets a
-- stranger read adoption_applications by contact_email — correctly, since
-- that would let anyone enumerate "has this email applied here before").
--
-- This function answers only the one narrow boolean question the route
-- actually needs, via security definer (same trust model as is_admin() /
-- is_partner_member() elsewhere in this schema), without exposing the
-- underlying rows to the caller.
create or replace function has_recent_pending_application(p_dog_id uuid, p_email text, p_window_hours int default 24)
returns boolean
language sql security definer set search_path = public as $$
  select exists (
    select 1 from adoption_applications
    where dog_id = p_dog_id
      and lower(contact_email) = lower(p_email)
      and status not in ('rejected', 'withdrawn')
      and created_at >= now() - (p_window_hours || ' hours')::interval
  );
$$;

grant execute on function has_recent_pending_application(uuid, text, int) to anon, authenticated;
