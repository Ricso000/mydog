# 12 — Security and Permissions Audit

Audit date: 2026-09-06. Method: read-only source review of the entire auth/RLS/upload/email/API surface, all 10 Supabase migrations read in full, `npm audit` run (no `--fix`/`--force` applied), targeted greps for secrets/rate-limiting/raw-SQL. This report was produced by a dedicated audit pass that reasoned about finding #1 from the policy SQL alone (correctly, without live-exploiting it). **Post-report addendum (same audit day, by the coordinating session):** finding #1 was subsequently reproduced live against a fresh throwaway account (confirming the report's reasoning was correct) and then fixed, with the fix verified by a full negative/positive test suite. A structurally identical second CRITICAL issue — self-service partner approval/verification — was found by the same live-testing pass (this report's automated grep-based methodology did not surface it, since it required exercising the actual `partners` UPDATE policy rather than reading it in isolation) and was likewise reproduced, fixed, and verified. Both are detailed in finding #1 and new finding #1b below, with fix status now reflected. No other findings in this report were affected.

---

## Severity summary table

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | `profiles` self-service role escalation to `admin` (no column-level restriction on `UPDATE profiles`) | **CRITICAL** | **FOUND AND REMEDIATED** — live-reproduced, fixed via `supabase/migrations/011_fix_role_privilege_escalation.sql` (BEFORE UPDATE trigger gated on `is_admin()`), fix verified with a 5-case negative/positive test suite (self-escalation blocked, cross-user escalation blocked, anonymous blocked, legitimate self-edit still works, legitimate admin-grant still works) |
| 1b | `partners` self-service approval (`status`) and self-verification (`verified`) — same root cause as #1, on a different table | **CRITICAL** | **FOUND AND REMEDIATED** (found during live follow-up testing after this report was written; not caught by this report's own methodology — see addendum above and detail below). Fixed via `supabase/migrations/012_fix_partner_approval_escalation.sql`, verified with a 4-case test suite (self-approve blocked, self-verify blocked, legitimate field edits still work, legitimate admin-approval still works) |
| 2 | No password-reset ("forgot password") flow anywhere in the app | HIGH | CONFIRMED |
| 3 | No rate limiting / bot throttling on any endpoint (signup, login, public application form) | HIGH | CONFIRMED |
| 4 | Supabase auto-confirms email on signup — no email verification gate | HIGH | CONFIRMED (per task brief; consistent with code — no confirmation-flow code exists) |
| 5 | `npm audit`: Next.js high-severity advisories (middleware/proxy bypass, SSRF, DoS, unauthenticated Server Function disclosure) on the pinned `next@16.2.10` | HIGH | CONFIRMED |
| 6 | Admin-area route protection in `proxy.ts` only checks "is logged in," not "is admin" — relies entirely on page-level `requireAdmin()` | MEDIUM | CONFIRMED, but mitigated (see detail) |
| 7 | `media` table publicly readable regardless of parent partner/dog approval status | LOW–MEDIUM | CONFIRMED, likely low real-world impact (table appears unused by app code) |
| 8 | No OAuth (Google, etc.) — not a vulnerability, just absent as expected | INFORMATIONAL | CONFIRMED absent |
| 9 | `npm audit`: `postcss`, `sharp`, `qs`, `undici` transitive vulnerabilities | MEDIUM | CONFIRMED |
| 10 | CSRF exposure on `/api/applications` | LOW | Assessed, low risk |
| 11 | XSS via email HTML interpolation | — | Reviewed, **no issue found** (`esc()` applied consistently) |
| 12 | SQL injection | — | Reviewed, **no issue found** (no raw SQL/`.rpc()` anywhere) |
| 13 | Secrets in gitignore / service_role in client bundle | — | Reviewed, **no issue found** |
| 14 | File upload MIME/size/bucket scoping | — | Reviewed, **correctly enforced** |
| 15 | Partner/dog/application cross-tenant IDOR | — | Reviewed, **correctly scoped**, no IDOR found |

---

## 1. CRITICAL — `profiles.role` self-service escalation to admin

**This is the most important finding in this report.**

### The exact policy text

`supabase/migrations/001_initial_schema.sql:297`:
```sql
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
```

`supabase/migrations/004_admin_portal.sql:9-11` adds a second, admin-only update policy but does **not** restrict or narrow the one above:
```sql
create policy "Admins update all profiles"
  on profiles for update
  using (is_admin());
```

No other migration (checked all 10 files) adds a `with check` clause to either policy, a `BEFORE UPDATE` trigger on `profiles`, a column-level `REVOKE`, or any other gate on the `role` column. `grep -n "role\|trigger\|grant\|revoke" supabase/migrations/*.sql` (full output reviewed) shows the only trigger touching `profiles` is `handle_new_user()` (001:54-69), which fires on *insert into `auth.users`*, not on update, and is irrelevant here.

### Why this is exploitable

Postgres RLS semantics: **for an `UPDATE` policy, if no `WITH CHECK` expression is given, the `USING` expression is reused as the `WITH CHECK` expression** (this is documented Postgres behavior, not a guess). So the effective check for the "Users can update own profile" policy is:
- Row-visibility (`USING`): `auth.uid() = id` — true for the caller's own row.
- New-row check (`WITH CHECK`, reused): `auth.uid() = id` — still true, because `id` (primary key, references `auth.users`) is never changed by the update.

Crucially, **RLS `USING`/`WITH CHECK` clauses in Postgres constrain which *rows* can be touched, never which *columns* can be changed.** There is no column-level grant restricting `UPDATE` on `role` to a subset of columns — Supabase's default is a table-level `GRANT UPDATE ON profiles TO authenticated`, and nothing in these migrations narrows that to specific columns.

The application layer provides no additional gate either:
- `src/lib/supabase/client.ts` — a plain `createBrowserClient` using only the public anon key; any code running in the browser can call `.from('profiles').update(...)` directly.
- `src/app/profil/page.tsx` (profile edit UI) was not seen to expose a `role` field in its own form, but **that is irrelevant** — the Supabase JS client is a general-purpose, unauthenticated-by-schema REST/RPC client. A user does not need the app's own UI to make this call; they can do it directly via `supabase.auth.getSession()` + `supabase.from('profiles').update({role:'admin'}).eq('id', <their own uid>))` from the browser console, or via any HTTP client using the public anon key + their own logged-in JWT (both trivially available to any registered user from browser devtools/localStorage).

### The exact attack path (traced through the code, not executed)

1. Attacker registers a normal account via `src/app/regisztracio/page.tsx` (`supabase.auth.signUp`) — per this session's earlier live verification, Supabase auto-confirms the email, so the attacker has an active session immediately.
2. From the browser console (or any script using the public `NEXT_PUBLIC_SUPABASE_ANON_KEY` + the attacker's own valid session JWT), the attacker calls:
   ```js
   supabase.from('profiles').update({ role: 'admin' }).eq('id', myOwnUserId)
   ```
3. RLS evaluates `"Users can update own profile"`: `USING (auth.uid() = id)` → true (it's their own row) → the reused `WITH CHECK` → also true (id unchanged). The update is **permitted**, and `role` becomes `'admin'` in the `profiles` table for that user.
4. `src/lib/admin.ts` (`requireAdmin()`, lines 9-13) does a **fresh, un-cached** query on every admin-gated page load:
   ```ts
   const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
   if (profile?.role !== "admin") redirect("/admin/login?error=unauthorized");
   ```
   This query is itself gated by RLS policy `"Users can read own profile" using (auth.uid() = id)` (001:296), which permits the user to read their own (now-escalated) row. The query returns `role: 'admin'` truthfully — because the row genuinely now says so — and `requireAdmin()` grants access.
5. The attacker now passes every `requireAdmin()` gate in the app (`src/app/admin/dashboard/page.tsx`, `admin/dogs`, `admin/partners`, `admin/partners/[id]`, `admin/users`, `admin/applications`, `admin/activity` — all confirmed via `grep -l requireAdmin` to import and call it) and additionally satisfies the `is_admin()` SQL helper (001:279-284, `select 1 from profiles where id = auth.uid() and role = 'admin'`) used throughout the RLS policies for `partners`, `dogs`, `partner_members`, `media`, `adoption_applications`, `tags`, `activity_logs`, and the storage bucket policies. This means the escalation doesn't just unlock the admin UI — it unlocks **every RLS policy in the schema that gates on `is_admin()`**, i.e., full read/write access to all partners (including non-approved ones), all dogs, all partner memberships, all adoption applications, and all activity logs, plus admin-only storage upload/overwrite rights on the `dog-images` bucket.

### Why `requireAdmin()`'s "fresh query, not JWT claim" design does *not* mitigate this

The brief's premise — that checking `profiles.role` via a fresh DB query (rather than a JWT custom claim) avoids "stale-token privilege issues" — is correct as far as it goes: it means an admin who gets demoted loses access on their very next request, rather than continuing to work until token expiry. But that only protects the *demotion* direction. It provides **zero** protection for the *escalation* direction demonstrated above, because the fresh query faithfully reflects whatever the (attacker-writable) `role` column currently contains. The "freshness" property is orthogonal to this vulnerability.

### Verdict

**CONFIRMED CRITICAL — and subsequently live-reproduced and fixed (post-report addendum).** Any registered user could grant themselves the `admin` role via a single unauthenticated-by-schema Supabase client call, with zero server-side gatekeeping, because the `profiles` UPDATE RLS policy restricts *rows* (own row only) but not *columns* (any column, including `role`, can be changed on that row).

**Live reproduction (after this report was written):** a fresh throwaway account was registered, and from only its own anon-key + own session JWT, `PATCH /rest/v1/profiles {"role":"admin"}` against its own row succeeded (HTTP 200, ground-truth-confirmed via a separate service-role read that `role` had actually become `'admin'`). This confirms the report's policy-text reasoning was exactly correct, not just theoretically exploitable.

**Fix applied:** `supabase/migrations/011_fix_role_privilege_escalation.sql` — a `BEFORE UPDATE` trigger (`prevent_unauthorized_role_change()`) that raises `insufficient_privilege` (Postgres errcode `42501`) if `NEW.role IS DISTINCT FROM OLD.role` and the caller is not `is_admin()`. This is exactly the "more robust" option the original recommendation named (a `BEFORE UPDATE` trigger rather than a self-referential `WITH CHECK` subquery, which is more fragile under RLS). Applied directly to the production database via `supabase db query --linked` (no destructive command used).

**Fix verified** with a 5-case test suite against real accounts (all throwaway test users deleted afterward):
1. A normal user attempting to set their own `role` to `admin` → **rejected**, HTTP 403, exact trigger error message returned.
2. That same user attempting to set a *different* user's `role` to `admin` → **rejected** (0 rows matched — RLS row-scoping alone already prevented this, independent of the new trigger).
3. That user updating their own `full_name` (an allowed field) → **succeeded**, confirming the fix does not break legitimate self-service profile edits.
4. A request with no user token at all (anon key only) attempting the same escalation → **rejected** (0 rows matched).
5. A real admin account granting a different user's `role` to `admin` (the legitimate admin workflow, via the `"Admins update all profiles"` policy from `004_admin_portal.sql`) → **succeeded**, confirming admin role-management functionality still works post-fix.

**Status: FOUND AND REMEDIATED**, both live-verified.

---

## 1b. CRITICAL (found in live follow-up testing) — `partners` self-service approval and self-verification

This finding has the **identical shape and root cause as finding #1**, on a different table, and was found by exercising the actual UPDATE policy live rather than by grep/read-only analysis — which is why it wasn't caught by this report's own methodology. It is documented here for completeness since it belongs in the same class of issue this report is about.

### The exact policy text

`supabase/migrations/001_initial_schema.sql:303`:
```sql
create policy "Members can update own partner" on partners for update using (is_partner_member(id));
```

Same Postgres RLS mechanics as finding #1: no `with check` is specified, so the `USING` expression is reused as `WITH CHECK`. `is_partner_member(id)` only checks that the caller belongs to *some* row in `partner_members` for this partner `id` — critically, it does not check the member's `role` column (`owner`/`manager`/`editor`/`viewer` — see report 05 §6, which independently found that `partner_member_role` is stored but never actually checked anywhere), so even the lowest-privilege membership tier can update **any** column on the partner row, including `status` and `verified`.

### Why this matters more than a generic "can edit own org profile" concern

`partners.status = 'approved'` and `partners.verified = true` are the two fields the entire platform's trust model depends on: the public dog-listing RLS policy (`"Public can read dogs of approved partners"`, `001:312-313`) gates on `status = 'approved'`, and the "✓ Ellenőrzött" badge shown to adopters (`src/app/admin/partners/page.tsx:29` et al.) is driven directly by `verified`. Both are supposed to be admin-gated per the intended moderation workflow (confirmed in report 05: `/partner/dashboard` explicitly tells a `draft`-status partner "A partner profil jóváhagyásra vár... A feltöltött kutyák csak az admin jóváhagyása után jelennek meg a publikus keresőben").

### Live reproduction

A brand-new partner was registered through the real `/partner/register` flow (landing at `status: 'draft'`, `verified: false`, exactly as intended). From that same account's own session (no elevated access), a direct `PATCH /rest/v1/partners {"status":"approved","verified":true}` against its own partner id succeeded — HTTP 204, ground-truth-confirmed via a separate service-role read that both fields had actually flipped. This means any self-registered shelter could, within seconds of signing up, appear fully approved and "verified" to the public — including making its listed dogs immediately visible on `/kutyak` — with zero admin review.

### Fix applied and verified

`supabase/migrations/012_fix_partner_approval_escalation.sql` — the same `BEFORE UPDATE` trigger pattern as finding #1, blocking any change to `status` or `verified` unless `is_admin()`. Verified with a 4-case test suite: (1) self-approve rejected (403), (2) self-verify rejected (403), (3) a legitimate field edit (description/phone/city) by the same partner member still succeeds, (4) a legitimate admin approval+verification still succeeds and ground-truth-confirms.

**Status: FOUND AND REMEDIATED**, both live-verified. See report 05 for the full partner-flow context this was found within.

### A note on scope for whoever continues this audit

Both confirmed escalations share one root cause (an `UPDATE` RLS policy with no `WITH CHECK` narrowing which columns may change) on two different tables. The same *pattern* should be checked against every other table with a self-service UPDATE policy before considering this class of bug closed platform-wide. This report's own §8 IDOR review already checked `dogs`, `adoption_applications`, `notifications`, and the storage bucket policies for the *row-scoping* direction (whether you can touch someone else's row) and found those correctly scoped — but did not separately check the *column-scoping* direction (whether, on your *own* row, you can write to a field that should be admin-only) for tables other than `profiles`. Candidates worth a follow-up pass, in priority order: none of the currently-shipped self-service UPDATE policies touch another obviously privilege-bearing column beyond the two now fixed (`partner_members.role` has no self-service UPDATE policy at all — see report 05 §6 and report 03, it's admin-only or trigger-only — so it is not exposed to this pattern today), but this should be re-verified rather than assumed for any new column added to `partners`/`profiles`/`dogs` going forward, and re-verified explicitly if `partner_members` ever gains a self-service UPDATE policy (e.g. for a future "invite teammates" feature).

---

## 2. HIGH — No password-reset flow

`grep -rn "resetPasswordForEmail\|forgot\|elfelejtett" src/` → **zero matches**. Neither `src/app/bejelentkezes/page.tsx` (login) nor `src/app/regisztracio/page.tsx` (registration) contains a "forgot password" link, and no route/page calls Supabase's `resetPasswordForEmail`. A user who forgets their password has no self-service recovery path. **NOT_FOUND, confirmed.** Given this is about to accept public traffic, this is a real launch blocker for user support load, not just a security nicety — flagged HIGH primarily for user-lockout/support-burden risk rather than a direct exploit.

## 3. HIGH — No rate limiting anywhere

`grep -rniE "rate.?limit|ratelimit|throttle" src/ package.json` → **zero matches**. No middleware, no per-route counters, no dependency (e.g. `@upstash/ratelimit`, `express-rate-limit`) is present. This means, with no mitigating control found anywhere in the codebase:
- `src/app/regisztracio/page.tsx` — unlimited account creation attempts (`supabase.auth.signUp`) from a single IP/script.
- `src/app/bejelentkezes/page.tsx` — unlimited password-guessing attempts (`supabase.auth.signInWithPassword`); Supabase's own backend may apply some default throttling at the GoTrue level, but nothing in this app's code does, and that Supabase-side default was not verified in this audit (NOT_VERIFIED: Supabase project-level GoTrue rate-limit configuration is outside the source tree).
- `src/app/api/applications/route.ts` — a fully public, unauthenticated POST endpoint (works for logged-out visitors per migration `003_contact_rls.sql`'s `with check (true)` insert policy) that inserts into `adoption_applications` and triggers two outbound emails (`sendApplicationConfirmationToApplicant`, `sendApplicationReceivedToPartner`) per call, with no throttle. A scripted attacker could spam this endpoint to (a) flood a partner's inbox, (b) flood arbitrary third-party inboxes by supplying their address as `email` (since the "applicant confirmation" email is sent to whatever `email` the requester supplies, not to an address the requester has proven ownership of) — this is effectively an open outbound-email-spam relay against the Resend account's sending reputation, and a low-cost way to make the platform send emails to arbitrary third parties, at no cost/CAPTCHA to the caller.

**CONFIRMED HIGH**, especially the `/api/applications` mail-relay angle, given the app is launching to public traffic.

## 4. HIGH — Email auto-confirmed on signup, no verification step

Per the task brief this was already verified live this session (real signup → immediate session, no confirmation email step required before use). Source-level consistency check: `src/app/regisztracio/page.tsx` calls `supabase.auth.signUp` and immediately `router.push(redirectTo)` on success (line 47-49) with no "check your email" interstitial, no polling for confirmation state, and no gated page waiting on `email_confirmed_at`. This is consistent with Supabase's "auto-confirm" project setting being enabled. Combined with finding #1, an attacker doesn't even need a real mailbox to mount the privilege-escalation attack — a throwaway email string is sufficient to get a live session. **CONFIRMED HIGH** (compounds risk of #1 and #3; also generally a fake-account/spam risk on its own).

## 5. No OAuth

`grep -rn "signInWithOAuth\|provider:" src/` → only a false-positive match on `next/font/google` (an unrelated font import in `src/app/layout.tsx:2`). **NOT_FOUND, confirmed** — no OAuth provider is wired up. Not a vulnerability; noted per the brief as informational.

---

## 6. Session handling (`client.ts`, `server.ts`, `proxy.ts`)

- `src/lib/supabase/client.ts` — `createBrowserClient` with `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` only. Standard, no service-role key, no custom session logic.
- `src/lib/supabase/server.ts` — `createServerClient` (SSR helper) reading/writing cookies via `next/headers` `cookies()`, wrapped in a `try/catch` on `setAll` (silently swallows cookie-write errors, e.g. when called from a context that can't set cookies — standard `@supabase/ssr` pattern, not a security issue).
- `src/proxy.ts` — this **is** Next.js's middleware, just renamed/relocated (the file exports `proxy(request)` plus a `config.matcher`, which is the standard Next.js middleware contract — this is almost certainly a project- or framework-version-specific convention; see also the repo's own `AGENTS.md`, which warns "this is NOT the Next.js you know" and to check `node_modules/next/dist/docs/` for renamed conventions, consistent with `middleware.ts` having been renamed to `proxy.ts` in the pinned Next.js version). Full file read (67 lines). What it does:
  - Instantiates a `createServerClient` scoped to the request/response cookies (this is what keeps the Supabase session cookie refreshed on navigation — standard SSR session-refresh middleware pattern).
  - Calls `supabase.auth.getUser()` once per matched request.
  - Route-gates by **presence of a user only** (not role) for four zones:
    - `/partner/*` (except `/partner/login`, `/partner/register`) → redirect to `/partner/login` if no user.
    - `/admin/*` (except `/admin/login`) → redirect to `/admin/login` if no user. **No role check here** — see finding #7 below.
    - `/profil`, `/kedvencek`, `/jelentkezeseim`, `/mentett-keresesek` → redirect to `/bejelentkezes` if no user.
    - Auth pages (`/partner/login`, `/partner/register`, `/bejelentkezes`, `/regisztracio`) → redirect *away* if already logged in.
  - `config.matcher` (line 65) scopes the middleware to exactly these paths — it does not run globally, so it adds no session-refresh benefit to public pages like `/kutyak` (not a security issue, just a scoping note).

**Assessment:** session handling itself (cookie-based SSR session via `@supabase/ssr`) is standard and looks correctly implemented. The middleware's admin gate being "logged in" rather than "is admin" is the one notable gap — detailed next.

## 6b. MEDIUM — `proxy.ts` admin gate checks login, not role

`src/proxy.ts:47-49`:
```ts
if (isAdminPage && !isAdminLogin && !user) {
  return NextResponse.redirect(new URL('/admin/login', request.url))
}
```
This only blocks **logged-out** visitors from `/admin/*`. Any authenticated non-admin user can request `/admin/dashboard` etc. at the middleware layer and will not be redirected here. **Mitigation confirmed present:** every actual admin page (`src/app/admin/dashboard/page.tsx`, `admin/dogs`, `admin/partners`, `admin/partners/[id]`, `admin/users`, `admin/applications`, `admin/activity` — verified via `grep -l requireAdmin src/app/admin/**/page.tsx`) calls `requireAdmin()` (`src/lib/admin.ts`) server-side on render, which does the real `role === 'admin'` check and redirects to `/admin/login?error=unauthorized` if it fails. So a non-admin hitting `/admin/dashboard` will see the redirect *from the page itself*, one render later, rather than from the middleware. Net effect: **no unauthorized data exposure**, but it's defense-in-depth debt (relies on every current and future admin page remembering to call `requireAdmin()`; the middleware would be the safer place to also enforce role, e.g. via a cached claim or a second query). Rated MEDIUM because the current pages all correctly self-gate (verified for all 7 admin pages that have real content; `admin/page.tsx` is just a `redirect("/admin/dashboard")` and `admin/login/page.tsx` is the login form itself, so both correctly don't need the check).

---

## 7. Role-based access — admin (`src/lib/admin.ts`) and partner authorization

### `requireAdmin()` — read in full (18 lines)

```ts
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/admin/login?error=unauthorized");
  return { user, supabase };
}
```
Confirmed as described in the brief: it performs a **fresh** Supabase query (not a JWT claim) against `profiles.role` on every call, avoiding stale-token issues on demotion. As shown in finding #1, this correctness is undermined by the fact that `role` itself is attacker-writable.

### Partner authorization — no `partner/layout.tsx` auth check; enforced per-page instead

`src/app/partner/layout.tsx` (full file read) is a **pure UI shell** (sidebar nav + mobile top bar) — it does **not** perform any auth or membership check itself; it just renders `children`. The actual authorization is done independently in each partner page:
- `src/app/partner/dashboard/page.tsx:21-31` — gets the user, then queries `partner_members` for `.eq("profile_id", user.id).single()`; if no membership row, shows an "you have no partner profile yet" state rather than partner data.
- `src/app/partner/dogs/page.tsx:20-31` — same pattern, then scopes the dogs query with `.eq("partner_id", membership.partner_id)`.
- `src/app/partner/applications/page.tsx:38-49` (client component) — same pattern via a client-side `supabase.from("partner_members")` lookup, then scopes `adoption_applications` by `.eq("partner_id", m.partner_id)`.
- `src/app/partner/dogs/[id]/edit/page.tsx:47-65` — same pattern; additionally the *read* of the dog to populate the edit form explicitly filters `.eq("id", dogId).eq("partner_id", m.partner_id)`, so a partner cannot even load another partner's dog into the edit form.

**Confirmed:** partner authorization genuinely checks `partner_members` membership (not just "is logged in") — consistently, across all four partner pages inspected. This membership check is real, not decorative.

**One code-level nuance worth flagging (not a live vulnerability, because RLS backstops it):** in `edit/page.tsx`, the `handleSubmit` (line 106-128, `UPDATE dogs ... .eq("id", dogId)`) and `handleDelete` (line 138, `DELETE ... .eq("id", dogId)`) calls do **not** re-add `.eq("partner_id", partnerId)` — only the initial `SELECT` used to populate the form does. If RLS were misconfigured, this client-side omission would be an IDOR (a partner could edit/delete another partner's dog by ID, bypassing the client's own membership pre-check simply by editing the request). **This is not currently exploitable** because the underlying RLS policy on `dogs` (`001_initial_schema.sql:314`, `"Partner members can manage dogs" for all using (is_partner_member(partner_id))`) independently re-checks membership against the dog row's actual `partner_id` at the database layer regardless of what the client sends — see IDOR section below. Still worth noting as a defense-in-depth gap: the app currently has exactly one layer of real enforcement (RLS) for this specific write path, with no redundant server-side check.

---

## 8. RLS deep-dive / IDOR risks (all 10 migrations read in full)

### (a) Cross-partner dog/application access

- `dogs`: `"Partner members can manage dogs" on dogs for all using (is_partner_member(partner_id))` (001:314) — `is_partner_member(p_partner_id)` (001:287-293) checks `exists (select 1 from partner_members where partner_id = p_partner_id and profile_id = auth.uid())`. Because this is evaluated against **the specific row's** `partner_id`, a member of Partner A cannot manage (select-for-write/update/delete under `for all`) a dog whose `partner_id` belongs to Partner B — the `exists` subquery would find no matching `partner_members` row and the policy evaluates false. **No IDOR** — correctly tenant-scoped. Public read is separately gated by `"Public can read dogs of approved partners"` (001:312-313), unrelated to this concern.
- `adoption_applications`: `"Partner members can read applications for their dogs" using (is_partner_member(partner_id))` (001:324) and `"Partner members can update applications for their dogs" using (is_partner_member(partner_id))` (006:3-5) — same pattern, correctly scoped per-application by its own `partner_id`. **No cross-partner IDOR.**
- Storage (`dog-images` bucket): upload/update/delete policies (005:14-48) all require `(storage.foldername(name))[1] in (select partner_id::text from partner_members where profile_id = auth.uid()) or is_admin()`, i.e. the first path segment of the object key must be a `partner_id` the caller is a member of. A partner cannot write into another partner's `<partner_id>/...` folder. **No IDOR.**

**Verdict (a): correctly enforced, no cross-partner IDOR found.**

### (b) Regular user reading another user's data

- `adoption_applications`: `"Applicants can read own applications" using (applicant_id = auth.uid())` (001:322) — scoped to the caller's own `applicant_id`. **No leak.**
- `favorite_dogs` / `favorite_partners`: `"Users manage own dog favorites" for all using (profile_id = auth.uid())` / `"...partner favorites..."` (001:332-333) — scoped to caller's own `profile_id`, and since these are composite-PK join tables with no independent `id`, there's no way to reference "someone else's" row by a guessable single ID either. **No leak.**
- `notifications`: `"Users can read own notifications" using (user_id = auth.uid())` and `"Users can update own notifications" using (user_id = auth.uid())` (001:328-329) — scoped correctly. No `with check` is specified on the update policy, so (per the same Postgres semantics as finding #1) `USING` is reused as `WITH CHECK`, meaning a user could in principle rewrite fields of their own notification row (e.g. flip `read` back to false, or edit `title`/`body`/`data`) — but since `user_id` cannot be changed away from their own id (same reasoning), **this cannot be used to touch another user's notifications**, and rewriting the content of one's own already-delivered notification has no meaningful security impact. Not flagged as a finding.

**Verdict (b): correctly enforced, no cross-user IDOR found on applications, favorites, or notifications.**

### (c) `profiles.role` self-escalation

Covered exhaustively in finding #1 above — **CONFIRMED CRITICAL**.

### Other RLS observations made while reading all 10 files

- `media` table: `"Public can read media" on media for select using (true)` (001:318) — this is a blanket-public-read policy with **no** join back to check whether the parent `entity_id`'s partner/dog is `approved`. If a partner uploads media rows for a not-yet-approved (`draft`/`pending_review`) dog/partner, those media rows are still readable by anyone who queries the `media` table directly (e.g. via the Supabase REST API `/rest/v1/media?entity_id=eq.<guess>`), even though the parent dog/partner itself would be hidden by the `dogs`/`partners` "approved only" policies. **However**, this table does not appear to be used anywhere in the app's own query code (no `grep` hits for `.from("media")` were found in the pages/components read during this audit — NOT VERIFIED exhaustively across every file, but not seen in any of the partner/dog/admin pages inspected), so real-world impact is likely low; flagged as **LOW–MEDIUM** informational finding since the policy itself is looser than the analogous `dogs`/`partners` policies and would leak pre-approval media if the table is ever wired up or queried directly against the REST endpoint.
- `partners`: self-service creation is intentionally open — `"Authenticated can create partner" with check (auth.uid() is not null)` (001:304) plus a trigger (`002_partner_portal.sql`) that auto-adds the creator as `'owner'` in `partner_members`. This looks like intended by-design self-service partner signup (new partners start in `status = 'draft'` and only their dogs go live once an admin approves the partner — confirmed via `partner/dashboard/page.tsx`'s "profile pending approval" messaging). Not flagged as a vulnerability.
- `donations`, `virtual_adoptions`: read-only "own records" policies exist (001:342-343) but no insert/update policies were found in any migration — consistent with the schema comment "schema ready, frontend later" (001:171, 187); these tables appear to be unused/future scaffolding, not a current attack surface.

---

## 9. File upload security

Files read: `src/components/DogImageUpload.tsx` (112 lines), `supabase/migrations/005_storage_dog_images.sql` (49 lines).

- **Bucket:** `dog-images`, created **public** (`005:4-6`: `insert into storage.buckets (..., public, file_size_limit, allowed_mime_types) values ('dog-images', 'dog-images', true, 5242880, array['image/jpeg','image/png','image/webp'])`). Public read is appropriate here — these are adoption-listing photos meant to be publicly visible on dog profile pages; there's no sensitive-document use case for this bucket.
- **Size limit:** `file_size_limit = 5242880` (5 MB) enforced at the **bucket** level (server-side, by Supabase Storage itself, not just client JS) — confirmed by the bucket config value, not just the client-side `MAX_SIZE_MB = 5` check in `DogImageUpload.tsx:5`. Client-side check (lines 32-35) is a UX nicety; the real enforcement is the bucket config.
- **MIME validation:** `allowed_mime_types` array restricts to `image/jpeg`, `image/png`, `image/webp` at the bucket level (server-enforced), matching the client-side `ALLOWED_TYPES` array (`DogImageUpload.tsx:6`) exactly. **Confirmed: real, server-side MIME validation exists, not just client-side.**
- **Cross-partner overwrite:** upload/update/delete storage policies (`005:14-48`) all require the first path segment of the object key to be a `partner_id` the caller is a member of (or `is_admin()`). `DogImageUpload.tsx:40` builds the path as `` `${partnerId}/${Date.now()}-${random}.${ext}` `` using the `partnerId` prop passed down from the page (which itself came from the page's own `partner_members` lookup — see finding #7). Even if a malicious client rewrote this path client-side to point at another partner's folder, the storage RLS policy would independently re-check membership against that folder name and reject the write. **Confirmed: cannot upload/overwrite another partner's images.**
- **Notable soft spot (informational, not a vulnerability):** the "Vagy megadás URL-ként" (or specify as URL) fallback field (`DogImageUpload.tsx:97-106`) lets a partner set `primary_image_url` to **any** arbitrary external URL, completely bypassing the upload pipeline (and thus the MIME/size checks) for the `dogs.primary_image_url` column. This is rendered client-side only via `<Image src=...>` / `<img src=...>`, so it does not enable stored XSS (no HTML/script executes from an `<img src>` attribute) and does not constitute SSRF (nothing server-side fetches the URL — Next.js `<Image>` component does proxy/optimize remote images server-side by default, which is a potential minor SSRF/abuse vector for arbitrary attacker-supplied hostnames if `next.config`'s `images.remotePatterns` is unrestricted; **NOT VERIFIED** — `next.config.ts`/`.js` was not inspected in this pass, flagging as a follow-up item rather than a confirmed finding).

**Verdict: file upload security is correctly implemented** — real server-side MIME/size/bucket-scoping enforcement, not just decorative client-side checks; no cross-partner overwrite path found.

---

## 10. API route authorization — `/api/applications`

`src/app/api/applications/route.ts` (full file, 98 lines), consistent with the brief's prior read this session:
- Validates required fields (`dogId`, `name`, `email`) and email format via `EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/` (line 8, 33-35).
- Looks up the dog server-side (`.from("dogs").select("id, name, partner_id, ...").eq("id", dogId).single()`, lines 43-47) to derive the **true** `partner_id` — confirmed it never trusts a client-supplied partner id for the insert (line 55: `partner_id: dog.partner_id`).
- Sets `applicant_id: user?.id ?? null` (line 56) — correctly allows anonymous submissions (per `003_contact_rls.sql`'s public insert policy) while attributing the application to a real user when logged in.
- Email sending is wrapped in `Promise.allSettled` (line 94) so a failure there can't fail the whole submission — reasonable resilience choice, not a security issue.

**Rate limiting / spam:** none found (see finding #3 — this endpoint is the concrete example of that broader gap; it's public, unauthenticated-capable, and triggers two outbound emails per call with no per-IP/per-email throttle, CAPTCHA, or honeypot).

**CSRF exposure:** assessed as **LOW risk**. This is a Next.js Route Handler, not a classic cookie-only session endpoint whose sole authority is an ambient browser-sent cookie interpretable cross-site — the endpoint doesn't use the caller's session to authorize anything privileged (it works identically for anonymous and logged-in callers, and its authorization model is "whoever calls it can create an application," which is the intended public behavior, not a boundary being crossed). A cross-site POST to this endpoint from an attacker's page would functionally just be another way to submit a spam application — already covered by the rate-limiting finding — rather than a distinct CSRF privilege issue. Same-origin fetch is not relied upon for any access-control decision here, so classic CSRF token protection would add little beyond what fixing #3 already provides.

---

## 11. XSS review — `src/lib/email.ts`

Full file read (84 lines). The `esc()` helper (lines 25-31) HTML-escapes `&`, `<`, `>`, `"`. Checked every interpolation of user-supplied data across both `send*` functions:
- `sendApplicationReceivedToPartner` (lines 43-67): `opts.partnerName`, `opts.applicantName` (x2), `opts.dogName`, `opts.applicantEmail` (x2, including inside the `mailto:` href), `opts.applicantPhone`, `opts.message` — **every one is wrapped in `esc(...)`** (lines 55, 56 x2, 58, 59 x2, 60, 62). Only non-escaped interpolations are `opts.dogId` inside a URL path (`${SITE_URL}/kutyak/${opts.dogId}`, line 63) — `dogId` is a UUID from the `dogs` table, not raw user input, and is placed in a URL path segment, not raw HTML, so no escaping is needed there.
- `sendApplicationConfirmationToApplicant` (lines 69-83): `opts.applicantName`, `opts.dogName`, `opts.partnerName` — **all wrapped in `esc(...)`** (line 77, 78 x2).
- `layout()` (lines 33-41): interpolates only `body` (already-escaped content assembled by the caller) and `SITE_URL` (a server-side env var, not user input).

**Verdict: no XSS gap found.** `esc()` is applied consistently and correctly to every user-controlled string that reaches email HTML in both send functions.

---

## 12. SQL injection review

`grep -rn "\.rpc(\|raw(\|sql\`" src/` → **zero matches**. No raw SQL string concatenation, no `.rpc()` calls, no tagged-template SQL usage anywhere in `src/`. All database access goes through the Supabase JS client's structured query builder (`.select()/.insert()/.update()/.delete()/.eq()` etc.), which is parameterized under the hood. **Verdict: no SQL injection surface found in application code.** (Migrations do contain hand-written SQL functions with dynamic-looking string concatenation, e.g. `009_saved_search_notifications.sql`'s `ilike '%' || (p_filters->>'q') || '%'` — but this is server-side `plpgsql` operating on a `jsonb` value already bound as a function parameter, not string-built SQL executing attacker-controlled statements; not an injection vector.)

---

## 13. Secrets / env handling

- `.gitignore` (repo root, full file read) line: `.env*` — confirms `.env.local` and all `.env*` variants are gitignored. **Confirmed: not committed.**
- `grep -rn "service_role\|SUPABASE_SERVICE" src/` → **zero matches**. The Supabase service-role key is never referenced anywhere in the app's own source, client- or server-side. Both `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` use only `NEXT_PUBLIC_SUPABASE_ANON_KEY`. **Confirmed: no service-role key leakage risk in source.**

---

## 14. Dependency vulnerabilities — `npm audit`

Full output captured (no `--fix`/`--force` run):

```
next  9.3.4-canary.0 - 16.3.0-preview.10   Severity: high
  - Middleware / Proxy bypass in App Router applications using Turbopack and single locale (GHSA-6gpp-xcg3-4w24)
  - Denial of Service in App Router using Server Actions (GHSA-m99w-x7hq-7vfj)
  - Server-Side Request Forgery in Server Actions on custom servers (GHSA-89xv-2m56-2m9x)
  - Cache confusion of response bodies for requests with bodies (GHSA-68g3-v927-f742)
  - Cache confusion ... invalid UTF-8 byte sequences (GHSA-4633-3j49-mh5q)
  - Unbounded Server Action payload in Edge runtime (GHSA-4c39-4ccg-62r3)
  - SSRF in rewrites via attacker-controlled destination hostname (GHSA-p9j2-gv94-2wf4)
  - DoS in the Image Optimization API using SVGs (GHSA-q8wf-6r8g-63ch)
  - Unauthenticated disclosure of internal Server Function endpoints (GHSA-955p-x3mx-jcvp)
  fix available via `npm audit fix --force` → would install next@16.3.4 (outside stated dependency range: package.json pins "next": "16.2.10")

postcss <=8.5.22   Severity: high
  - XSS via unescaped </style> in CSS Stringify output (GHSA-qx2v-qp2m-jg93)
  - Arbitrary file read / info disclosure via sourceMappingURL (GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp)
  - Path traversal in previous-source-map auto-loading (GHSA-r28c-9q8g-f849)
  (transitive via next / postcss)

qs 2.2.5 - 6.15.3   Severity: moderate
  - array-limit bypass via bracket-key comma parsing (GHSA-x5fp-wj9c-mxmx)
  - DoS via attacker-controlled isBuffer (GHSA-4mjr-xmp4-gh2g)
  fix available via `npm audit fix` (no --force needed)

sharp <0.35.0   Severity: high
  - inherited libvips vulnerabilities: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591

undici 7.0.0 - 7.28.0   Severity: high
  - response desynchronization via retry interceptor (GHSA-8xcm-r25x-g524)
  - cross-user information disclosure / parse-time crash via degenerate private cache directives (GHSA-4cwx-7wf7-3272)
  - CRLF injection via blob-like body 'type' property (GHSA-m8rv-5g2x-5cg5)
  - cross-user info disclosure via whitespace around '=' in Cache-Control directives (GHSA-jr45-8vmc-qm54)
  - cookie attribute injection via unsanitized domain/setCookie fields (GHSA-v3r7-h72x-cjcm)
  fix available via `npm audit fix` (no --force needed)

13 vulnerabilities total (3 moderate, 10 high)
```

`package.json` pins `"next": "16.2.10"`. **Note:** several of these advisory IDs/CVE identifiers and the "16.3.x fixes it" framing could not be independently cross-checked against the public GitHub Advisory Database from this sandboxed, no-outbound-network audit environment — reported here exactly as `npm audit`'s local advisory database (bundled with the installed npm version) returned them. Treat the specific advisory numbers as `npm audit`'s own report; the actionable fact — 13 known vulnerabilities including 10 high-severity ones, concentrated in the pinned Next.js version and its `postcss`/`sharp` sub-dependencies, plus `qs` and `undici` — is what matters for launch triage. **Recommendation:** run `npm audit fix` (the non-`--force` fixes for `qs` and `undici`) and separately evaluate the Next.js major-version bump (`16.2.10` → `16.3.4`) on its own schedule given it's outside the currently stated dependency range and warrants regression testing, not a blind `--force` install.

---

## 15. Rate limiting / bot abuse — cross-cutting summary

Already detailed per-surface above (findings #2, #3, #4); consolidating here since the brief calls it out as its own topic. `grep -rniE "rate.?limit|ratelimit|throttle"` across `src/` and `package.json` returns nothing. **Confirmed: zero rate-limiting exists anywhere in this application** — not for signup, not for login, not for the public adoption-application form, not for any admin/partner mutation endpoint. Given this app is about to accept public Hungarian-market traffic, the combination of (a) no rate limiting, (b) auto-confirmed signups requiring no real mailbox, and (c) the CRITICAL role-escalation bug in finding #1, means a single unauthenticated actor can currently script an unlimited number of accounts and, for any one of them, self-promote to admin with no throttle standing in the way. **Rated HIGH as a standalone finding**, and it materially amplifies the severity of finding #1.

---

## Evidence index

- `src/lib/admin.ts` (full file, 18 lines)
- `src/proxy.ts` (full file, 67 lines)
- `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts` (full files)
- `src/app/partner/layout.tsx`, `src/app/partner/dashboard/page.tsx`, `src/app/partner/dogs/page.tsx`, `src/app/partner/dogs/[id]/edit/page.tsx`, `src/app/partner/applications/page.tsx` (full files)
- `supabase/migrations/001_initial_schema.sql` through `010_partner_follow_notifications.sql` (all 10 files, full contents)
- `src/components/DogImageUpload.tsx`, `supabase/migrations/005_storage_dog_images.sql` (full files)
- `src/app/api/applications/route.ts` (full file)
- `src/lib/email.ts` (full file)
- `src/app/regisztracio/page.tsx`, `src/app/bejelentkezes/page.tsx` (full files)
- `.gitignore` (full file)
- `npm audit` (full output, reproduced above)
- Greps run and quoted verbatim above: password-reset, OAuth, rate-limit, service_role, raw SQL, science/research (see doc 11).
