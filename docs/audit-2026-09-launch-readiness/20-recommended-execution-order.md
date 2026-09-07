# 20 — Recommended Execution Order

Sequenced from the findings in reports 01–19. No implementation was performed as part of producing this roadmap (beyond the two CRITICAL security fixes already applied and verified during this audit, per reports 12/19 #1–#2). Each task lists priority, dependency, expected impact, effort, affected areas, and how to verify it's actually done (not just merged).

## Phase 0 — Unblock launch (do first, small and isolated)

| Task | Priority | Dependency | Expected impact | Effort | Affected areas | Verification criteria |
|---|---|---|---|---|---|---|
| Confirm/enable Supabase database backups | P0 | None | Removes total-data-loss risk | XS | Supabase project settings only | Screenshot/CLI confirmation of an active backup schedule; document the retention window |
| Fix `not_available`→`inactive` enum mismatch (4 files) + add error-checking to `DogStatusAction.tsx` | P0 | None | Restores a broken everyday partner/admin workflow (hide/unhide a dog); stops false audit-log entries | XS | `src/components/admin/DogStatusAction.tsx`, `src/app/admin/dogs/page.tsx`, `src/app/partner/dogs/page.tsx`, `src/app/partner/dogs/[id]/edit/page.tsx` | Manually toggle a test dog to "Nem elérhető" via both the admin button and the partner edit page; confirm the DB actually updates (service-role read) and the activity log entry is only written on real success |
| `npm audit fix` (non-`--force` only) | P0 | None | Resolves `qs`/`undici` moderate/high findings with no breaking risk | XS | `package.json`/lockfile | Re-run `npm audit`; confirm those specific advisories are gone; re-run `npm run build` to confirm nothing broke |
| Confirm the two applied security migrations are documented/communicated to the dev team | P0 | Already done (011, 012) | Ensures the team doesn't accidentally revert or conflict with these fixes | XS | `supabase/migrations/011_*.sql`, `012_*.sql` | Team acknowledgment; migrations committed to the repo (confirm they're in git, not just applied live) |
| Reconcile Supabase CLI migration history with the live schema | P1 (operational, not user-facing) | None | Makes future `supabase db push` safe again | S | Supabase CLI migration tracking only | `supabase migration list` shows non-empty `remote` values matching `local` for 001–012 |

## Phase 1 — Core marketplace (visible, credibility-critical fixes)

| Task | Priority | Dependency | Expected impact | Effort | Affected areas | Verification criteria |
|---|---|---|---|---|---|---|
| Build a real, Supabase-backed shelter index page (fix `/menhelyek`, wire to `partners` filtered by `type`, reuse the admin panel's existing filter-by-type query pattern) | P0 | None (`/partners/[slug]` already works) | Makes an existing, working feature (shelter profile pages) actually discoverable | S | `src/app/menhelyek/page.tsx` (rewrite), possibly `src/app/fajtamentok/page.tsx` (same fix) | Live click-through from the new index page to at least 3 real partner profiles, each showing real data; no 404s |
| Replace fabricated stats + dead forms/buttons across the 6 remaining static pages | P0 | None | Removes the single biggest first-impression credibility risk found in this audit | M | `/rolunk`, `/szolgaltatasok`, `/onkentesek`, `/gyerekeknek`, `/fajtamentok`, `/bobilos-utazas` | Every stat block reflects real or honestly-labeled ("growing community" style) copy; every visible form either submits somewhere real or is removed; every button either does something or is removed/labeled "coming soon" |
| Add password-reset flow | P0 | Check whether Supabase's built-in auth-email templates are already enabled (may reduce scope) | Removes guaranteed user-lockout/support-burden risk | S | `src/app/bejelentkezes/page.tsx` + 2 new pages | A real user can request a reset, receive an email (verify in a real inbox, not just code-path), and successfully set a new password |
| Add rate limiting to signup, login, and `/api/applications` at minimum | P0 | Pick a provider (Upstash/Vercel WAF/other) | Closes the account-creation-abuse and email-spam-relay risks | S–M | `src/proxy.ts` or new middleware layer, `src/app/api/applications/route.ts` | Scripted rapid-fire requests against each surface get throttled/rejected after a reasonable threshold; legitimate single-user usage is unaffected |
| Add duplicate-application protection (per dog + email/applicant) | P1 | None | Stops the confirmed-live spam vector against real shelter inboxes | S | `src/app/api/applications/route.ts`, possibly a new unique constraint | Submitting the same dog+email twice within a short window is rejected or merged, not silently duplicated |
| Verify real-world email delivery in production (application-received + confirmation) | P0 | `RESEND_API_KEY` already confirmed present in Production/Preview | Confirms the one wired notification channel actually reaches real inboxes | XS | None (verification only) | Submit a real test application against production with a real, checkable inbox; confirm both emails arrive |
| Confirm legal pages (`Adatvédelem`/privacy policy, `ÁSZF`/terms) are real, adequate content, not stubs | P0 | None | Legal exposure for a public EU consumer app | S (verify) to M (write real content if missing) | Footer-linked legal pages (not directly audited in this pass — flagged as a gap in report 17) | A legal/compliance read of the actual page content, confirming GDPR-adequacy for a Hungarian/EU consumer product handling personal data |

## Phase 2 — Monetization (only if promised for V1; otherwise defer per report 18)

| Task | Priority | Dependency | Expected impact | Effort | Affected areas | Verification criteria |
|---|---|---|---|---|---|---|
| Decide and integrate a payment provider (Stripe or a HU-friendly alternative like Barion/SimplePay) | P1 (conditional) | Business decision on which monetization streams ship first | Unblocks every money-flow feature in reports 07/09 | M (integration) | New: checkout routes, webhook handler, `donations`/future `subscriptions` tables' RLS policies (currently insert-blocked, report 07) | A real test transaction completes end-to-end, including webhook-driven status update and a persisted DB row |
| One-time donation (minimal version) | P1 (conditional) | Payment provider above | Delivers on any existing "🎁 Támogathatsz" marketing promise (report 07/08) | M | New donation UI + `donations` table INSERT policy (currently missing) + a receipt email | A real (small/test-mode) donation completes, persists, and triggers a receipt email |
| Dog Club MVP | P2 (conditional) | Payment provider above | New recurring-revenue line | L | Entirely new: schema, checkout, entitlement checks, UI | A test subscription can be created, shows as active, gates at least one real piece of protected content, and can be cancelled |

## Phase 3 — Foundation (nonprofit/donor features, if scoped for V1; otherwise defer)

| Task | Priority | Dependency | Expected impact | Effort | Affected areas | Verification criteria |
|---|---|---|---|---|---|---|
| Build a dedicated Foundation landing page (mission, impact, donation CTA) | P2 (conditional) | Payment provider (Phase 2) if it needs to be functional, not just informational | Gives the nonprofit story a real home instead of being buried in `/rolunk` | S–M | New route | Page exists, is linked from nav/footer, and its donation CTA (if any) actually works |
| Donor account / donor history / receipts | P2 (conditional) | Payment provider + at least one working donation flow | Retention/trust feature for repeat donors | M | `/profil` extension + new donor-history query against `donations` | A donor can log in and see their own past donations with correct amounts/dates |
| SZJA 1% education section | P2 | None (informational only, no payment dependency) | Compliance/education content specific to Hungarian tax-donation law | S | New content section | Content reviewed for accuracy against current Hungarian SZJA 1% program rules |

## Phase 4 — Network growth (analytics, retention, referrals)

| Task | Priority | Dependency | Expected impact | Effort | Affected areas | Verification criteria |
|---|---|---|---|---|---|---|
| Install a real analytics tool (PostHog/GA/Vercel Analytics or similar) | P1 | None | Gives the founder actual visibility into conversion/drop-off, currently zero (report 13) | S | `src/app/layout.tsx` + provider setup | Real events (page views at minimum, ideally key funnel steps: browse→apply→approve) visible in the tool's dashboard within a day of going live |
| Link application-approval to dog-adoption-completion (new column/trigger) | P1 | None | Makes "successful adoptions" and conversion-rate a real, computable metric instead of two disconnected counts (report 13 §3) | M | `adoption_applications` (new column, e.g. `resulted_in_adoption_dog_status_at`) or a trigger linking approval to a dog-status prompt | A partner approving an application is prompted/linked to marking the dog adopted, and a query can now join the two events cleanly |
| Add basic error tracking (Sentry or similar) | P1 | None | Currently zero visibility into production runtime errors beyond default Vercel logs (report 15 §9) | S | New dependency + minimal instrumentation | A deliberately-triggered test error appears in the tool within minutes |
| Stand up a minimal automated test suite + CI gate | P0/P1 (start immediately, run in parallel with Phase 0/1) | None | Given this audit found two CRITICAL, live-exploitable bugs in already-shipped code, this is the single highest-leverage risk-reduction item that isn't a specific bug fix | M–L | New: test framework setup, `.github/workflows/`, initial test coverage for the auth/RLS boundary (the exact two escalation bugs just fixed) and the dog-status-enum fix | CI runs on every PR; the specific regression tests for findings #1/#2/#3 (from report 19) exist and fail if those bugs are ever reintroduced |

## Phase 5 — EU readiness (traceability, cross-border)

| Task | Priority | Dependency | Expected impact | Effort | Affected areas | Verification criteria |
|---|---|---|---|---|---|---|
| Add microchip number, rabies-vaccination record, and true DOB columns to `dogs` | P2 (defer per report 18 unless cross-border is imminent) | None technically, but should follow a real product/compliance decision on scope | Lays groundwork for future EU traceability without committing to the full workflow yet | S (schema-only) | New migration, `dogs` table | Columns exist, nullable, with no UI dependency yet — a pure additive migration |
| Design and build a per-dog verification record (who checked what, when) | P2 (defer) | The columns above | Enables a real "verified dog data" trust signal distinct from today's shelter-level-only `verified` flag | L | New table + admin UI | An admin can mark specific fields of a specific dog as verified, with an audit trail |
| EU verification token / external registry integration | P2 (defer, fully greenfield) | External registry/standard to integrate against (not yet chosen, out of scope for this audit) | Future compliance/interop | XL | New table(s) + external integration | Out of scope to define verification criteria until the target registry/standard is chosen |

---

**Sequencing note:** Phase 0 and the top of Phase 1 (shelter-discovery fix, static-page cleanup, password reset, rate limiting, legal-page verification, backup confirmation) are the actual 60-day launch scope based on this audit's evidence. Phases 2–5 are conditional on product decisions this audit cannot make (does V1 promise donations/Club/cross-border transport, or not) — report 18 recommends deferring all of them unless explicitly promised, in which case treat the relevant Phase-2/3 row as pulled forward into the launch-critical path.
