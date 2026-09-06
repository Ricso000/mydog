# Phase 0 + Phase 1 Implementation Plan

Prepared per `mydog-post-audit-master-plan-for-claude.md` §17. Scope: Phase 0 (repository/production safety) and Phase 1 (launch blockers + regression safety net) only. Nothing past Phase 1 is started from this plan.

Decisions already confirmed with the product owner before this plan was written:
- **Test/CI database:** a separate, dedicated Supabase project, isolated from production. **Created:** `MyDog CI Test`, ref `zzkudljlyvkjfkjwamcn`, org `laurgmyrgaaxupnncqfd`, region `eu-central-1`, same free tier as production. All 12 migrations (001–012, including the two security fixes) have been pushed to it via `supabase db push --db-url ... --include-all` and its CLI migration history is fully in sync (`local` = `remote` for all 12) — this also serves as a working template for reconciling production's history in task 0.3.
- **Email verification:** implement real Supabase email confirmation (Option A from the master plan's §1.7), accepting that this requires redesigning the partner-registration flow (see task 1.7 below) rather than the lower-effort Option B.
- **Rate limiting:** use Vercel's built-in Firewall (confirmed available on the current plan — a test rate-limit rule was successfully staged and then discarded during this planning pass) rather than adding a third-party dependency, for the one surface it can actually protect.
- **Git workflow:** a dedicated feature branch (`phase-0-1-launch-safety`) with a PR at the end of the phase, not direct commits to `main`.

## Testing environment policy (governs every task below)

Per explicit product-owner direction after the first draft of this plan: **no state-changing manual or automated test may run against the production Supabase project.** This supersedes anywhere below that earlier said "against the local dev server pointed at production" — every such step now runs against `MyDog CI Test` (ref `zzkudljlyvkjfkjwamcn`) instead, via a separate local env file (`.env.local.citest`, gitignored, holding the CI Test project's URL/anon key) swapped in for manual click-through verification during implementation, and via the CI project's keys for all automated tests.

Production is touched in this phase **only** for:
1. Deploying the actual code changes (unavoidable — that's the point of shipping).
2. Two one-time Auth **config** toggles required for the real features to work: `site_url`/`uri_allow_list` (task 1.4) and `mailer_autoconfirm` (task 1.7) — configuration, not data, and both instantly reversible.
3. Publishing the Vercel Firewall rule (task 1.5) — real infrastructure needed for real protection, not test data.
4. Strictly **read-only** verification that the above are live and correct (e.g. `curl` for a 200, reading back an Auth-config value, `vercel firewall overview`).

**The one narrow, explicit exception**, called out plainly so it's never mistaken for routine regression testing: the master plan's own Gate-A criteria require confirming *real inbox delivery* for (a) the application-received/confirmation emails and (b) the password-recovery email — this can only be verified where Resend and Supabase Auth are actually live, i.e. production. This will happen **once**, at the end of the phase, using an email address the product owner controls, producing exactly two small, clearly-tagged artifacts (one real test adoption-application row, one real password change on an account the owner controls) — not a repeated or automated check. Both will be called out explicitly in the phase report with exact IDs, and the product owner can request either be deleted afterward. Every other verification step in this plan, including all of Task 1.1's manual dog-status checks, Task 0.4's flow smoke test, and Task 1.5/1.6's abuse-simulation tests, runs against the isolated CI Test project instead.

New facts discovered during this planning pass that change scope from the master plan's original wording (flagged inline where relevant):
- Supabase's own built-in password-recovery email is **already configured** with a real template ("Reset your password") — task 1.4 does not need a new Resend-based email, only UI + a callback route.
- Production Supabase Auth's `site_url` is currently `http://localhost:3000` and `uri_allow_list` is **empty** — any confirmation/recovery email sent today would try to redirect back to localhost. This must be fixed as a prerequisite for tasks 1.4 and 1.7, not just for those tasks individually — it's a standalone, pre-existing misconfiguration.
- Enabling real email confirmation breaks the current partner-registration flow's assumption that a session exists immediately after `signUp()`. This requires deferring the `partners` table insert until after confirmation (detailed in task 1.7), which is genuinely new logic, not a toggle flip.

---

## Task 0.1 — Commit audit artifacts and security migrations

**Affected files (all already exist on disk, none new):**
- `supabase/migrations/011_fix_role_privilege_escalation.sql`
- `supabase/migrations/012_fix_partner_approval_escalation.sql`
- `docs/audit-2026-09-launch-readiness/*.md` (21 files)

**Migration impact:** none — both migrations are already applied to production; this task only adds them to version control.

**Test plan:** `git status` before and after must show these paths tracked; `git log` on the new branch must show a commit containing exactly these paths (plus whatever else this phase adds).

**Rollout order:** first — this should happen before any other change so the branch's history starts from an accurate baseline.

**Rollback:** trivial — `git revert` the commit; has no runtime effect since it's a docs/migration-file-only commit (the migrations are already live in the DB regardless of git state).

---

## Task 0.2 — Confirm Supabase backups

**Method:** Supabase Management API, `GET /v1/projects/{ref}/database/backups` (read-only, no destructive risk) — will be run during implementation and the exact response (enabled/disabled, retention, PITR) documented in the phase report. If backups are off, this becomes a documented, escalated decision for the product owner (likely a plan-tier question), not something silently fixed by this phase.

**Affected files:** none (a Supabase project setting) — output goes into the phase report and, if a paid tier change is needed, is presented to the product owner rather than actioned automatically.

**Test plan:** re-run the same read-only API call after any settings change and confirm the reported state matches what was requested.

**Rollout order:** early (task 2), independent of everything else.

**Rollback:** N/A (read-only verification; any enablement change would be a Supabase dashboard/billing action taken by the product owner, not a reversible code change).

---

## Task 0.3 — Reconcile production's migration history

**Problem (from the audit):** production's `supabase migration list` shows all of 001–012 with an empty `remote` column — the CLI's bookkeeping table has no record of them, even though the schema is live. Contrast: the new CI Test project (created for this phase) shows `local` = `remote` for all 12, because it received them via `supabase db push` from a clean state — this is the target end-state for production too, just reached differently (repair, not re-apply).

**Method:** `supabase migration repair --status applied <version>` for each of 001–012, run against the **production** project (`--project-ref eikkgaocpkhwdgndiupm` or an equivalent `--db-url`). This command only writes rows into the CLI's own tracking table (`supabase_migrations.schema_migrations`) — it does **not** execute the migration SQL again, so there is no risk of re-running `create table`/`create type` against a database that already has them. This directly satisfies the master plan's "without re-applying destructive DDL" constraint.

**Affected files:** none in the repo. One new file to be created: `docs/database-migration-operating-procedure.md`, documenting: how migrations are applied going forward (`supabase db push --linked`, now safe since history is reconciled), why manual SQL-Editor pasting was used historically (per the audit's finding, quoting `RUN_IN_SUPABASE_EDITOR.md`'s own stated reason — no service-role key / no `psql` available at the time), and the rule that every future schema change must be a migration file, committed, and pushed via CLI — never a manual dashboard edit again.

**Test plan:** `supabase migration list --project-ref eikkgaocpkhwdgndiupm` must show `local` = `remote` for 001–012 after the repair; then `supabase db push --linked --dry-run` must report "no new migrations" (proving a real future `db push` would no longer try to recreate existing objects).

**Rollout order:** after 0.1 (so the two security migrations already exist in git before being marked "applied" in the tracking table — purely for narrative consistency, not a technical dependency), before 0.4.

**Rollback:** `supabase migration repair --status reverted <version>` would undo a specific repair entry if a mistake is made — this only affects CLI bookkeeping, never the live schema, so it's low-risk either direction.

---

## Task 0.4 — Safe dependency cleanup

**Method:** `npm audit fix` (no `--force`) — per the audit, this resolves the `qs` and `undici` findings without touching the pinned `next@16.2.10`. The Next.js version bump and its own high-severity advisories are explicitly **out of scope** for this phase (per the master plan: "Do not automatically jump Next.js versions in this step") and will be tracked as a separate, scheduled follow-up task with its own regression pass.

**Affected files:** `package.json`, `package-lock.json` (whatever `npm audit fix` touches — will be inspected via `git diff` before committing, not blindly accepted).

**Test plan:** `npm audit` re-run to confirm the specific `qs`/`undici` advisories are gone; `npm run build`, `npx tsc --noEmit`, `npx eslint .` all re-run to confirm nothing broke; a manual smoke pass through login → browse → apply → partner-approve (the core flow) against the local dev server pointed at `MyDog CI Test` via `.env.local.citest` (per the Testing Environment Policy — this flow creates a real session, a real application row, and changes partner data, so it never runs against production).

**Rollout order:** last in Phase 0, after the migration-history reconciliation, so if anything about the dependency bump interacts badly with local dev, it doesn't block the DB-side work above.

**Rollback:** `git checkout` the two touched files (or revert the commit) and `npm install` again — no DB/runtime state is affected by this task, purely a dependency-lockfile change.

---

## Task 1.1 — Fix dog status enum bug

**Root cause (from the audit):** application code writes the string `"not_available"` to `dogs.status`; the real Postgres enum only has `inactive` (among 7 others), so every such write fails with a `22P02` error. The admin one-click action additionally doesn't check the update's error before writing a "success" row to `activity_logs`.

**Affected files (exact, from the audit's file:line citations):**
- `src/components/admin/DogStatusAction.tsx` — lines 13, 24, 34 (the `"not_available"` string in both the `setStatus` calls and the conditional render). Additionally: add an `if (updateError) { ...surface it, do not proceed to log... }` guard before the `activity_logs` insert (currently absent — this is the file that logs false successes).
- `src/app/admin/dogs/page.tsx` — lines 12, 16, 44 (label map, color map, status-filter chip list).
- `src/app/partner/dogs/page.tsx` — lines 9, 17 (label/color maps).
- `src/app/partner/dogs/[id]/edit/page.tsx` — line 19 (the `STATUSES` dropdown option value). This file already checks `updateError` correctly (per the audit) — no behavior change needed there beyond the string fix itself.

**Change:** replace every `"not_available"` with `"inactive"` (the enum value that already exists and matches the intended meaning). No new enum value, no migration needed.

**Migration impact:** none — pure application-code fix.

**Test plan (manual, per the master plan's explicit 5-point list — run against `MyDog CI Test` via `.env.local.citest`, per the Testing Environment Policy above; a fixture partner + dog will be created once in the CI project for this purpose and reused, not created/destroyed per check):**
1. Partner marks the fixture dog "Nem elérhető" (inactive) via `/partner/dogs/[id]/edit` → DB confirms `status = 'inactive'`.
2. Partner restores it to "Elérhető" (available) → DB confirms `status = 'available'`.
3. Admin marks the fixture dog inactive via the one-click `DogStatusAction` on `/admin/dogs` → DB confirms the change actually happened this time (previously it silently failed).
4. Admin restores it to available via the same button → DB confirms.
5. `/admin/activity` log entries for both admin actions above match the real before/after state — specifically, confirm the *old* failure scenario can no longer occur: force an RLS failure on the same write (e.g. temporarily remove the fixture admin's role in the CI project only) and confirm the new error-guard prevents a false "success" log entry.

**Production:** after deploying, a read-only check only — confirm the four touched pages return 200 and the deployed client bundle no longer contains the string `not_available` (a static, non-mutating check, mirroring how the audit itself detected the original bug in the live bundle). No dog on production has its status changed as part of verifying this fix.

**Automated test (added in 1.2, listed here for traceability):** a dedicated test asserting `dogs.status` can be set to `inactive` and back, that no other string is ever attempted, and that a forced-failure case never produces an `activity_logs` row claiming success.

**Rollout order:** first in Phase 1 — small, isolated, unblocks a real everyday workflow, and its regression test becomes part of the safety net that 1.2 stands up.

**Rollback:** revert the four files; no data migration to undo since no schema changed.

---

## Task 1.2 — Automated tests + CI

**Framework decision:** **Vitest**, for two reasons specific to this codebase: (a) it has first-class ESM/TypeScript support matching this Next.js 16/React 19/strict-TS project with zero extra config compared to Jest, and (b) most of the required tests here are integration tests against a real Supabase project (real HTTP calls to Auth + PostgREST), not component-render tests, so a fast, simple runner matters more than a React-specific testing-library integration — `@testing-library/react` can be added later if/when component-level tests are wanted, but is not needed for this phase's required test list.

**Test database:** the new `MyDog CI Test` Supabase project (ref `zzkudljlyvkjfkjwamcn`), already fully migrated. Tests will use its `anon` key (public, safe to commit to a `.env.test.example` template with a placeholder) for the actual signup/RLS-boundary assertions, and its `service_role` key (secret — GitHub Actions secret only, never committed) for one thing only: cleaning up test-created auth users between runs (`supabase.auth.admin.deleteUser`), mirroring exactly the pattern used safely throughout this audit.

**New files:**
- `vitest.config.ts` — points at a `tests/` directory, loads `.env.test` for local runs.
- `.env.test.example` — committed template (no real secrets) documenting the two required vars: `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY` (both safe/public), plus a note that `TEST_SUPABASE_SERVICE_ROLE_KEY` must be supplied via a local `.env.test` (gitignored) or CI secret, never committed.
- `.env.test` — local-only, gitignored (added to `.gitignore` in this same task), holding the actual CI Test project's anon + service_role keys for running tests from a developer machine.
- `tests/security/profile-role-escalation.test.ts` — the exact 5-case suite already manually verified during the audit for `011_fix_role_privilege_escalation.sql`, encoded as an automated test: self-escalation rejected, cross-user escalation rejected, anonymous rejected, legitimate self-edit (full_name) still works, legitimate admin-grant still works.
- `tests/security/partner-approval-escalation.test.ts` — the equivalent 4-case suite for `012_fix_partner_approval_escalation.sql`: self-approve rejected, self-verify rejected, legitimate field edit still works, legitimate admin-approval still works.
- `tests/security/tenant-isolation.test.ts` — new coverage per the master plan: create two distinct partners (A, B) each with their own member account and one dog; assert Partner A's session cannot update or delete Partner B's dog (expect an RLS rejection, not just "the UI doesn't show a button for it"); assert Partner A's session cannot read Partner B's applications.
- `tests/adoption/application-submission.test.ts`: valid submission persists with correct fields; invalid email format is rejected by the API route; (duplicate-protection case added once 1.6 lands, in the same file, not a separate one, so the two features' tests stay adjacent).
- `tests/dogs/status-transitions.test.ts`: valid enum transitions (`available`↔`inactive`, and at least one other pair) persist correctly; an invalid string is rejected at the DB layer; a forced-failure case never produces a false `activity_logs` success row (the automated version of task 1.1's manual test #5).

**Every test file creates its own throwaway data (uniquely-named per test run, e.g. timestamp-suffixed emails/slugs) and deletes it in an `afterEach`/`afterAll` cleanup using the service-role key** — the same discipline used manually throughout the audit, just automated and pointed at the isolated CI project instead of production.

**Explicit CI admin bootstrap fixture (replaces any ad hoc "just service-role-update a role" pattern):** a single documented helper, `tests/fixtures/adminFixture.ts`, exposing `getOrCreateTestAdmin()`:
1. Looks up a fixed, well-known test-admin email (e.g. `ci-fixture-admin@mydog.test`) in the **CI Test project only**, via the service-role key.
2. If it doesn't exist yet, creates it (service-role `auth.admin.createUser`, pre-confirmed since this is a test fixture, not a real signup) and sets `profiles.role = 'admin'` directly via the service-role key (bypassing RLS deliberately and explicitly, exactly as a fixture-bootstrap step should — this is the **only** place in the entire test suite that sets a role directly rather than going through the app/RLS boundary being tested, and it exists precisely so that tests which need to act *as* a legitimate admin — e.g. "admin can still approve a partner" — have a reproducible, idempotent way to get one, without ever touching production and without conflating fixture setup with the actual assertions).
3. Returns that user's session (signed in normally via `signInWithPassword`, exercising the real login path) for the calling test to use.
4. Is idempotent across runs (looked up by fixed email, not recreated every time) and is documented in the file's own header comment as "test-fixture bootstrap only — never run this against production; production admin grants must only ever happen through the real, already-tested `requireAdmin()`/RLS path."

This fixture is used by every security test that needs a legitimate-admin actor (e.g. "admin can approve a partner," "admin can grant another user's role"); it is never used to *test* the escalation-prevention logic itself (those tests use ordinary, freshly-signed-up non-admin users, exactly as the audit's manual reproduction did).

**CI:** `.github/workflows/ci.yml` — triggers on push and PR to `main` (and this phase's own branch). Steps: checkout → `npm ci` → `npx eslint .` → `npx tsc --noEmit` → `npm run test` (Vitest, using the CI-project secrets injected as env vars) → `npm run build`. Any step failing blocks the rest (standard fail-fast), matching the master plan's "install, lint, typecheck, test, build" minimum.

**Secrets to add to the GitHub repo** (`Ricso000/mydog`, confirmed as the remote in the audit): `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_SUPABASE_SERVICE_ROLE_KEY` — all scoped to the CI Test project only, **never** the production project's keys. This will need `gh secret set` (or the product owner adding them via the GitHub UI) — will be called out explicitly at implementation time, since writing repo secrets is a real action worth a heads-up even though it targets only the throwaway test project.

**Test plan for this task itself:** the CI workflow file is validated by actually opening the PR at the end of the phase and observing it run (not just written and assumed correct).

**Rollout order:** stood up in parallel with 1.1 (its first tests cover 1.1's fix), and grows as each subsequent task (1.4, 1.6) adds its own test file — not a single one-shot task done once and never touched again during this phase.

**Rollback:** the whole test/CI addition is net-new and additive — reverting it means deleting the `tests/`, `vitest.config.ts`, and workflow file, with zero effect on the running application either way.

---

## Task 1.3 — Fix all 5 current ESLint errors

**Exact locations (from the audit's `16-test-and-build-report.md`):**
1. `src/app/admin/dashboard/page.tsx:24` — `Date.now()` called during render (impure). Fix: compute the 30-day cutoff once, outside the render path that's re-evaluated per request — since this is a Server Component, the simplest correct fix is moving the `new Date(Date.now() - ...)` computation to the top of the async function body (it already runs once per request server-side; the lint rule is about render-purity for the *component* render itself, not about the request-scoped async data-fetch — will confirm the exact idiomatic fix at implementation time by checking whether this specific line is inside the data-fetching `Promise.all` call or in the JSX-returning portion of the component).
2. `src/app/bobilos-utazas/page.tsx:194` — raw `"` → `&quot;` (or equivalent JSX-safe escape).
3. `src/app/partner/applications/page.tsx:62` — `useEffect(() => { load(); }, [load])` triggers a lint rule about synchronous `setState` inside an effect. Fix will follow the React team's own recommended pattern for "fetch on mount" effects (the rule's own linked guidance) without changing the page's actual behavior — this needs the smallest change that satisfies the rule, not a data-fetching-architecture rewrite of a page that otherwise works correctly per the audit.
4. `src/app/rolunk/page.tsx:59` — raw `"` → escaped equivalent.
5. `src/components/Footer.tsx:69` — same fix.

**Affected files:** exactly the 5 above.

**Test plan:** `npx eslint .` → 0 errors (not just "fewer"); `npm run build` still passes; manual smoke check of the admin dashboard stat tile (touched by fix #1) and the partner applications page (touched by fix #3) to confirm no behavior regression from what the audit found working.

**Rollout order:** can run any time during Phase 1 — fully independent of the other tasks; scheduled here (after 1.1/1.2 start) so the new CI pipeline's lint step goes green as soon as it's turned on rather than starting red.

**Rollback:** trivial, five independent small diffs, revertible individually if any one fix turns out to have an unexpected side effect.

---

## Task 1.4 — Password reset

**Prerequisite (new finding from this planning pass, must happen first):** fix production Auth's `site_url` (currently `http://localhost:3000`) and populate `uri_allow_list` with the real production URL (`https://rescueconnect-nu.vercel.app`) plus a wildcard for Vercel preview deployments if desired. Done via the Supabase Management API's auth-config endpoint (the same one used to read the current — broken — values during this planning pass) or the dashboard. Without this, **no** confirmation or recovery email link would ever redirect correctly in production, regardless of anything else built in this task or task 1.7.

**Flow (leveraging the already-configured "Reset your password" template — no new Resend email needed):**
1. `src/app/bejelentkezes/page.tsx` — add an "Elfelejtetted a jelszavad?" link.
2. New page `src/app/jelszo-visszaallitas/page.tsx` (request step) — email input, calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: <site-url>/jelszo-visszaallitas/uj-jelszo })`.
3. New route `src/app/auth/callback/route.ts` (shared with task 1.7's confirmation flow — see below) — a Next.js Route Handler that exchanges the code Supabase sends back for a real session using the server Supabase client (`@supabase/ssr`'s standard `exchangeCodeForSession` pattern), then redirects onward based on the link's purpose (recovery → the "set new password" page; signup confirmation → task 1.7's landing logic).
4. New page `src/app/jelszo-visszaallitas/uj-jelszo/page.tsx` (set-new-password step) — requires the recovery session established by the callback route above; calls `supabase.auth.updateUser({ password })`; on success, redirects to `/bejelentkezes` with a success message.

**Affected files:** `src/app/bejelentkezes/page.tsx` (add link), 3 new pages/routes as listed above.

**Acceptance criterion (revised per product-owner direction — behavioral, not implementation-detail-shaped):** the required end-to-end assertion is the real user-visible flow, not an internal claim about "exactly one update per session":
1. Request a reset for a known test account → a recovery email is triggered.
2. Follow the recovery link/session → land on the set-new-password screen with a valid recovery session.
3. Set a new password → succeeds.
4. Attempt to log in with the **old** password → fails.
5. Log in with the **new** password → succeeds.

This full 5-step sequence is what both the automated test (against the CI Test project, using its admin API to simulate step 2's link-follow without a real email round-trip) and the one real-mailbox manual pass (against production, per the Testing Environment Policy's narrow exception, using an account the product owner controls) must satisfy — not a narrower technical claim about session/token reuse internals.

**Rollout order:** after the `site_url` fix (a prerequisite, effectively "task 1.4a"); can proceed in parallel with 1.1–1.3.

**Rollback:** the `site_url`/`uri_allow_list` fix is a pure widening (adding the real production URL) with no way to break the already-broken localhost-only state further; the 4 new files are additive and don't touch any existing page's behavior beyond the one added link on the login page.

---

## Task 1.5 — Rate limiting and anti-abuse

Per product-owner direction, documented here as three **explicitly distinct layers**, each with a different job, different mechanism, and different blast radius — not blended together:

### Layer 1 — Vercel Firewall: IP-based / volumetric protection at the edge

Job: stop raw request-volume abuse (scripted flooding) before it ever reaches application code. Confirmed working on the current Vercel plan during this planning pass (a test rate-limit rule was successfully staged and discarded). Mechanism: a custom rule on `/api/applications` — `path starts with /api/applications`, action `rate_limit`, keyed by `ip`, a conservative window (e.g. 5 requests per 10 minutes per IP, tuned to avoid blocking a normal shared-IP household submitting a couple of real applications, per the master plan's explicit "avoid blocking normal households on shared IPs" instruction) — created via `vercel firewall rules add` and **published** (not left as an unpublished draft, unlike the throwaway probe rule created and discarded during this planning pass). This layer knows nothing about dogs, emails, or applications — it only counts requests per IP per path.

**Architectural limit that confines this layer's reach (important, stated plainly):** Supabase Auth calls (`signInWithPassword`, `signUp`) go directly from the browser to `*.supabase.co`, bypassing our own Next.js server entirely — so this layer **cannot** protect login/signup at all; only `/api/applications` (a real request to our own domain) is in its reach.

### Layer 2 — Application logic: business-rule and content-shaped protection

Job: everything that requires understanding the *content* of a request, which the edge-level Firewall (layer 1) cannot see or reason about. Lives entirely in `src/app/api/applications/route.ts` and `src/components/ContactForm.tsx`:
- **Duplicate-application protection** (the specific business rule from task 1.6 — same dog + same identity within a time window) — this is a business rule, not a volumetric one, and could never be expressed as an IP-based Firewall rule (a legitimate household on one IP should be able to apply for *different* dogs; an attacker rotating IPs but reusing the same email/dog pair should still be caught) — detailed fully in task 1.6, listed here only to make the three-layer taxonomy complete.
- **Message-length cap:** an explicit cap on the application's free-text `message` field (exact number decided at implementation time from real seed/test message lengths for a sane default), plus confirming (not assuming) Next.js's platform-default request-body-size limit is still in effect.
- **Honeypot:** a hidden, CSS-off-screen extra form field on the public contact form that real browsers never fill in; if populated on submit, the API route silently accepts the request (HTTP 200) but does not create a real row — this avoids tipping off a scripted attacker that they were detected, while adding zero friction for real users.

### Layer 3 — Supabase Auth's own built-in limits: login/signup/email-auth rate limits

Job: the *only* layer that can meaningfully constrain login/signup abuse, precisely because layer 1 cannot reach those calls at all (see the architectural limit above) and layer 2 lives in *our* API route, not Supabase's Auth server. Already partially configured on production (confirmed via the Management API's auth-config endpoint during this planning pass): `rate_limit_email_sent = 2`/hour (caps confirmation/recovery email volume — directly relevant to tasks 1.4 and 1.7), plus `rate_limit_anonymous_users`, `rate_limit_otp`, `rate_limit_verify`, each currently at Supabase's defaults. This task will review each of these four values against realistic expected traffic and **document** the reviewed value (changed or deliberately left at default) rather than silently trusting them — this is a review-and-document action on existing Supabase project configuration, not new code.

**Affected files:** `src/app/api/applications/route.ts` (message-length cap, honeypot-field check — layer 2), `src/components/ContactForm.tsx` (hidden field — layer 2). The Vercel Firewall rule (layer 1) and the Supabase Auth rate-limit review (layer 3) are both infrastructure/config, not repo files — both will be documented in the phase report with their exact parameters for reproducibility (the Firewall rule's condition/action/thresholds; the four Auth rate-limit values before and after review), so neither is "invisible" infrastructure.

**Test plan:** layer 1 — scripted rapid-fire requests against `/api/applications` using a deliberately nonexistent `dogId`, so every request that *does* reach the app resolves as a clean 404 with no DB write regardless of which environment (preview or production) is targeted — this lets the Firewall-throttling behavior be confirmed against the real production edge (where the published rule actually lives) without ever creating a real row, satisfying both "test the real thing" and the Testing Environment Policy's no-state-change rule simultaneously. Layer 2 — automated: a honeypot-filled submission returns 200 but produces zero DB row in the CI Test project; a legitimate single submission is unaffected; message-length cap rejects an oversized message with a friendly error. Layer 3 — read-only verification that the reviewed values are what was decided (via the same Management API read used to discover them).

**Rollout order:** after 1.1–1.4 are stable (it touches the same API route as 1.6, so sequenced immediately before 1.6 to avoid two people's mental model of that file diverging mid-phase — in this case just sequencing within one implementer's own work, but keeping the two related changes adjacent).

**Rollback:** the Firewall rule can be un-published/discarded independently of any code change; the honeypot field and message-length cap are small, isolated diffs in two files.

---

## Task 1.6 — Duplicate application protection

**Confirmed live-exploitable in the audit:** 3 identical submissions (same dog, same email) all succeeded with zero pushback.

**Design:** in `src/app/api/applications/route.ts`, before inserting, query for an existing `adoption_applications` row matching `dog_id` + normalized `contact_email` (lower-cased, trimmed) — or `applicant_id` when the requester is authenticated, which is a stronger identity signal than a self-reported email — created within a defined recent window (e.g. 24 hours), whose `status` is not already `rejected`/`withdrawn` (a person should be able to re-apply after a rejection or their own withdrawal, just not spam-resubmit the same pending request). If found, return a friendly, already-localized response (e.g. `{ error: "Már beküldtél egy jelentkezést erre a kutyára, hamarosan jelentkezik a menhely." }`) with an appropriate non-200 status the `ContactForm.tsx` client can display as-is (it already has an error-display path for non-ok responses) — **not** a raw Postgres error surfaced to the user, per the master plan's explicit instruction.

**Defense in depth:** in addition to the app-layer check, a partial unique index will be evaluated at implementation time (e.g. on `(dog_id, lower(contact_email))` — deliberately *not* time-windowed at the DB level, since Postgres partial/unique indexes can't easily express "unique within a rolling time window," only "unique full stop" or "unique per some other partitioning column" — if a hard forever-unique constraint turns out to be too strict for legitimate re-applications after a long gap or after adoption of a returned dog, the app-layer time-windowed check alone will be the shipped mechanism, and this trade-off will be written up plainly in the phase report rather than silently deciding one way).

**Affected files:** `src/app/api/applications/route.ts` (the duplicate check + friendly response), `src/components/ContactForm.tsx` (only if the existing error-display path needs any adjustment to show this specific message well — expected to need none, since it already renders `data?.error` generically).

**Test plan:** automated — the exact audit scenario (3 rapid identical submissions) now expected to produce exactly 1 real row and 2 friendly rejections, not 3 rows; a submission for the *same dog* by a *different* email still succeeds (proving the fix doesn't over-block); a submission for a *different dog* by the *same* email still succeeds; a re-submission after the matching prior application's status is `rejected` succeeds (proving legitimate re-application isn't blocked).

**Rollout order:** immediately after 1.5 (shares the same file).

**Rollback:** isolated to one file's logic plus an optional index; reverting the index (if added) is a one-line `drop index` migration.

---

## Task 1.7 — Email verification (decision: implement real confirmation, Option A)

**Config change (via Supabase Management API/dashboard, prerequisite already covered by 1.4's `site_url`/`uri_allow_list` fix):** set `mailer_autoconfirm = false` on the **production** project. (The CI Test project's own `mailer_autoconfirm` will likely stay `true` for most tests' convenience, with one dedicated test specifically exercising the confirmation-required path against a project where it's toggled off, or against production directly for that one specific assertion — exact approach to be finalized at implementation time so the bulk of the test suite isn't slowed down by a real email round-trip.)

**Regular user registration (`src/app/regisztracio/page.tsx`):** after `signUp()`, since `session` will now be `null` until confirmed, replace the current immediate `router.push('/profil')` with a "Nézd meg az emailed a fiók aktiválásához" confirmation-pending screen. Login (`src/app/bejelentkezes/page.tsx`) needs to recognize Supabase's "email not confirmed"-shaped error and show a Hungarian message with a "küldd újra a megerősítő emailt" (resend) action calling `supabase.auth.resend({ type: 'signup', email })`.

**Partner registration (`src/app/partner/register/page.tsx`) — the flow that actually requires redesign, per the confirmed decision to accept this cost:**
1. On submit, call `signUp()` with the organization's form data stashed entirely in `options.data` (Supabase's `user_metadata`, which already carries `full_name` today and can carry the rest — `partner_name`, `partner_type`, `country`, `city`, `phone`, `website`, `short_description` — as additional JSON fields, plus a marker `pending_partner_registration: true`) instead of immediately inserting into `partners`. Show the same "check your email" pending screen as the regular flow.
2. The shared `src/app/auth/callback/route.ts` (built in task 1.4), once it establishes a real post-confirmation session, checks the metadata marker and, if set, attempts the deferred `partners` insert.

**Idempotency — revised per product-owner direction, not solely reliant on clearing the metadata flag:** clearing `pending_partner_registration` after insert is a read-then-act sequence that is **not** atomic against a genuine race (a double-clicked email link, a browser retry, or two tabs both landing on the callback simultaneously could both read the flag as still `true` before either clears it, each attempting an insert). The actual safety net is a **new, tiny migration** adding a real database-level uniqueness guarantee:

```sql
-- 013_partner_registration_idempotency.sql
alter table partners add column created_by_user_id uuid references profiles(id);
create unique index partners_created_by_user_id_unique
  on partners (created_by_user_id)
  where created_by_user_id is not null;
```
(A *partial* unique index, so it only constrains rows where the column is set — every existing partner keeps `created_by_user_id = null` and is entirely unaffected; Postgres treats multiple `NULL`s as distinct, so this adds a new invariant going forward without touching historical data.) This encodes the product rule "at most one self-registered partner org per creating user, via this deferred-confirmation flow" — the callback's insert becomes:

```ts
const { data, error } = await supabase
  .from("partners")
  .insert({ ...fieldsFromMetadata, created_by_user_id: user.id })
  .select()
  .maybeSingle();
if (error?.code === "23505") {
  // unique violation: a partner from this pending registration already exists
  // (concurrent callback invocation) — look it up instead of erroring.
  const existing = await supabase.from("partners").select("id").eq("created_by_user_id", user.id).single();
  // redirect using existing.data.id
} else if (error) {
  // a genuinely unexpected error — surface it, do not silently continue
}
```
This is atomic at the database layer regardless of how many concurrent requests race — at most one insert can ever succeed for a given `created_by_user_id`, and every other concurrent/retried attempt cleanly detects the conflict and redirects to the already-created partner instead of erroring or duplicating. Clearing the metadata flag afterward remains a good-hygiene cleanup step (so the callback doesn't re-attempt the insert path pointlessly on a third, later visit) but is no longer the *safety mechanism* — the unique index is.

3. `on_partner_created` (the existing trigger that auto-adds the creator as `owner` in `partner_members`, from migration `002`) is untouched — it fires exactly as before, just later in wall-clock time (after confirmation instead of immediately after signup), which has no functional difference for anything downstream, and only ever fires once per the same uniqueness guarantee (the trigger fires per successful `partners` insert, and now at most one such insert can ever succeed per user via this flow).

**Affected files:** `src/app/regisztracio/page.tsx`, `src/app/bejelentkezes/page.tsx`, `src/app/partner/register/page.tsx`, `src/app/partner/login/page.tsx` (same "resend confirmation" affordance as the regular login), `src/app/auth/callback/route.ts` (shared with 1.4, extended with the partner-metadata branch described above). **Migration needed** (revised from the original "no migration needed" — superseded by the idempotency requirement above): `supabase/migrations/013_partner_registration_idempotency.sql`, applied first to the CI Test project (for the automated test below) and, once verified, to production as part of this task's rollout.

**Test plan:** automated — signup with confirmation pending correctly blocks immediate `/profil`/`/partner/dashboard` access (no session yet); confirming (simulated in tests via the CI-project's admin API, which can mark a user confirmed without a real email round-trip) then correctly creates the deferred `partners` row with the right fields and redirects appropriately; **a dedicated concurrency test** that fires the callback's insert logic twice in parallel (simulating the double-click/race scenario) for the same confirmed user and asserts exactly one `partners` row exists afterward, both calls resolve to the same partner id, and neither raises an unhandled error. Manual: one real end-to-end pass with a real inbox for both the regular-user and partner-registration confirmation emails, run against production after this task is fully live, per the Testing Environment Policy's one narrow exception.

**Rollout order:** last in Phase 1 — depends on 1.4's callback-route scaffolding and the `site_url` fix, and is the highest-effort/highest-risk item in this phase (a genuine flow redesign, not a toggle), so it gets the most implementation time and the most careful manual verification before the phase is called done.

**Rollback:** if this task's redesign turns up an unforeseen problem during implementation, the safest rollback is reverting `mailer_autoconfirm` to `true` on production (an instant, fully reversible config flip) while leaving the new deferred-registration code in place but effectively dormant (since with autoconfirm back on, a session exists immediately again and the callback-route branch simply never gets exercised in the no-confirmation-required path) — this means the code changes themselves don't need to be reverted under time pressure, only the one Auth config toggle, which keeps the rollback fast and low-risk.

---

## Overall rollout order for Phase 0 + Phase 1

1. 0.1 (commit existing artifacts) → establishes the branch's honest starting point.
2. 0.2 (confirm backups) — independent, can run any time, done early to surface a possible escalation ASAP.
3. 0.3 (reconcile migration history) — independent of app code.
4. 1.1 (dog status enum fix) + 1.2 (test framework + CI, starting with 1.1's regression tests) — done together since 1.2's first real tests are 1.1's.
5. 1.3 (lint fixes) — any time after 1.2's CI exists, so CI goes green rather than starting red.
6. 0.4 (safe `npm audit fix`) — after the above, so a dependency-lockfile change doesn't get blamed for unrelated in-flight work.
7. 1.4 (password reset) — including its `site_url`/`uri_allow_list` prerequisite fix.
8. 1.5 + 1.6 (rate limiting + duplicate protection) — same file, done back to back.
9. 1.7 (email verification) — last, highest-effort, depends on 1.4's callback route.
10. Final full manual E2E pass (register → partner register → admin approval → dog upload → public visibility → application → partner review), all Gate-A-relevant automated tests green, PR opened.

## Rollback considerations (phase-level)

Every individual task above lists its own rollback. At the phase level: since this all lives on a dedicated branch with a PR at the end (per the confirmed git workflow), the ultimate rollback for anything found problematic after merge is a standard revert of the merge commit — nothing in this plan touches production data destructively (the two already-applied security migrations predate this plan and are not being redone; the new CI project is fully isolated; the `mailer_autoconfirm`/`site_url` Auth config changes are both single-flag, instantly-reversible toggles). The one item that would be operationally awkward to roll back quickly is task 1.7's partner-registration redesign if it shipped and several real partners were mid-flow when a rollback happened — mitigated by 1.7's own note above (reverting just the Auth-config toggle, not the code, is enough to restore the old effective behavior instantly).
