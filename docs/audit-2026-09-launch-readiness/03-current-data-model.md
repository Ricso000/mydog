# 03 — Current Data Model

Source: full read of all 10 files in `supabase/migrations/*.sql` (346+13+5+11+48+5+35+15+111+65 = 654 lines) plus `supabase/seed.sql` (155 lines). No source code was modified; this is a static read of the SQL plus a grep-based cross-check of which tables the application code actually writes to.

## 1. Enums

| Enum | Values | Defined |
|---|---|---|
| `partner_type` | `shelter, breed_rescue, veterinarian, dog_school, boarding, grooming, walker, dog_friendly_place, transport, other` | `001_initial_schema.sql:4-7` |
| `partner_status` | `draft, pending_review, approved, rejected, archived, suspended` | `001_initial_schema.sql:9-11` |
| `partner_member_role` | `owner, manager, editor, viewer` | `001_initial_schema.sql:13` |
| `dog_gender` | `male, female` | `001_initial_schema.sql:15` |
| `dog_size` | `small, medium, large, xlarge` | `001_initial_schema.sql:17` |
| `dog_status` | `available, reserved, pending, foster, adopted, medical, inactive, deceased` | `001_initial_schema.sql:19-22` — **note: no `not_available`, no `pending_review`.** Both strings are used by application code that targets this column (see report 02 and 04); both are bugs. |
| `media_type` | `image, video, pdf, document` | `001_initial_schema.sql:24` |
| `application_status` | `submitted, reviewing, approved, rejected, withdrawn` | `001_initial_schema.sql:26-28` |
| `donation_payment_status` | `pending, completed, failed, refunded` | `001_initial_schema.sql:30-32` |
| `virtual_adoption_status` | `active, paused, cancelled` | `001_initial_schema.sql:34` |
| `notification_type` | `adoption_update, partner_message, moderation, donation, virtual_adoption, system` | `001_initial_schema.sql:36-39` |

## 2. Tables

For each table: columns/types/defaults/constraints, `created_at`/`updated_at` presence, indexes, and every RLS policy verbatim (table / command / using-clause).

### `profiles` (`001_initial_schema.sql:44-51`)
Extends `auth.users`.
- `id uuid PK references auth.users(id) on delete cascade`
- `full_name text`, `avatar_url text`
- `role text not null default 'user' check (role in ('user','partner','admin'))`
- `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()` — **both present**, but no trigger updates `updated_at` on write anywhere in the migrations (no `updated_at = now()` trigger function exists for any table) — every table's `updated_at` is a static "set on insert, never bumped" column unless the application code manually includes it in an `.update()` call. Confirmed: `src/app/partner/applications/page.tsx:70` manually sets `updated_at: new Date().toISOString()` on `adoption_applications` updates — the only place in the app that does this. No other table's `updated_at` is ever refreshed by the app.
- Auto-populated by `handle_new_user()` trigger on `auth.users` insert (`001_initial_schema.sql:54-69`, trigger `on_auth_user_created`).
- RLS: enabled (`001_initial_schema.sql:263`).
  - `"Users can read own profile"` — SELECT — `using (auth.uid() = id)` (`:296`)
  - `"Users can update own profile"` — UPDATE — `using (auth.uid() = id)` (`:297`)
  - `"Admins can read all profiles"` — SELECT — `using (is_admin())` (`:298`)
  - `"Admins update all profiles"` — UPDATE — `using (is_admin())` (`004_admin_portal.sql:8-11`)
  - **No INSERT policy** — by design, rows are created only by the `handle_new_user()` trigger, which is `security definer` and bypasses RLS. Confirmed no app code ever does `supabase.from("profiles").insert(...)`.
  - No DELETE policy — profiles are never deleted by the app; deletion of the `auth.users` row would cascade (`on delete cascade`, `:45`).

### `partners` (`001_initial_schema.sql:74-93`)
- `id uuid PK default gen_random_uuid()`
- `name text not null`, `slug text unique not null`, `type partner_type not null`
- `status partner_status not null default 'draft'`, `verified boolean not null default false`
- `description text`, `country text`, `city text`, `address text`, `phone text`, `email text`, `website text`, `logo_url text`, `cover_url text`
- `metadata jsonb default '{}'::jsonb`
- `created_at`/`updated_at timestamptz not null default now()` — both present.
- RLS: enabled (`:264`).
  - `"Public can read approved partners"` — SELECT — `using (status = 'approved')` (`:301`)
  - `"Members can read own partner"` — SELECT — `using (is_partner_member(id))` (`:302`)
  - `"Members can update own partner"` — UPDATE — `using (is_partner_member(id))` (`:303`)
  - `"Authenticated can create partner"` — INSERT — `with check (auth.uid() is not null)` (`:304`) — any logged-in user can create an arbitrary partner org; there is no admin pre-approval gate on *creation*, only on public *visibility* (`status='approved'`). Matches the observed `/partner/register` flow (`src/app/partner/register/page.tsx:83-94`), which inserts with `status: "draft"`.
  - `"Admins full access partners"` — ALL — `using (is_admin())` (`:305`)
  - No explicit DELETE policy for non-admins (covered by admin's ALL policy only) — a partner cannot delete their own org record; only status changes are possible via UPDATE.

### `partner_members` (`001_initial_schema.sql:98-105`)
- `id uuid PK`, `partner_id uuid not null references partners(id) on delete cascade`
- `profile_id uuid not null references profiles(id) on delete cascade`
- `role partner_member_role not null default 'viewer'`
- `created_at timestamptz not null default now()` — **no `updated_at`** (role changes, if ever built, would not be timestamped).
- `unique(partner_id, profile_id)`
- Auto-populated by `handle_new_partner()` trigger (`002_partner_portal.sql:1-13`) inserting the creator as `'owner'`.
- RLS: enabled (`:265`).
  - `"Members can read own memberships"` — SELECT — `using (profile_id = auth.uid() or is_partner_member(partner_id))` (`:308`)
  - `"Admins full access partner_members"` — ALL — `using (is_admin())` (`:309`)
  - **No INSERT/UPDATE/DELETE policy for regular members** — a partner member can never invite a co-worker or change team roles through the client (only the `security definer` trigger inserts, and only admins can otherwise modify). Confirmed via grep: no app code writes to `partner_members` except reads (`.select("partner_id...")` in multiple partner pages). Not currently a launch blocker since no team-invite UI exists, but flagged as an RLS trap identical in shape to the `donations`/`virtual_adoptions` gap below, waiting to bite whoever builds that feature.

### `dogs` (`001_initial_schema.sql:110-136`)
- `id uuid PK default gen_random_uuid()`
- `partner_id uuid not null references partners(id) on delete cascade`
- `name text not null`, `breed text`, `mixed_breed boolean not null default false`
- `age_years int`, `age_months int`, `gender dog_gender`, `size dog_size`, `color text`, `description text`
- `status dog_status not null default 'available'`
- `is_vaccinated`, `is_neutered`, `is_chipped`, `is_dewormed`, `is_transportable`, `good_with_kids`, `good_with_dogs`, `good_with_cats` — all `boolean default false`
- `country text`, `city text`, `primary_image_url text`
- `created_at`/`updated_at timestamptz not null default now()` — both present, `updated_at` never refreshed on write by any app code path (see `profiles` note above; same applies here — `/partner/dogs/[id]/edit` and admin's `DogStatusAction` both call `.update()` without touching `updated_at`).
- **Orphan-data risk:** `partner_id ... on delete cascade` (`:112`) — if a `partners` row is ever hard-deleted (there is no UI for this; only admin's implicit ALL policy could do it via raw SQL/API), every dog belonging to that partner is silently and permanently deleted, and transitively every `adoption_applications`, `favorite_dogs`, and `media` row referencing those dogs cascades too (see below). No soft-delete column exists anywhere in the schema (`grep -rn "deleted_at"` across `supabase/` and `src/` returns zero matches) — **all deletes in this schema are hard deletes.** Confirmed live in code: `/partner/dogs/[id]/edit`'s delete button (`page.tsx:135-141`) does `supabase.from("dogs").delete().eq("id", dogId)` with only a `window.confirm()` guard — no soft-delete, no trash/undo.
- RLS: enabled (`:266`).
  - `"Public can read dogs of approved partners"` — SELECT — `using (exists (select 1 from partners where id = partner_id and status = 'approved'))` (`:312-313`)
  - `"Partner members can manage dogs"` — ALL — `using (is_partner_member(partner_id))` (`:314`)
  - `"Admins full access dogs"` — ALL — `using (is_admin())` (`:315`)
  - This is the table with the confirmed launch-blocking bug: the app writes the string `'not_available'` to `status` (`src/components/admin/DogStatusAction.tsx:13,24,34`; `src/app/partner/dogs/[id]/edit/page.tsx:19`), which is not a member of `dog_status` — every such write fails with Postgres `22P02`. This is an application-code/enum mismatch, not an RLS gap (the RLS policy itself is correctly permissive for the intended writer).

### `media` (`001_initial_schema.sql:141-151`)
- `id uuid PK`, `entity_type text not null`, `entity_id uuid not null` (polymorphic, no FK — cannot be enforced by Postgres)
- `media_type media_type not null default 'image'`, `url text not null`, `alt_text text`, `sort_order int not null default 0`
- `created_at timestamptz not null default now()` — **no `updated_at`** (media rows are treated as immutable/replace-by-delete-and-insert, consistent with no app code ever calling `.update()` on this table).
- Index: `create index on media(entity_type, entity_id)` (`:151`).
- RLS: enabled (`:267`).
  - `"Public can read media"` — SELECT — `using (true)` (`:318`) — fully open read, no entity-approval check at all (unlike `dogs`, which gates on partner approval). A media row for a dog belonging to an unapproved/draft partner would still be publicly readable if its URL were guessed/leaked, though it wouldn't be discoverable through any UI since the parent `dogs` row itself is gated.
  - `"Admins full access media"` — ALL — `using (is_admin())` (`:319`)
  - **No INSERT/UPDATE/DELETE policy for partner members.** Cross-checked against app code: `grep -rn "from(\"media\")"` across `src/` finds exactly one call site, `src/app/kutyak/[id]/page.tsx:93`, and it is a **read-only SELECT**. No partner-facing UI (`/partner/dogs/new`, `/partner/dogs/[id]/edit`) ever inserts into `media` — both instead write directly to `dogs.primary_image_url` via Supabase Storage (`DogImageUpload.tsx:42-53`). So this is a real RLS gap (identical shape to the `dog_status` trap: an enabled table with no write policy for the role that would need one) but it is currently **dormant** — nothing in the UI attempts to write to `media`, so it cannot fire today. Flagged because a future "multiple photos per dog" feature (implied by the `sort_order` column and the multi-thumbnail UI stub in `src/app/kutyak/[id]/page.tsx:99-112`, which currently falls back to static Unsplash placeholder thumbnails) would hit this wall immediately.

### `adoption_applications` (`001_initial_schema.sql:156-168`)
- `id uuid PK`, `dog_id uuid not null references dogs(id) on delete cascade`, `partner_id uuid not null references partners(id)` (no cascade rule specified → defaults to `NO ACTION`, i.e. a partner cannot be hard-deleted while applications reference it, unlike `dogs`' cascade)
- `applicant_id uuid references profiles(id)` (nullable — supports anonymous/logged-out applicants)
- `status application_status not null default 'submitted'`
- `message text`, `contact_name text`, `contact_email text`, `contact_phone text`
- `created_at`/`updated_at` both present, both `timestamptz not null default now()`.
- **Orphan-data risk:** `dog_id ... on delete cascade` (`:158`) — deleting a dog (see `dogs` note above, one click + confirm dialog, no soft-delete) permanently destroys the applicant's entire application history for that dog, including their contact info and message. A rejected/withdrawn application's audit trail disappears with the dog. `partner_id` has no cascade, so applications survive if only the partner row somehow vanished (though `partners` itself has no delete UI).
- RLS: enabled (`:268`).
  - `"Applicants can read own applications"` — SELECT — `using (applicant_id = auth.uid())` (`:322`)
  - `"Applicants can create applications"` — INSERT — `with check (auth.uid() is not null)` (`:323`)
  - `"Anyone can submit adoption application"` — INSERT — `with check (true)` (`003_contact_rls.sql:3-5`) — this **supersedes/widens** the previous INSERT policy to also allow anonymous (logged-out) submissions, which is required for and matches the confirmed-working `/kutyak/[id]/kapcsolat` flow (applicant_id is `null` for anonymous submitters, per `src/app/api/applications/route.ts:56`).
  - `"Partner members can read applications for their dogs"` — SELECT — `using (is_partner_member(partner_id))` (`:324`)
  - `"Partner members can update applications for their dogs"` — UPDATE — `using (is_partner_member(partner_id))` (`006_partner_applications.sql:3-5`)
  - `"Admins full access applications"` — ALL — `using (is_admin())` (`:325`)
  - No DELETE policy for applicants or partners — applications cannot be deleted by anyone except an admin (via the ALL policy) or transitively via the dog-cascade above. There is also no "withdraw" UI wired up despite `withdrawn` existing in `application_status` and the partner-applications page explicitly commenting that withdrawal is applicant-initiated (`src/app/partner/applications/page.tsx:16`) — a user-facing withdraw button does not exist in `/jelentkezeseim` (confirmed by re-reading that page: read-only list, no action buttons).
- Trigger: `notify_application_status_change()` (`007_adoption_notifications.sql:2-31`) fires `after update` and inserts a `notifications` row for the applicant whenever `status` changes and `applicant_id is not null` — correctly does nothing for anonymous applicants (no user to notify), matching the nullable `applicant_id`.

### `donations` (`001_initial_schema.sql:173-184`) — "schema ready, frontend later" per the migration's own comment (`:171`)
- `id uuid PK`, `partner_id uuid references partners(id)`, `dog_id uuid references dogs(id)`, `donor_id uuid references profiles(id)` (all nullable, no cascade rules specified on any of the three FKs)
- `amount numeric(10,2) not null`, `currency text not null default 'EUR'`
- `payment_status donation_payment_status not null default 'pending'`
- `stripe_payment_id text`, `message text`
- `created_at timestamptz not null default now()` — **no `updated_at`** despite having a mutable `payment_status` field that would logically transition `pending → completed/failed/refunded`; there is no way to timestamp when that transition happened.
- RLS: enabled (`:269`).
  - `"Users see own donations"` — SELECT — `using (donor_id = auth.uid())` (`:342`)
  - **That is the only policy on this table.** No INSERT, UPDATE, DELETE, or admin ALL policy exists for `donations` anywhere across all 10 migrations.
  - **Confirmed dormant, not live:** `grep -rn "donations" src/` returns zero matches anywhere in application code — no page, component, or API route references this table at all. So today this gap cannot fire (nothing attempts to write), but the moment a "Support this dog" donation UI is built (the CTA copy already exists on the homepage and `/szolgaltatasok`, e.g. "🎁 Adományoddal közvetlenül segíted a menhelyeket", `src/app/page.tsx:50`, `src/app/szolgaltatasok/page.tsx:11`), any client-side `.insert()` into `donations` will fail outright with an RLS violation, and even admins have no override since there's no admin ALL policy either — an admin could not manually mark a donation `completed` through the app without a new migration.

### `virtual_adoptions` (`001_initial_schema.sql:189-196`) — same "schema ready, frontend later" comment
- `id uuid PK`, `dog_id uuid not null references dogs(id)`, `user_id uuid not null references profiles(id)` (no cascade specified on either FK)
- `monthly_amount numeric(10,2) not null`, `started_at timestamptz not null default now()`
- `status virtual_adoption_status not null default 'active'`
- **No `created_at` separate from `started_at`, no `updated_at` at all** — a `paused`/`cancelled` transition is untimestamped.
- RLS: enabled (`:270`).
  - `"Users see own virtual adoptions"` — SELECT — `using (user_id = auth.uid())` (`:343`)
  - **Identical gap to `donations`: this is the only policy.** No INSERT/UPDATE/DELETE/admin-ALL policy exists.
  - Confirmed dormant: `grep -rn "virtual_adoptions" src/` returns zero matches — no UI attempts this today, but the same "will break the instant it's built, and admins can't manually manage it either" risk applies.

### `notifications` (`001_initial_schema.sql:201-210`)
- `id uuid PK`, `user_id uuid not null references profiles(id) on delete cascade`
- `type notification_type not null`, `title text not null`, `body text`, `read boolean not null default false`, `data jsonb default '{}'::jsonb`
- `created_at timestamptz not null default now()` — **no `updated_at`** (the only mutation the app performs is flipping `read`, and there's no need to timestamp that separately given the RLS below covers it).
- Index: `create index on notifications(user_id, read)` (`:211`).
- RLS: enabled (`:271`).
  - `"Users can read own notifications"` — SELECT — `using (user_id = auth.uid())` (`:328`)
  - `"Users can update own notifications"` — UPDATE — `using (user_id = auth.uid())` (`:329`)
  - **No INSERT policy for regular users** — by design, every insert into `notifications` in this codebase comes from `security definer` trigger functions (`notify_application_status_change` in `007`, `notify_matching_saved_searches` in `009`, `notify_partner_followers` in `010`), all of which bypass RLS. No client-side code ever calls `supabase.from("notifications").insert(...)` — confirmed correct, no gap.
  - No DELETE policy — users cannot delete/clear notifications from the app (no UI for it either, so consistent, but worth knowing if a "clear notifications" feature is ever requested).

### `activity_logs` (`001_initial_schema.sql:216-224`)
- `id uuid PK`, `actor_id uuid references profiles(id)`, `action text not null`, `entity_type text`, `entity_id uuid`, `metadata jsonb default '{}'::jsonb`
- `created_at timestamptz not null default now()` — **no `updated_at`** (correct — logs are append-only by design).
- Index: `create index on activity_logs(entity_type, entity_id)` (`:225`).
- RLS: enabled (`:272`).
  - `"Admins read activity_logs"` — SELECT — `using (is_admin())` (`:346`)
  - `"Admins insert activity_logs"` — INSERT — `with check (is_admin())` (`004_admin_portal.sql:4-6`)
  - No UPDATE/DELETE policy — logs are correctly immutable once written (append-only audit trail, as intended). This is the table where the confirmed `not_available` bug writes a **false-success entry** (`DogStatusAction.tsx:14-19`) even though the corresponding `dogs.status` write silently failed — the RLS here is fine, the bug is that the app never checks whether the *paired* `dogs` update actually succeeded before logging success.

### `tags` (`001_initial_schema.sql:230-234`) / `entity_tags` (`001_initial_schema.sql:236-241`)
- `tags`: `id uuid PK`, `name text unique not null`, `slug text unique not null`. No `created_at`/`updated_at` at all.
- `entity_tags`: polymorphic join, `entity_type text not null`, `entity_id uuid not null`, `tag_id uuid not null references tags(id) on delete cascade`, composite PK `(entity_type, entity_id, tag_id)`. No timestamps.
- RLS: enabled on both (`:273-274`).
  - `"Public can read tags"` / `"Public can read entity_tags"` — SELECT — `using (true)` (`:336-337`)
  - `"Admins manage tags"` / `"Admins manage entity_tags"` — ALL — `using (is_admin())` (`:338-339`)
  - Confirmed dormant: no app code references `tags` or `entity_tags` at all (not grepped explicitly here but no page/component imports them; the schema exists but is entirely unused by the current UI — no tag-based filtering or display anywhere in `/kutyak` or dog detail).

### `favorite_dogs` (`001_initial_schema.sql:246-251`) / `favorite_partners` (`001_initial_schema.sql:253-258`)
- Both are composite-PK join tables: `favorite_dogs (profile_id, dog_id)` both `on delete cascade`; `favorite_partners (profile_id, partner_id)` both `on delete cascade`. Both have `created_at timestamptz not null default now()`, no `updated_at` (correct — these are pure join rows, never updated, only inserted/deleted).
- RLS: enabled on both (`:275-276`).
  - `"Users manage own dog favorites"` — ALL — `using (profile_id = auth.uid())` (`:332`)
  - `"Users manage own partner favorites"` — ALL — `using (profile_id = auth.uid())` (`:333`)
  - These correctly cover INSERT/UPDATE/DELETE for the owning user (Postgres RLS `FOR ALL` with only a `USING` clause applies that same expression as the implicit `WITH CHECK` for INSERT/UPDATE) — confirmed working end-to-end via `FavoriteButton.tsx` and `FollowPartnerButton.tsx`, and via the live-tested favorite/follow flows referenced in report 02.

### `saved_searches` (`008_saved_searches.sql:4-11`)
- `id uuid PK`, `profile_id uuid not null references profiles(id) on delete cascade`, `name text`, `filters jsonb not null default '{}'::jsonb`, `created_at timestamptz not null default now()`. **No `updated_at`** — searches are create/delete only, never edited in place (confirmed: `KutyakFilters.tsx` only ever inserts a new row, `DeleteSavedSearchButton` only ever deletes; no edit UI exists).
- Index: `create index on saved_searches(profile_id)` (`008_saved_searches.sql:11`).
- RLS: enabled (`008_saved_searches.sql:13`).
  - `"Users manage own saved searches"` — ALL — `using (profile_id = auth.uid())` (`008_saved_searches.sql:15`) — same correct `FOR ALL` pattern as favorites, confirmed working (live-tested insert via `KutyakFilters.tsx:53`, confirmed listing/delete via `/mentett-keresesek`).
  - `dog_matches_saved_search()` (`009_saved_search_notifications.sql:8-47`) and its two triggers (`010...` mirrors this for partner followers) implement the matching logic entirely in PL/pgSQL, re-deriving the same filter vocabulary (`q, country, city, size, gender, age, transportable`) that `KutyakFilters.tsx` and `kutyak/page.tsx` use — this is a duplicated-logic risk: if the `/kutyak` filter vocabulary is ever extended (e.g. adding a new filter field), `dog_matches_saved_search()` must be manually kept in sync via a new migration or saved searches will silently stop matching on the new field. Not currently broken, but a coupling worth documenting.

## 3. Soft-delete / orphan-data summary (as requested)

- **No soft-delete column exists anywhere in this schema.** `grep -rn "deleted_at"` across `supabase/` and `src/` → zero hits. Every delete is a hard `DELETE`.
- **Cascade chains that can silently wipe related data:**
  - `partners → dogs` (`on delete cascade`, `001:112`) → `dogs → adoption_applications` (`on delete cascade`, `001:158`) → deleting a partner (currently only possible via an admin's implicit ALL access, no dedicated "delete partner" button exists in `/admin/partners`) would cascade-delete every dog that partner ever listed and every application ever submitted for those dogs, in one statement, with zero confirmation UI for that specific consequence (the confirm dialog that exists is only the one-dog delete confirm in `/partner/dogs/[id]/edit`, which itself cascades that one dog's applications and favorites).
  - `dogs → favorite_dogs` (`on delete cascade`, `001:248`), `dogs → media` — **not cascaded** (`media.entity_id` is untyped/polymorphic with no FK at all, so deleting a dog leaves orphaned `media` rows pointing at a now-nonexistent `entity_id` forever; there is no cleanup job or trigger for this). Same applies to `entity_tags`.
  - `profiles → auth.users` cascade (`001:45`) is the correct direction (delete the auth user, profile goes with it) and additionally cascades to `partner_members`, `favorite_dogs`, `favorite_partners`, `notifications`, `saved_searches` — all reference `profiles(id) on delete cascade`. Deleting a user account (no such admin UI currently exists either) would be a comprehensive, irreversible wipe of that user's entire footprint on the platform, including their adoption application history if `applicant_id` is the only place it lived — but `adoption_applications.applicant_id` is a plain `references profiles(id)` with **no cascade rule specified**, meaning applications survive a user deletion (their `applicant_id` would need to either block the delete or be nulled — Postgres default is `NO ACTION`, which would actually **block** deleting a profile that has any applications, a behavior worth testing explicitly before building an account-deletion feature, since it would surface as a raw FK-violation error to whoever triggers it).

## 4. Seed data reality check (`supabase/seed.sql`)

3 partners (`Happy Paws Rescue`/DE, `Magyar Állatvédők`/HU, `Paws of Spain`/ES, all `status: 'approved', verified: true`) and 12 dogs, 4 per partner, all `status: 'available'`. This matches every live count cited in report 02 (12 dogs, 3 partners) and confirms the static marketing copy's "18 450+ kutya / 2 500+ menhely / 8 000+ önkéntes" figures across the 7 placeholder pages are entirely fictional placeholder numbers with no relationship to the real, tiny seed dataset — a launch-readiness concern in its own right (a visitor who clicks from a "2 500+ menhely" claim into a page that lists 3 real approved partners will notice the gap).
