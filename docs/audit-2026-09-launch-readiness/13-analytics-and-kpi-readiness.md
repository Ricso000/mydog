# 13 — Analytics & KPI Readiness

Scope: every KPI category named in the audit spec (Supply, Marketplace, Revenue, Network). For each
metric: does the underlying data exist and get written by real app code today, such that the metric
is computable right now via an ad-hoc SQL query or the existing admin dashboard — or is the data
simply not captured anywhere? Method: full read of `package.json`, all 12 migrations in
`supabase/migrations/`, every admin-dashboard route, and repo-wide greps for write-paths on the
relevant columns. Repo: `/Users/bankirichard/Developer/MyDog projekt/rescueconnect`. No live DB
queries were run; no server was started. Read-only, code-only audit.

## 0. Baseline: is there an analytics/product-metrics tool at all?

`package.json` (read in full) dependencies: `@base-ui/react, @supabase/ssr, @supabase/supabase-js,
class-variance-authority, clsx, lucide-react, next, react, react-dom, resend, shadcn, tailwind-merge,
tw-animate-css`. devDependencies: `@tailwindcss/postcss, @types/node, @types/react, @types/react-dom,
eslint, eslint-config-next, tailwindcss, typescript`.

There is **no** PostHog, Segment, Google Analytics, Mixpanel, Amplitude, Plausible, or
`@vercel/analytics` package anywhere in dependencies or devDependencies. Corroborating grep:

```
grep -rni "posthog|segment|mixpanel|amplitude|plausible|google-analytics|gtag|vercel/analytics" src package.json
→ 0 hits
```

**Status: NOT_FOUND** — there is no event-tracking / product-analytics layer in this codebase at any
level (no client-side SDK, no server-side event log table distinct from `activity_logs`, no
`.env` key for an analytics write key). Every KPI below must therefore be computed either (a) directly
against Postgres tables with raw SQL / the Supabase dashboard, or (b) through bespoke `count()`
queries embedded in admin pages — there is no dashboarding product wired up.

## 1. What already works today: the admin dashboard as a de facto (partial) KPI tool

`src/app/admin/dashboard/page.tsx` (read in full) runs seven live `count()` queries in parallel against
Postgres and renders them as stat tiles — this is real, working, computed-on-every-request code, not a
mockup:

```ts
supabase.from("partners").select("*", { count: "exact", head: true }),                                    // totalPartners
supabase.from("partners").select("*", { count: "exact", head: true }).eq("status", "pending_review"),     // pendingPartners
supabase.from("partners").select("*", { count: "exact", head: true }).eq("status", "approved"),           // approvedPartners
supabase.from("dogs").select("*", { count: "exact", head: true }),                                        // totalDogs
supabase.from("dogs").select("*", { count: "exact", head: true }).eq("status", "available"),               // availableDogs
supabase.from("adoption_applications").select("*", { count: "exact", head: true }).eq("status", "submitted"), // pendingApplications
supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", <now-30d>),        // newUsers
```

This session's own live test of `/admin/dashboard` returned real numbers: **"3 Összes partner, 12
Összes kutya, 5 Nyitott kérelem, 2 Új felhasználó (30 nap)"** — confirming this isn't dead code, it is
the one piece of genuine, working KPI reporting that ships today. It covers 4 of the ~15 metrics in
the spec (partner count, dog count, open-application count, new-signup count) and nothing else —
no time series, no week-over-week deltas, no conversion rates, no revenue.

`src/app/admin/partners/page.tsx:29` also surfaces `verified` per-partner (`{p.verified && "✓
Ellenőrzött"}`), and `src/components/admin/PartnerActions.tsx:40-50` (`toggleVerified`) is the write
path — an admin can flip `partners.verified` and it persists and displays immediately. This is a real,
working, admin-facing boolean, independent of `partners.status`.

## 2. KPI-by-KPI ledger

### Supply

| Metric | Data source | Write path exists? | Computable today? | Status |
|---|---|---|---|---|
| Verified shelters | `partners.verified` (boolean, `supabase/migrations/001_initial_schema.sql:80`) | Yes — `src/components/admin/PartnerActions.tsx:40-50` toggles it via admin UI | `select count(*) from partners where verified = true` — direct SQL, and the count itself is displayed per-row in `/admin/partners` today (not yet aggregated into a single tile) | **WORKING** (data captured, aggregate tile not built but trivial) |
| Active dogs (available) | `dogs.status = 'available'` | Yes — set on create (default) and via partner edit form `src/app/partner/dogs/[id]/edit/page.tsx:116` | Already an admin-dashboard tile (`availableDogs`, `src/app/admin/dashboard/page.tsx:21`) and homepage stat (`src/app/page.tsx:65`) | **WORKING** |
| Service partners (non-shelter partner types, e.g. vet/groomer/transport) | `partners.type` enum (`create type partner_type as enum (...)`, `supabase/migrations/001_initial_schema.sql:4`) | Yes — set at partner registration (`src/app/partner/register/page.tsx`) | `select type, count(*) from partners group by type` — trivial SQL; no UI breakdown by type exists yet (dashboard only shows a single partner total) | **PARTIAL** (data captured and typed, no breakdown UI) |

### Marketplace

| Metric | Data source | Write path exists? | Computable today? | Status |
|---|---|---|---|---|
| Applications / week | `adoption_applications.created_at` | Yes — every submission via `src/app/api/applications/route.ts:53-62` inserts a row with `created_at` default `now()` | `select date_trunc('week', created_at), count(*) from adoption_applications group by 1` — directly computable via SQL today; no chart/tile exists in the app | **WORKING** (data fully captured; only the aggregation UI is missing) |
| Successful adoptions | Ambiguous — see §3 below. Two candidate signals exist and they are **not linked**: (a) `adoption_applications.status = 'approved'`, (b) `dogs.status = 'adopted'` | (a) yes, via `src/app/partner/applications/page.tsx:64-75` `changeStatus()`. (b) yes, via `src/app/partner/dogs/[id]/edit/page.tsx` status dropdown (`STATUSES` includes `{ value: "adopted", label: "Örökbefogadott" }`, line 18) and `src/components/admin/DogStatusAction.tsx` (only toggles `available`/`not_available`, cannot set `adopted`) | `select count(*) from dogs where status = 'adopted'` is a real, running query today — `src/app/page.tsx:68` already selects `adoptedCount` for the homepage stat block. But it counts a manually-set dog flag, **not** a verified adoption event tied to an approved application | **PARTIAL** — see §3 for why this is a soft metric, not a hard one |
| Application → adoption conversion rate | Would require joining "applications approved" to "dogs marked adopted," per applicant/dog | **No such link exists.** `adoption_applications` has no `resulted_in_adoption` flag and no FK/trigger connects an approved application to the corresponding `dogs.status` flip. A partner can approve an application without ever touching the dog's status, and can mark a dog `adopted` without any application ever existing or being approved | Only computable as two **disconnected** counts (`applications where status='approved'` vs. `dogs where status='adopted'`), which is not a true conversion funnel — no shared key ties one to the other | **BROKEN** (as a rate; the two inputs exist but the relationship needed to compute a rate does not) |
| Time-to-adoption | `created_at` → some "adopted" timestamp, per dog/application | `adoption_applications` has `created_at`/`updated_at` (`supabase/migrations/001_initial_schema.sql:156-168`) but **no `decided_at`/`completed_at` column** — `updated_at` moves on *any* field edit, not specifically on approval. `dogs` has `created_at`/`updated_at` only, **no `adopted_at` column** | Only a rough proxy is possible (`adoption_applications.updated_at - created_at` for rows where `status='approved'`, assuming no other edits happened after approval — not a safe assumption) | **NOT_FOUND** (no dedicated timestamp exists to measure this cleanly) |

### Revenue

| Metric | Data source | Write path exists? | Computable today? | Status |
|---|---|---|---|---|
| Club MRR | No `subscriptions`/`club_members` table in any of the 12 migrations (cross-referenced with report 09, which confirms **zero** trace of "club"/"subscription"/"membership" anywhere in `src` or `supabase`) | No | No | **NOT_FOUND** |
| Club conversion rate | Same — no Club exists | No | No | **NOT_FOUND** |
| Club churn | Same | No | No | **NOT_FOUND** |
| Recurring donors | `donations` table exists (`supabase/migrations/001_initial_schema.sql:173-188`, includes `donation_payment_status` enum) but per report 07, `grep -rn "donation" src --include="*.tsx" --include="*.ts"` → **0 matches** — no route, page, or component ever inserts a row. There is also no `is_recurring`/`recurring_donation_id` column to distinguish a recurring donor from a one-off even if rows existed | Schema stub only, zero live writes | **NOT_FOUND** (schema exists, "ready, frontend later" per the migration's own comment — but frontend never arrived, so no data is ever produced to query) |
| Donation volume | `donations.amount`-shaped columns exist in schema | Same as above — 0 writes anywhere in application code | `select sum(amount) from donations` would return `0`/`null` forever under current usage, not a real gap in the query but in the data | **NOT_FOUND** (table would always be empty) |

### Network

| Metric | Data source | Write path exists? | Computable today? | Status |
|---|---|---|---|---|
| Active users | No session/last-activity table in app-facing schema. `auth.users.last_sign_in_at` exists in Supabase's own auth schema but is **never read by any application code** (`grep -rni "last_sign_in\|last_login\|dau\|mau\|active_user" src` → 0 hits) | Supabase manages `last_sign_in_at` internally; app never queries it | Only reachable via direct Postgres/service-role access to `auth.users`, bypassing the app entirely — not exposed through any existing route or admin page | **BLOCKED** (data likely exists at the Supabase-auth layer, but is not surfaced or queryable through anything this app currently does — would need a new service-role query, not just a new UI) |
| Returning users | Would need session/visit tracking distinct from `created_at` | `activity_logs` table (`supabase/migrations/001_initial_schema.sql:216-224`) is the only per-user activity ledger in the schema, but grep confirms it is written **only** by three admin actions: `src/components/admin/DogStatusAction.tsx:14`, `src/components/admin/PartnerActions.tsx:28,44` (partner-verify/approve actions) — it is an admin audit log, not a general user-activity/session tracker. No page view, login, or "user did X" event is logged for ordinary end users | Not computable — no returning-visit signal is captured for regular users at all | **NOT_FOUND** |
| Partner referrals | No referral/attribution concept anywhere (`grep -rni "referr" src` → 0 hits; no `referred_by`/`utm_source`/`invite_code` column on `partners` or `profiles`) | No | No | **NOT_FOUND** |

## 3. Deep dive: why "successful adoptions" and "conversion rate" are soft, not hard, numbers

The spec's most important marketplace KPI — application → adoption conversion — requires a defined,
authoritative "adoption completed" event. This audit checked precisely what exists:

- **`adoption_applications.status`** is a 5-value enum: `submitted, reviewing, approved, rejected,
  withdrawn` (`create type application_status as enum (...)`, `supabase/migrations/001_initial_schema.sql:26-29`,
  labels confirmed in `src/app/partner/applications/page.tsx` and `src/app/jelentkezeseim/page.tsx`).
  `approved` is the closest thing to "the shelter said yes," but it is set by a partner clicking a
  dropdown (`src/app/partner/applications/page.tsx:64-75`, `changeStatus()`) — nothing forces or even
  suggests a follow-up action on the dog record.
- **`dogs.status`** is an 8-value enum (`available, reserved, pending, foster, adopted, medical,
  inactive, deceased`; `create type dog_status as enum (...)`, `supabase/migrations/001_initial_schema.sql:19-23`).
  It **is** writable to `'adopted'` in real app code — confirmed at
  `src/app/partner/dogs/[id]/edit/page.tsx:15-19` (`STATUSES` array includes
  `{ value: "adopted", label: "Örökbefogadott" }`) and the form's submit handler
  (`src/app/partner/dogs/[id]/edit/page.tsx:116`, `status: form.status`) persists it via
  `supabase.from("dogs").update(...)`. So `dogs.status='adopted'` is a **real, reachable, manually-set
  state** — this corrects an initial hypothesis that it might be unreachable; it is reachable, just
  entirely manual. It is also read live today: `src/app/page.tsx:68` (homepage "kutyát fogadtunk örökbe"
  stat) and `src/app/admin/dogs/page.tsx:44` (admin filter chip).
- **The two are entirely decoupled.** Confirmed by reading every migration that touches
  `adoption_applications` (`grep -rn "update dogs\|status.*=.*'adopted'" supabase/migrations/*.sql` →
  0 hits) — no trigger, function, or app-code path sets `dogs.status='adopted'` as a side effect of
  approving an application, and no application record stores which dog-status change (if any)
  resulted from it. A partner can mark a dog `adopted` having never received or approved a formal
  application (e.g. an offline adoption), and can approve an application while leaving the dog's
  status at `available` indefinitely (there is no reminder, no cron, no constraint).

**Conclusion:** "successful adoptions" *can* be approximated today by `count(dogs where
status='adopted')`, and this number is already live on the homepage — but it measures a manual
housekeeping flag, not a verified, application-linked adoption completion event. A true
application→adoption conversion rate is **not computable** without either (a) a new column linking
`adoption_applications` to the dog-status transition it caused, or (b) a product decision to treat
"partner sets dog to adopted" as the sole adoption-completion signal and accept that it can happen with
or without a formal application on file.

## 4. Verdict summary

| Category | Computable now via SQL | Has any admin-UI tile today | Fundamentally missing data |
|---|---|---|---|
| Supply (verified shelters, active dogs, service partners) | Yes, all three | Partial (dog/partner totals only, no verified-count tile, no type breakdown) | None — data fully captured |
| Marketplace (applications/week, adoptions, conversion, time-to-adoption) | Applications/week: yes. Adoptions (soft): yes. Conversion: no (no link). Time-to-adoption: no (no timestamp) | Only "open applications" count exists as a tile | Adoption-completion event linked to its application; dedicated timestamp columns |
| Revenue (Club MRR/conversion/churn, recurring donors, donation volume) | No — all NOT_FOUND | None | Entire Club and donation feature set (confirmed absent by reports 07 and 09) |
| Network (active users, returning users, partner referrals) | No | None | Session/activity tracking for ordinary users; no analytics SDK of any kind |

`NOT VERIFIED: whether product/BI tooling outside this repository (e.g. a Supabase-native dashboard,
a spreadsheet fed by manual exports, or an external BI connection to the Postgres instance) already
covers any of the NOT_FOUND items above — out of scope for a code-only audit.`
