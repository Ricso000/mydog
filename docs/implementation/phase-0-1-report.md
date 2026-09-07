# Phase 0 + Phase 1 Report

Branch: `phase-0-1-launch-safety` (pushed, PR not yet merged — awaiting review per explicit instruction). Plan: `docs/implementation/phase-0-1-plan.md`. Master plan: `mydog-post-audit-master-plan-for-claude.md` (product-owner-provided, post-audit).

## Status

**DONE, addressed a review round, still NOT MERGED** — all of Phase 0 (0.1–0.4) and Phase 1 (1.1–1.7) implemented, tested, and verified per the plan. Production's only live change from this phase is two Auth **config** values (`site_url`/`uri_allow_list`) plus a Vercel Firewall rule and the already-existing `011`/`012` security migrations (predate this phase). `mailer_autoconfirm` on production is deliberately left `true` — correct for the code currently deployed there — and must be flipped to `false` **only as step 4 of the "Production rollout checklist" below**, not as part of the merge itself.

This report was revised on 2026-09-07 in response to review feedback: leftover production test data from this session was located, verified, and deleted (see "Production test-data cleanup"); the automated-test count was corrected to the actual, freshly-verified number (36, not 40); the real-email vs. `generate_link`-simulated distinction was made explicit throughout "Manual E2E verification"; an explicit ordered "Production rollout checklist" was added; and the backup gap is now called out as a standing launch blocker independent of this PR. **Per explicit instruction, this branch is still not to be merged automatically — it is to be re-reviewed after these changes.**

## Files changed

65 files changed, 7046 insertions(+), 886 deletions(-) across 7 commits on `phase-0-1-launch-safety`. Grouped by task:

- **0.1**: `supabase/migrations/011_*.sql`, `012_*.sql` (already-applied audit fixes, now in git), `docs/audit-2026-09-launch-readiness/*` (21 files), `docs/implementation/phase-0-1-plan.md`.
- **0.3**: `docs/database-migration-operating-procedure.md` (new).
- **1.1**: `src/components/admin/DogStatusAction.tsx`, `src/app/admin/dogs/page.tsx`, `src/app/partner/dogs/page.tsx`, `src/app/partner/dogs/[id]/edit/page.tsx`.
- **1.2**: `vitest.config.ts`, `tests/setup.ts`, `tests/globalSetup.ts`, `tests/fixtures/*.ts` (4 files), `.github/workflows/ci.yml`, `.env.test.example`, `.gitignore` (added `supabase/.temp`, un-ignored `.env.test.example`), `package.json`/`package-lock.json` (added `vitest`, `dotenv`).
- **1.3**: `src/app/admin/dashboard/page.tsx`, `src/app/bobilos-utazas/page.tsx`, `src/app/partner/applications/page.tsx`, `src/app/rolunk/page.tsx`, `src/components/Footer.tsx`.
- **0.4**: `package.json`/`package-lock.json` (`npm audit fix`).
- **1.4**: `src/app/bejelentkezes/page.tsx`, new `src/app/jelszo-visszaallitas/page.tsx`, new `src/app/jelszo-visszaallitas/uj-jelszo/page.tsx`.
- **1.5/1.6**: `src/app/api/applications/route.ts`, `src/components/ContactForm.tsx`, new `supabase/migrations/013_duplicate_application_check.sql`.
- **1.7**: `src/app/regisztracio/page.tsx`, `src/app/partner/login/page.tsx`, `src/app/partner/register/page.tsx`, new `src/app/megerositve/page.tsx`, new `supabase/migrations/014_partner_registration_idempotency.sql`.
- **Tests** (8 files, 36 automated tests total — verified by a fresh `npm run test` run on 2026-09-07): `tests/security/profile-role-escalation.test.ts`, `tests/security/partner-approval-escalation.test.ts`, `tests/security/tenant-isolation.test.ts`, `tests/dogs/status-transitions.test.ts`, `tests/adoption/application-submission.test.ts`, `tests/auth/password-reset.test.ts`, `tests/auth/signup-confirmation.test.ts`, `tests/auth/partner-registration-confirmation.test.ts`.

## Database changes

Migrations `011`–`014`, all applied to **both** the production project (`eikkgaocpkhwdgndiupm`) and the isolated `MyDog CI Test` project (`zzkudljlyvkjfkjwamcn`), via `supabase db push` after the migration-history reconciliation (task 0.3):

- `011_fix_role_privilege_escalation.sql` — pre-existing (audit-produced), now committed.
- `012_fix_partner_approval_escalation.sql` — pre-existing (audit-produced), now committed.
- `013_duplicate_application_check.sql` — new: `has_recent_pending_application()` security-definer function.
- `014_partner_registration_idempotency.sql` — new: `partners.created_by_user_id` + partial unique index.

Production's CLI migration history is now fully reconciled (`supabase migration list --linked` shows `local == remote` for all 14; a real `supabase db push --dry-run` confirms "Remote database is up to date").

## Security impact

- Task 1.5 added a published Vercel Firewall rate-limit rule on `/api/applications` (5 req/10 min/IP) — **live on production now**, verified with real traffic against production itself (see "Production changes").
- Task 1.6 fixed a real RLS-related bug found during implementation: the initial duplicate-check design used a direct table `SELECT` through the anon-key client, which RLS correctly blocked for anonymous submitters (see plan doc) — fixed via a narrow `security definer` function, preserving the anon-key-only architecture the original audit flagged as a positive property.
- Task 1.7 closes the audit's HIGH finding "auto-confirmed signups requiring no real mailbox" (report 12, finding #4) — once deployed, both regular and partner signups require a real, clicked confirmation link.
- No new privilege-escalation surface was introduced: `partners.created_by_user_id` (014) is additive and does not weaken the `011`/`012` triggers; the new RPC function (013) returns only a boolean.

## Tests added

**36 automated tests across 8 files** (Vitest), run exclusively against the isolated `MyDog CI Test` Supabase project — see `docs/implementation/phase-0-1-plan.md`'s "Testing environment policy." Re-run fresh on 2026-09-07 to confirm this number before finalizing this report:

```
Test Files  8 passed (8)
     Tests  36 passed (36)
```

This is the complete automated-test count for this phase — the Manual E2E verification section below covers additional checks (a local full-flow script and a Preview-environment script) that are deliberate one-off Playwright scripts, not part of the Vitest suite, and are not included in the "36" figure.

Coverage: the 5-case `profiles.role` escalation regression, the 4-case `partners` approval/verification escalation regression, cross-partner tenant isolation (new), dog-status transitions including the false-activity-log-entry fix, `/api/applications` validation + duplicate-protection + honeypot + message-cap, the 5-step password-reset acceptance flow, the signup-confirmation gate, and the deferred-partner-registration insert + concurrency guarantee.

## Commands run

```
npx eslint .           -> 0 errors (was 5 at the start of this phase)
npx tsc --noEmit       -> clean (strict mode)
npm run test           -> 8 files, 36 tests, all passing
npm run build          -> passes, 36 routes (was 35 — /megerositve, /jelszo-visszaallitas, /jelszo-visszaallitas/uj-jelszo added; /jelszo-visszaallitas/uj-jelszo counted separately)
npm audit              -> 13 -> 3 vulnerabilities (postcss/sharp/next itself remain, require --force / a Next.js version bump, explicitly out of scope)
```

## Manual E2E verification

All against the **CI Test project** (never production), per the Testing Environment Policy, unless explicitly marked otherwise below.

### Important distinction: real delivered email vs. `generate_link`-simulated email

**Almost none of this phase's verification involved a literal, delivered-and-opened email.** Two different techniques were used across this session, and they are not equivalent:

- **`generate_link`-simulated** (used in checks 1, 3, 6, 7 below): Supabase's `auth.admin.generateLink()` admin API produces the same action link a real email would contain, without Resend/SMTP ever sending anything. A script or Playwright then opens that link directly. This proves the **page/callback logic** (session establishment, confirmation, password update) works correctly — it does **not** prove email deliverability, template rendering, spam-filter behavior, or that Resend is correctly configured end-to-end.
- **Real, actually-dispatched email** (check 8 below only): a genuine `supabase.auth.signUp()` and a genuine `supabase.auth.resetPasswordForEmail()` call were made directly against **production**, which would have caused Supabase to actually queue a real email via Resend to a real inbox.

Only check 8 involved a real send; every other check in this list used `generate_link`.

1. **Task 1.1** (no email involved) — the master plan's exact 5-point dog-status check, plus a 6th check this session added after finding a real gap: forcing an RLS failure mid-session (revoking an admin's role) and confirming no false `activity_logs` entry is written. All pass.
2. **Task 0.4** (no email involved) — full manual smoke pass: register → browse → apply → partner-login. Pass.
3. **Task 1.4 — `generate_link`-simulated** — the full 5-step password-reset acceptance flow via a real browser click-through, using Supabase's `generate_link` admin API to produce the recovery link (no real inbox was used for this pass). Pass.
4. **Task 1.5** (no email involved) — Firewall rate limiting tested **live against production itself** (see below), using a nonexistent `dogId` so no real data was ever touched.
5. **Task 1.7 — `generate_link`-simulated** — two separate manual click-throughs (regular-user and partner-registration confirmation), each re-run after an initial verification attempt used a flawed technique (passing a `password` param to `generate_link` for an already-existing user, which silently reset that user's metadata and produced a false "partner never created" result) — corrected, re-verified, and the root cause documented in the plan and in commit `e78e1bf`.
6. **Full final E2E pass — `generate_link`-simulated** (this session, local dev pointed at CI Test): register → partner register → admin approval → dog upload → public visibility → application submission → partner review. **7/7 steps PASS.**
7. **Preview-environment full verification — `generate_link`-simulated** (this session, after the product owner's explicit direction to isolate Preview from production before any further real-email testing — see below). Accounts were created via `admin.createUser` (which never sends an email); the confirmation/recovery **pages** were then exercised for real against the live Preview deployment using `generate_link`-derived tokens navigated to in a real browser. **11/11 checks PASS** (one initial run showed a transient failure on the reset-request step alone, immediately re-confirmed as a Supabase-side email-send rate limit — `rate_limit_email_sent`, 2/hour, shared across all of today's testing — not an application bug; a standalone recheck a few minutes later, once the quota partially recovered, showed the exact same button/page working correctly). **No real email was sent or received during this pass.**
8. **Aborted real-inbox test on production — real, actually-dispatched email (not simulated)**: at the product owner's request, a real `signUp()` and a real `resetPasswordForEmail()` were fired directly against production for `banki.richard@compassmarketing.hu`, with `mailer_autoconfirm=false` briefly live — meaning Supabase very likely queued real emails via Resend to that inbox. This attempt was **aborted mid-flow** once `/jelszo-visszaallitas` was found to 404 on production (the corresponding page code was only on this local branch, not yet deployed) — see the incident note under "Production changes." **Whether either email was actually received was never confirmed within this session**: the resulting signup was left permanently unconfirmed and has since been located and deleted as a cleanup step (see "Known remaining issues" — the account no longer exists, so it cannot be checked after the fact). No adoption-application row was ever created by this attempt (searched for and confirmed absent). **The product owner should independently confirm via their own inbox whether these two emails were received**, since this is the only real send this phase produced and it was not completed end-to-end.

### Preview/production isolation (new, lasting architectural change, per explicit product-owner direction)

Before this pass, Vercel's **Preview** environment variables (`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`) pointed at the **same production Supabase project** as Production — confirmed both in the original audit (report 15 §3) and again live this session. This has been changed:

- Preview's `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` now point at the isolated `MyDog CI Test` project. Production's own env vars were not touched.
- This is intended to be **permanent**, per explicit instruction: no future feature-branch Preview deployment should point at the production database again.
- A one-time manual deployment was made via `vercel deploy` (not a git-triggered auto-deploy, since `git push` of a new branch doesn't itself create one without a linked GitHub-App integration having run) to verify this works: `https://mydog-p6v6qehcz-richards-projects-4b5b46d6.vercel.app`. The CI Test project's `site_url`/`uri_allow_list` were temporarily pointed at this Preview URL for the verification pass above, then reverted back to `http://localhost:3000` (+ `:3100`) for ongoing local development — this project's `site_url` is a "whichever environment I'm actively testing against right now" value, not something with one permanently-correct answer, unlike production's.

## Production changes

Only infrastructure/config, no data, and all independently confirmed reversible or already-safe:

1. **Auth `site_url`/`uri_allow_list`** — was `http://localhost:3000` / empty (a pre-existing misconfiguration, unrelated to any single task, found while implementing 1.4) — now `https://rescueconnect-nu.vercel.app` (+ the Preview wildcard + localhost). Safe regardless of this branch's merge status; the old value was already broken for real users.
2. **Auth `mailer_autoconfirm`** — flipped to `false`, then **immediately reverted back to `true`** after discovering the corresponding code wasn't deployed yet (see the incident note below). Currently `true` — matching the code actually live on production today.
3. **Vercel Firewall rule `block-application-spam`** — published and live: rate-limits `/api/applications` to 5 requests / 10 minutes / IP. Verified with real traffic against production (nonexistent `dogId`, zero real data touched): requests 1–5 reached the app (404), requests 6–7 were blocked at the edge (403).
4. **Vercel Preview env vars** — repointed to the CI Test project (see above), production env vars untouched.
5. Migrations `011`–`014` are applied to production (011/012 predate this phase; 013/014 applied during it) — pure schema/function additions, no data migration.

### Incident note (self-caught, corrected same session)

Partway through Task 1.7's real-mailbox verification, `mailer_autoconfirm=false` was set on **production** before realizing the corresponding frontend code (which handles "no session after signUp()") was not yet deployed there — only on this local branch. This would have left real users unable to complete registration (old code expects an immediate session). **Caught and reverted within the same session**, before any real user could be affected (verified via `auth.users` that the one throwaway account created during this window had no other real users register in that interval). Root cause: config changes and code deployment are decoupled in this workflow (config via Management API, code via git merge + Vercel build) — worth calling out explicitly as a process risk for whoever merges this PR: **flip `mailer_autoconfirm` to `false` on production only after this branch is merged and the production deployment is confirmed live**, not before.

## Known remaining issues

- **Task 0.2 (backups) — treated as a LAUNCH BLOCKER, tracked as a separate infrastructure/billing decision, not part of this PR's scope**: confirmed via the Management API — production is on the **free** Supabase plan tier, which has `pitr_enabled: false` and zero stored backups. This means a bad migration, a bad manual query, or an accidental delete on production today is **unrecoverable**. Fixing it requires a paid-plan upgrade — a billing decision for the product owner, not something this branch can or should resolve. **This branch must not be treated as "launch ready" merely because it merges cleanly; the backup gap remains open and blocking regardless of this PR's status**, per the original audit's own top-3 blockers.
- **Task 1.5, Layer 3**: `rate_limit_email_sent` (Supabase's own project-wide email-send throttle, 2/hour by default) cannot be raised without configuring custom SMTP — a separate, larger change. This was directly felt during this session's own testing (several "email rate limit exceeded" errors on the CI Test project) and would eventually affect real users too under real signup/password-reset volume. Documented, not fixed, per the plan's original scoping.
- **`npm audit`**: 3 remaining high-severity findings (`postcss`, `sharp`, `next` itself) require `next@16.3.4` via `--force`, explicitly out of scope for this phase per the master plan.
- ~~Preview deployment used for this phase's verification was a one-off `vercel deploy`, not a GitHub-integration-triggered deployment tied to the PR itself~~ — **RESOLVED, verified 2026-09-07**: after opening the PR, Vercel's GitHub integration produced its own `target: preview` deployment tied to the branch (`dpl_E3qFtRUJiFVNovW7KTM3C3oNhCQw`, PR check "Vercel" green), and its JS bundle was fetched and inspected directly, confirming it embeds `https://zzkudljlyvkjfkjwamcn.supabase.co` (the CI Test project) — the Preview→CI-Test env var scoping does correctly apply to integration-triggered deployments, not just the earlier one-off manual `vercel deploy`.
- **This phase's testing never exercised a real, delivered-and-clicked confirmation or recovery email end-to-end** — see "Manual E2E verification" checks 1–7 (`generate_link`-simulated) vs. check 8 (the one real send, aborted mid-flow, receipt unconfirmed). Before launch, someone should do at least one genuine signup with a real inbox against the eventual production configuration (post-merge, with `mailer_autoconfirm=false`) to confirm Resend delivery, template rendering, and spam-folder placement — none of which `generate_link` can verify. This is explicitly step 5/6 of the "Production rollout checklist" below.

## Production test-data cleanup (performed 2026-09-07, before this review round)

Per the review request, production was audited for lingering artifacts from this session's earlier (aborted) real-mailbox test, using the Supabase Management API's database-query endpoint (read then delete, each step confirmed before the next):

- **Found and deleted**: one unconfirmed `auth.users` row for `banki.richard@compassmarketing.hu` (created 2026-09-06 21:27:40 UTC, `confirmed_at: null`, no associated `partners` row). Deleted, then verified zero remaining rows in `auth.users`, `public.profiles`, `auth.identities`, and `auth.sessions` for that user id.
- **Searched and confirmed absent**: `e2e-test-claude@example.com` in `auth.users` (already removed earlier in this session) — no match found. An `adoption_applications` row matching this session's aborted contact-form-submission attempt (searched by the exact message text and applicant name the test script would have used) — no match found; that submission never actually completed (the script was interrupted before or during that step, not after).
- **Found but deliberately left untouched, per explicit product-owner decision**: one `adoption_applications` row for the same email address, dated 2026-07-08 — this predates this session entirely (by roughly two months) and is not an artifact of this audit/implementation work, so it was left in place rather than assumed to be test data.
- **Net result**: no audit/test artifact from this session remains in the production database.

## Production rollout checklist (post-merge)

This is the **required, ordered** sequence for taking this branch live. Each step gates the next — do not skip ahead, and do not treat "PR merged" as equivalent to "feature live and safe." The backup gap (see "Known remaining issues") is intentionally *not* a step here — it's a separate, standing blocker that this checklist does not resolve.

1. **Merge** `phase-0-1-launch-safety` into `main`.
2. **Confirm the Vercel production deploy succeeds** (build passes, deployment reaches `READY`, no runtime errors in the function logs for the first few minutes).
3. **Smoke test production** with the *existing* `mailer_autoconfirm=true` behavior still active — confirm the site loads, login/browse/apply still work, and specifically that `/jelszo-visszaallitas` and `/megerositve` now return 200 (not 404, closing the exact gap that caused this phase's incident). No new signups needed yet; this step only proves the new code is live and not broken.
4. **Only after step 3 passes**: flip production Auth `mailer_autoconfirm` to `false` via the Management API (`PATCH /v1/projects/eikkgaocpkhwdgndiupm/config/auth`). This is the point of no return for auto-confirmed signups — do not do this before step 3.
5. **Real regular-user signup confirmation test**: perform one genuine `signUp()` on production with a real inbox you control, confirm the email is actually received (not just that `generate_link` would work), click the real link, and confirm login succeeds afterward and fails before.
6. **Real partner-signup confirmation test**: same as step 5 but through `/partner/register`, confirming the deferred-partner-registration flow creates exactly one `partners` row attributed to the confirmed user.
7. **Rollback plan if step 5 or 6 fails**: immediately flip `mailer_autoconfirm` back to `true` via the same Management API endpoint. This alone is sufficient to restore the pre-rollout behavior (auto-confirmed signups) without requiring a code revert, since the application code already handles both states. Investigate the failure against the CI Test project (never re-attempt directly on production), fix, and restart this checklist from step 4.

## Next recommended phase

Per `docs/audit-2026-09-launch-readiness/20-recommended-execution-order.md` and this phase's own findings, once the rollout checklist above is fully complete:

1. Resolve the backups question (0.2) — a plan-tier/billing decision, tracked separately from this PR.
2. Proceed to **Phase 2** (public credibility/discovery — fixing `/menhelyek`, cleaning the 7 static marketing pages, `/hirek` 404) per the master plan §5, which was explicitly out of scope for this phase.
