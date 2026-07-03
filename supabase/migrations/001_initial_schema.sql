-- ============================================================
-- ENUMS
-- ============================================================
create type partner_type as enum (
  'shelter','breed_rescue','veterinarian','dog_school',
  'boarding','grooming','walker','dog_friendly_place','transport','other'
);

create type partner_status as enum (
  'draft','pending_review','approved','rejected','archived','suspended'
);

create type partner_member_role as enum ('owner','manager','editor','viewer');

create type dog_gender as enum ('male','female');

create type dog_size as enum ('small','medium','large','xlarge');

create type dog_status as enum (
  'available','reserved','pending','foster',
  'adopted','medical','inactive','deceased'
);

create type media_type as enum ('image','video','pdf','document');

create type application_status as enum (
  'submitted','reviewing','approved','rejected','withdrawn'
);

create type donation_payment_status as enum (
  'pending','completed','failed','refunded'
);

create type virtual_adoption_status as enum ('active','paused','cancelled');

create type notification_type as enum (
  'adoption_update','partner_message','moderation',
  'donation','virtual_adoption','system'
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  role        text not null default 'user' check (role in ('user','partner','admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- PARTNERS
-- ============================================================
create table partners (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  type        partner_type not null,
  status      partner_status not null default 'draft',
  verified    boolean not null default false,
  description text,
  country     text,
  city        text,
  address     text,
  phone       text,
  email       text,
  website     text,
  logo_url    text,
  cover_url   text,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PARTNER MEMBERS (team membership)
-- ============================================================
create table partner_members (
  id          uuid primary key default gen_random_uuid(),
  partner_id  uuid not null references partners(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  role        partner_member_role not null default 'viewer',
  created_at  timestamptz not null default now(),
  unique(partner_id, profile_id)
);

-- ============================================================
-- DOGS
-- ============================================================
create table dogs (
  id                  uuid primary key default gen_random_uuid(),
  partner_id          uuid not null references partners(id) on delete cascade,
  name                text not null,
  breed               text,
  mixed_breed         boolean not null default false,
  age_years           int,
  age_months          int,
  gender              dog_gender,
  size                dog_size,
  color               text,
  description         text,
  status              dog_status not null default 'available',
  is_vaccinated       boolean default false,
  is_neutered         boolean default false,
  is_chipped          boolean default false,
  is_dewormed         boolean default false,
  is_transportable    boolean default false,
  good_with_kids      boolean default false,
  good_with_dogs      boolean default false,
  good_with_cats      boolean default false,
  country             text,
  city                text,
  primary_image_url   text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- MEDIA (generic: dogs, partners, stories, etc.)
-- ============================================================
create table media (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id   uuid not null,
  media_type  media_type not null default 'image',
  url         text not null,
  alt_text    text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index on media(entity_type, entity_id);

-- ============================================================
-- ADOPTION APPLICATIONS
-- ============================================================
create table adoption_applications (
  id              uuid primary key default gen_random_uuid(),
  dog_id          uuid not null references dogs(id) on delete cascade,
  partner_id      uuid not null references partners(id),
  applicant_id    uuid references profiles(id),
  status          application_status not null default 'submitted',
  message         text,
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- DONATIONS (schema ready, frontend later)
-- ============================================================
create table donations (
  id                  uuid primary key default gen_random_uuid(),
  partner_id          uuid references partners(id),
  dog_id              uuid references dogs(id),
  donor_id            uuid references profiles(id),
  amount              numeric(10,2) not null,
  currency            text not null default 'EUR',
  payment_status      donation_payment_status not null default 'pending',
  stripe_payment_id   text,
  message             text,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- VIRTUAL ADOPTIONS (schema ready, frontend later)
-- ============================================================
create table virtual_adoptions (
  id              uuid primary key default gen_random_uuid(),
  dog_id          uuid not null references dogs(id),
  user_id         uuid not null references profiles(id),
  monthly_amount  numeric(10,2) not null,
  started_at      timestamptz not null default now(),
  status          virtual_adoption_status not null default 'active'
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        notification_type not null,
  title       text not null,
  body        text,
  read        boolean not null default false,
  data        jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index on notifications(user_id, read);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
create table activity_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id),
  action      text not null,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index on activity_logs(entity_type, entity_id);

-- ============================================================
-- TAGS
-- ============================================================
create table tags (
  id    uuid primary key default gen_random_uuid(),
  name  text unique not null,
  slug  text unique not null
);

create table entity_tags (
  entity_type text not null,
  entity_id   uuid not null,
  tag_id      uuid not null references tags(id) on delete cascade,
  primary key (entity_type, entity_id, tag_id)
);

-- ============================================================
-- FAVORITES
-- ============================================================
create table favorite_dogs (
  profile_id  uuid not null references profiles(id) on delete cascade,
  dog_id      uuid not null references dogs(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (profile_id, dog_id)
);

create table favorite_partners (
  profile_id  uuid not null references profiles(id) on delete cascade,
  partner_id  uuid not null references partners(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (profile_id, partner_id)
);

-- ============================================================
-- RLS
-- ============================================================
alter table profiles enable row level security;
alter table partners enable row level security;
alter table partner_members enable row level security;
alter table dogs enable row level security;
alter table media enable row level security;
alter table adoption_applications enable row level security;
alter table donations enable row level security;
alter table virtual_adoptions enable row level security;
alter table notifications enable row level security;
alter table activity_logs enable row level security;
alter table tags enable row level security;
alter table entity_tags enable row level security;
alter table favorite_dogs enable row level security;
alter table favorite_partners enable row level security;

-- Helper: is admin
create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: is partner member
create or replace function is_partner_member(p_partner_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from partner_members
    where partner_id = p_partner_id and profile_id = auth.uid()
  );
$$;

-- PROFILES
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can read all profiles" on profiles for select using (is_admin());

-- PARTNERS: public can read approved
create policy "Public can read approved partners" on partners for select using (status = 'approved');
create policy "Members can read own partner" on partners for select using (is_partner_member(id));
create policy "Members can update own partner" on partners for update using (is_partner_member(id));
create policy "Authenticated can create partner" on partners for insert with check (auth.uid() is not null);
create policy "Admins full access partners" on partners for all using (is_admin());

-- PARTNER MEMBERS
create policy "Members can read own memberships" on partner_members for select using (profile_id = auth.uid() or is_partner_member(partner_id));
create policy "Admins full access partner_members" on partner_members for all using (is_admin());

-- DOGS: public can read if partner approved
create policy "Public can read dogs of approved partners" on dogs for select
  using (exists (select 1 from partners where id = partner_id and status = 'approved'));
create policy "Partner members can manage dogs" on dogs for all using (is_partner_member(partner_id));
create policy "Admins full access dogs" on dogs for all using (is_admin());

-- MEDIA: public read if entity accessible
create policy "Public can read media" on media for select using (true);
create policy "Admins full access media" on media for all using (is_admin());

-- ADOPTION APPLICATIONS
create policy "Applicants can read own applications" on adoption_applications for select using (applicant_id = auth.uid());
create policy "Applicants can create applications" on adoption_applications for insert with check (auth.uid() is not null);
create policy "Partner members can read applications for their dogs" on adoption_applications for select using (is_partner_member(partner_id));
create policy "Admins full access applications" on adoption_applications for all using (is_admin());

-- NOTIFICATIONS
create policy "Users can read own notifications" on notifications for select using (user_id = auth.uid());
create policy "Users can update own notifications" on notifications for update using (user_id = auth.uid());

-- FAVORITES
create policy "Users manage own dog favorites" on favorite_dogs for all using (profile_id = auth.uid());
create policy "Users manage own partner favorites" on favorite_partners for all using (profile_id = auth.uid());

-- TAGS: public read
create policy "Public can read tags" on tags for select using (true);
create policy "Public can read entity_tags" on entity_tags for select using (true);
create policy "Admins manage tags" on tags for all using (is_admin());
create policy "Admins manage entity_tags" on entity_tags for all using (is_admin());

-- DONATIONS / VIRTUAL ADOPTIONS: own only
create policy "Users see own donations" on donations for select using (donor_id = auth.uid());
create policy "Users see own virtual adoptions" on virtual_adoptions for select using (user_id = auth.uid());

-- ACTIVITY LOGS: admin only
create policy "Admins read activity_logs" on activity_logs for select using (is_admin());
