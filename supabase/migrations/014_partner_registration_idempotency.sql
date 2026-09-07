-- Partner registration idempotency (Task 1.7, post-audit phase 0/1 plan).
--
-- With real email confirmation now required (mailer_autoconfirm = false),
-- partner registration must defer the `partners` insert until after the
-- user confirms their email (no session exists between signUp() and
-- confirmation, so the insert can't happen inline anymore — see
-- docs/implementation/phase-0-1-plan.md Task 1.7). The confirmation-landing
-- page performs that deferred insert, and it must be safe to run more than
-- once for the same user (a double-clicked email link, a browser retry, or
-- two tabs both landing on the same confirmation).
--
-- A partial unique index gives this a real, database-enforced guarantee
-- (atomic regardless of concurrent requests) rather than relying on a
-- non-atomic "check a flag, then act" sequence in application code.
alter table partners add column created_by_user_id uuid references profiles(id);

-- Partial: only rows where this is set are constrained, so every existing
-- partner (created before this column existed, all NULL here) is untouched
-- — Postgres treats multiple NULLs as distinct in a unique index.
create unique index partners_created_by_user_id_unique
  on partners (created_by_user_id)
  where created_by_user_id is not null;
