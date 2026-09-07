# 09 — Dog Club (Subscription Membership) Readiness

Scope: pricing, checkout, recurring subscription, plan storage, active/inactive state, cancellation,
failed payment, grace period, membership benefits, partner discounts, entitlement check, protected
content/features, user account, billing history.

## 1. Repo-wide search for any trace of "Dog Club"

Case-insensitive grep, `src/`, `supabase/`, and page copy, this session:

```
grep -rni "club" src supabase          -> 0 hits
grep -rni "subscription" src supabase  -> 0 hits
grep -rni "membership\|tagság" src     -> 0 hits
grep -rni "plan\b" src (excluding "planner"/"tervez") -> checked manually, no pricing-plan concept
grep -rni "billing\|számlázás" src     -> 0 hits
grep -rni "entitlement\|jogosultság" src -> 0 hits
```

No table, enum, column, route, component, or piece of marketing copy anywhere in the repository uses
the word "club," "subscription," "membership," or "tagság." This was cross-checked against every page
that could plausibly mention it: `/szolgaltatasok` (services), `/rolunk` (about), `/profil` (account),
`/partner/*` (partner portal), `/menhelyek`, `/partners/[slug]` — none contain it.

## 2. Item-by-item

| Item | Evidence | Status |
|---|---|---|
| Pricing | No pricing table/page/component anywhere for a club or membership product. `grep -rni "Ft/hó\|€/hó\|/month\|havidíj" src` = 0 hits | **NOT_FOUND** |
| Checkout | No payment SDK exists at all (see report 07 §0 — `package.json` has no Stripe/PayPal/etc.), and no checkout route/component exists | **NOT_FOUND** |
| Recurring subscription | No `subscriptions` table in any of the 10 migrations (full table list from `001_initial_schema.sql`: `profiles, partners, partner_members, dogs, media, adoption_applications, donations, virtual_adoptions, notifications, activity_logs, tags, entity_tags, favorite_dogs, favorite_partners`; migrations 002-010 add partner-portal, admin, storage, partner-applications, and notification tables only — none named subscription/club/membership) | **NOT_FOUND** |
| Plan storage | No `plan`, `tier`, or `membership_level` column exists on `profiles` (full column list: `id, full_name, avatar_url, role, created_at, updated_at` — `role` is only `'user'|'partner'|'admin'`, an access-role flag, not a paid tier) | **NOT_FOUND** |
| Active/inactive state | No membership-status field exists anywhere to be active/inactive | **NOT_FOUND** |
| Cancellation | N/A — nothing to cancel | **NOT_FOUND** |
| Failed payment | N/A — no payment attempt is possible in the first place | **NOT_FOUND** |
| Grace period | N/A | **NOT_FOUND** |
| Membership benefits | No benefits copy, no discount schedule, no perks list found anywhere (`grep -rni "kedvezmény.*tag\|tagsági" src` = 0 hits) | **NOT_FOUND** |
| Partner discounts | `partners` table and partner-facing pages have no discount/pricing field tied to a club (`partners` columns: `id, name, slug, type, status, verified, description, country, city, address, phone, email, website, logo_url, cover_url, metadata, created_at, updated_at` — `metadata` is a free-form `jsonb` catch-all but nothing in application code reads/writes a discount key from it, confirmed by `grep -rn "metadata\." src` = 0 hits) | **NOT_FOUND** |
| Entitlement check | No auth/route-guard logic anywhere checks a subscription/club flag before rendering content (existing route guards, e.g. `src/app/profil/page.tsx:10` `if (!user) redirect(...)`, gate only on being logged in, never on a paid tier) | **NOT_FOUND** |
| Protected content/features | No content or feature in the app is gated behind anything other than plain authentication (logged in vs. not) or role (`user`/`partner`/`admin`) — there is no third axis for "paying club member" | **NOT_FOUND** |
| User account (club-aware) | `/profil` exists (`src/app/profil/page.tsx`) but only edits `full_name`; no club-membership section, no upgrade CTA, no plan badge | **NOT_FOUND** (account exists, but zero club-awareness) |
| Billing history | No `invoices`/`billing_history`/`payments` table exists in any migration; no page renders billing history | **NOT_FOUND** |

## 3. Verdict: NOT_FOUND vs. PLACEHOLDER

This is the important distinction the audit asked to settle precisely: **Dog Club is NOT_FOUND, full
stop — it does not exist in this codebase at any level, not even as a stub.**

This is a stronger (more absent) finding than the donation/virtual-adoption features audited in
reports 07 and 08. Those have at least a *schema stub* (`donations`, `virtual_adoptions` tables exist,
with the migration comment `-- schema ready, frontend later`) even though they're unreachable. Dog
Club has:

- no database table,
- no database column on any existing table,
- no route or page fragment,
- no component,
- no marketing copy string anywhere (not "coming soon," not a teaser, not a grayed-out nav item),
- no mention in any of the 10 SQL migrations,
- no mention in any of the ~30 route directories under `src/app`.

Every other feature audited across reports 07–10 has *something* on disk to point to (a table, a
static page, an enum value). Dog Club has literally nothing. If a Dog Club concept exists in product
planning documents outside this repository, it has not yet been started in code in any form.

`NOT VERIFIED: whether "Dog Club" is referenced in any external product spec, Figma file, or planning
doc outside this git working tree — out of scope for a code audit.`
