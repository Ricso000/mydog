# 19 — Top Launch Blockers

Ranked by business impact × how directly it blocks a public Hungarian launch, drawing on reports 01–17. Items marked "RESOLVED THIS AUDIT" were found and fixed live during this session, with fix verification — they're kept in the list (not deleted) per the audit's own completion criteria, but their remaining action is "confirm and move on," not "go fix this."

## 1. `profiles.role` self-service admin escalation — **RESOLVED THIS AUDIT**
- **Problem:** any registered user could grant themselves `admin` via a direct API call, no exploit tooling needed.
- **Business impact:** total loss of platform integrity — an attacker with admin access can approve fraudulent shelters, alter/delete any data, or use the admin panel as a foothold for further abuse, all while looking like a legitimate admin action in every log.
- **Technical cause:** RLS `UPDATE` policy on `profiles` restricted which row could be touched, not which columns — a documented Postgres RLS semantics gap (report 12 §1).
- **Affected files:** `supabase/migrations/001_initial_schema.sql:297`, `004_admin_portal.sql:9-11`.
- **Dependency:** none — self-contained DB fix.
- **Resolution:** `supabase/migrations/011_fix_role_privilege_escalation.sql` (BEFORE UPDATE trigger), applied to production, verified with a 5-case test suite (report 12 §1).
- **Effort:** Done (was ~1 hour including verification).
- **Sequencing:** N/A — already shipped.

## 2. `partners.status`/`verified` self-service approval — **RESOLVED THIS AUDIT**
- **Problem:** any newly self-registered shelter could approve and "verify" itself, bypassing admin review entirely, making its dogs instantly public.
- **Business impact:** undermines the core trust promise of the marketplace — adopters are told shelters are vetted; this bug meant that promise was enforceable by nothing.
- **Technical cause:** identical root cause to #1, on `partners` (report 12 §1b).
- **Affected files:** `supabase/migrations/001_initial_schema.sql:303`.
- **Dependency:** none.
- **Resolution:** `supabase/migrations/012_fix_partner_approval_escalation.sql`, verified with a 4-case test suite (report 12 §1b, report 05 §5).
- **Effort:** Done.
- **Sequencing:** N/A — already shipped.

## 3. Broken dog-status enum (`not_available`) — admin AND partner status changes fail
- **Problem:** hiding/marking-unavailable a dog fails with a raw Postgres error on both the admin one-click button and the partner's own dog-edit page; the admin path additionally logs a **false success** to the audit trail.
- **Business impact:** shelters cannot pull a dog from public listing through the product at all (e.g. once reserved offline, or if a listing needs to be paused) — they'd have to ask for manual DB intervention. The false audit-log entries also mean the admin activity log cannot currently be trusted for this action class.
- **Technical cause:** application code writes the string `"not_available"`, but the real `dog_status` Postgres enum has no such value (only `inactive`, among 8 others) — reports 02, 03, 05, 06.
- **Affected files:** `src/components/admin/DogStatusAction.tsx:13,24,34`; `src/app/admin/dogs/page.tsx:12,16,44`; `src/app/partner/dogs/page.tsx:9,17`; `src/app/partner/dogs/[id]/edit/page.tsx:19`.
- **Dependency:** none — pure application-code fix (replace the string, no migration needed since `inactive` already exists in the enum).
- **Suggested fix:** replace `"not_available"` with `"inactive"` in all four files' status maps/values; additionally add `.error` checking to `DogStatusAction.tsx` (currently the only status-change action anywhere in the app that doesn't check the update result) so a future similar mismatch fails loudly instead of writing a false activity-log entry.
- **Effort:** XS (string fix) + XS (error-check addition) — under half a day total including a manual retest of both admin and partner paths.
- **Sequencing:** Do immediately after this audit — it's small, isolated, and currently blocks a real, everyday partner workflow.

## 4. Broken shelter-discovery path (`/menhelyek` is fake, real page is unreachable)
- **Problem:** the one static "browse shelters" page has fabricated data and links to a `/menhelyek/{id}` route that 404s; the real, working, Supabase-backed shelter page (`/partners/[slug]`) exists but has no index/browse page pointing to it.
- **Business impact:** a real, working feature is completely undiscoverable by ordinary visitors — the "how many menhelyek do you actually have" story a visitor sees (fake "2 500+ menhely" copy, report 03 §4) directly contradicts the real 3-partner seed dataset the moment they try to browse, and then hits a 404 besides.
- **Technical cause:** `/menhelyek/page.tsx` never queries Supabase at all (report 02 §1, 10 §4).
- **Affected files:** `src/app/menhelyek/page.tsx`, `src/app/fajtamentok/page.tsx` (same broken link pattern).
- **Dependency:** none — `/partners/[slug]` already works and just needs a real index page linking to it, filtered by `partners.type` (the admin panel already has working code for this exact filter to copy the pattern from, `src/app/admin/partners/page.tsx:33`).
- **Effort:** S (a day or two to build a real, Supabase-backed partner index page reusing the existing query pattern).
- **Sequencing:** Before public launch — this is one of the most visible, easily-noticed gaps a real visitor will hit in their first five minutes on the site.

## 5. Seven static marketing pages with fabricated stats and dead forms/buttons
- **Problem:** `/rolunk`, `/szolgaltatasok`, `/onkentesek`, `/gyerekeknek`, `/fajtamentok`, `/bobilos-utazas` (plus `/menhelyek`, counted separately above) show invented numbers ("18 450+ kutya", "8 000+ önkéntes") against a real 12-dog dataset, and contain forms/buttons (contact form, volunteer signup, quiz/story buttons, app-store links) with no `onSubmit`/`href`/handler at all.
- **Business impact:** credibility risk at scale — any visitor who reads the page copy, then browses real dogs/shelters, or tries to submit a form, will immediately notice the platform is far smaller than claimed and that basic interactions silently do nothing. For a launch aiming at real adopters and real shelters, this is a first-impression risk, not a cosmetic nitpick.
- **Technical cause:** these pages were built with placeholder content and never wired up (reports 02 §7, 11).
- **Affected files:** the 6-7 pages listed above.
- **Dependency:** none individually, though the volunteer form and contact form would need a real backend (a table + insert path) if they're to actually work rather than just be removed/hidden.
- **Effort:** M — realistically a page-by-page pass: replace fabricated numbers with real (small, honest) ones or remove the stat blocks; remove or genuinely wire every dead form/button; fix the two 404 links (shared with blocker #4).
- **Sequencing:** Before public launch, in parallel with #4.

## 6. No password-reset flow
- **Problem:** a user who forgets their password has zero self-service recovery path.
- **Business impact:** guaranteed support burden and user lockout the moment real users start signing up at any volume — this isn't a hypothetical, it's a certainty for any consumer auth product.
- **Technical cause:** `resetPasswordForEmail` (a standard Supabase Auth call) is simply never wired into any page (report 12 §2).
- **Affected files:** would touch `src/app/bejelentkezes/page.tsx` (add a link) + a new reset-request page + a new reset-confirmation page.
- **Dependency:** requires `RESEND_API_KEY` or Supabase's own auth email to be configured for the reset-link email — already resolved for Resend in Production (report 15 §2), and Supabase Auth's built-in password-reset email is a separate, likely-already-available channel not requiring the app's own Resend integration at all (NOT_VERIFIED whether Supabase's own auth-email templates are enabled at the project-config level, per report 14's own caveat — worth checking first, as it may need zero new app code beyond a link and two pages).
- **Effort:** S (roughly 1-2 days).
- **Sequencing:** Before public launch — table-stakes for any auth system accepting real users.

## 7. No rate limiting anywhere (compounds several other risks)
- **Problem:** signup, login, and the public adoption-application endpoint have zero throttling, CAPTCHA, or abuse protection.
- **Business impact:** (a) unlimited scripted account creation, which combined with auto-confirmed signups (no real mailbox needed) makes any future privilege-escalation-style bug trivially automatable at scale; (b) the public application form can be used as a free outbound-email-spam relay against arbitrary third-party addresses via the "applicant confirmation" email, risking the platform's own sending domain's reputation; (c) unlimited duplicate-application spam against real shelter inboxes (confirmed live-reproducible, report 06 — 3/3 duplicate submissions for the same dog+email succeeded with zero pushback).
- **Technical cause:** no rate-limiting library, middleware, or per-route counter exists anywhere (report 12 §3, §15; report 15 §6).
- **Affected files:** would touch `src/proxy.ts` (or a new dedicated layer) plus `src/app/api/applications/route.ts` specifically.
- **Dependency:** a rate-limiting service/library decision (e.g. Upstash Redis + `@upstash/ratelimit`, or Vercel's own WAF/rate-limiting product if available on the current plan — NOT_VERIFIED in this audit).
- **Effort:** S–M depending on chosen approach.
- **Sequencing:** Before public launch, at minimum for `/api/applications` and signup/login; can be layered in incrementally afterward for other surfaces.

## 8. Unconfirmed/possibly-absent database backups
- **Problem:** per a user-reported Supabase dashboard screenshot this session, the production project showed "No backups" as of 2026-09-06; this audit could not independently confirm or deny it via CLI.
- **Business impact:** if true, a single bad migration, accidental bulk delete, or Supabase-side incident would be **unrecoverable** — total, permanent data loss for every partner, dog, and application in the system.
- **Technical cause:** likely a Supabase plan/tier setting (point-in-time recovery / backup retention is often a paid-tier feature) rather than an application bug.
- **Affected files:** none — this is a Supabase project setting, not application code.
- **Dependency:** may require a Supabase plan upgrade.
- **Effort:** XS to verify the current setting; cost/plan-dependent to enable if currently off.
- **Sequencing:** **Verify before launch, today if possible** — this is the cheapest, highest-leverage item on this entire list to check, and the consequence of it being true and unaddressed is total data loss.

## 9. Ten high-severity `npm audit` findings, concentrated in the pinned Next.js version
- **Problem:** `next@16.2.10` (the exact pinned version) has multiple high-severity advisories including a middleware/proxy bypass, SSRF in Server Actions, and unauthenticated disclosure of internal Server Function endpoints; `postcss`, `sharp`, and `undici` sub-dependencies add further high/moderate findings.
- **Business impact:** unknown-but-nonzero exploitability against a production Next.js app that (per report 01) relies on `src/proxy.ts` as a real authorization boundary for `/admin/*` and `/partner/*` — a middleware/proxy-bypass advisory specifically in the version this app depends on for that exact mechanism warrants a direct look, not just a generic "keep dependencies updated" note.
- **Technical cause:** version pinned at `16.2.10`; fixes are available at `16.3.4` (outside the currently stated dependency range) or via non-`--force` fixes for `qs`/`undici` (report 12 §14).
- **Affected files:** `package.json`.
- **Dependency:** a Next.js minor-version bump needs its own regression pass (build + manual smoke test of the auth-gated routes at minimum, given zero automated tests exist — see blocker #10) before shipping.
- **Effort:** S (the safe `npm audit fix`, no `--force`) immediately; separately, M (Next.js version bump + manual regression) on its own schedule.
- **Sequencing:** Run the safe fix now; schedule the Next.js bump as an early post-launch or pre-launch task depending on how directly the specific middleware-bypass advisory applies to this app's proxy-based auth model (worth a focused 30-minute read of that specific advisory before deciding urgency).

## 10. Zero automated tests, zero CI/CD gate
- **Problem:** no test framework, no test files, no CI pipeline exists at all (report 01 §11, report 16).
- **Business impact:** every future change — including the very fixes this audit recommends — ships on manual testing alone; given the CRITICAL bugs already found in existing, previously-shipped code (findings #1/#2 above), this is not a hypothetical risk, it's a demonstrated one. A regression in RLS policy or route-guard logic could ship silently.
- **Technical cause:** never set up (report 01).
- **Affected files:** would be new (`vitest`/`playwright` + a `.github/workflows/` CI file).
- **Dependency:** none blocking, but meaningfully benefits from picking a small, high-value initial test surface (auth/RLS boundary tests would have caught both CRITICAL findings in this audit before they ever shipped).
- **Effort:** M–L to stand up meaningfully (a handful of RLS/auth-boundary tests plus a CI gate is a reasonable initial scope, not full coverage).
- **Sequencing:** Start in parallel with the P0 fixes above, prioritizing tests for exactly the two escalation bugs just fixed (so they can never silently regress) plus the dog-status-enum fix — this is the highest-leverage initial test investment given what this audit found.

## Not included above (by design)

Foundation/Club/donation/service-marketplace/payment-related gaps are deliberately **not** ranked here as launch blockers, per report 18's defer analysis — they are P1/P2 scope, not core-marketplace-breaking bugs, unless the go-to-market plan specifically promises one of them at launch (in which case, treat the relevant row from report 17's gap matrix as blocker-equivalent).
