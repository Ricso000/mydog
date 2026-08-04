-- ============================================================
-- SAVED SEARCHES
-- ============================================================
create table saved_searches (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  name        text,
  filters     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index on saved_searches(profile_id);

alter table saved_searches enable row level security;

create policy "Users manage own saved searches" on saved_searches for all using (profile_id = auth.uid());
