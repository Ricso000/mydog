# 17 — Launch Gap Matrix (vs. the P0 Hungarian V1 Launch Scope)

Synthesized from reports 01–16. Effort categories: XS (<0.5 day), S (0.5–2 days), M (2–5 days), L (1–2 weeks), XL (>2 weeks). "Current state" uses the audit's status vocabulary (WORKING / PARTIAL / UI_ONLY / BACKEND_ONLY / PLACEHOLDER / BROKEN / BLOCKED / NOT_FOUND / NOT_VERIFIED).

## Public

| Capability | Current state | Evidence | Missing | Severity | Launch blocker? | Effort |
|---|---|---|---|---|---|---|
| Home | WORKING | `src/app/page.tsx`; real Supabase queries + static fallback (02 §1) | — | — | No | — |
| Dogs list | WORKING | `/kutyak`, live-tested, real 12-dog dataset (02 §1) | Pagination untested at scale (06) | Low | No | XS to verify |
| Search/filter | WORKING | Live-tested `?country=DE`→4/12, `?size=small`→3/12 (02, retracts a prior false alarm) | — | — | No | — |
| Dog profile | WORKING | `/kutyak/[id]`, real data, `generateMetadata` (02 §1) | Broken Unsplash seed image (Luna) | Low | No | XS (fix one seed URL) |
| Shelter profile | WORKING (but unreachable via browse) | `/partners/[slug]` real, Supabase-backed (02 §1, 10 §4) | No index/browse page links here; only found via direct slug | **High** (real feature nobody can discover) | **Yes** | S — wire `/menhelyek` to real data + real links |
| How adoption works | NOT_VERIFIED — not separately audited as a distinct page | — | Dedicated explainer page/section | Low | No | XS if desired |
| For shelters (`/csatlakozas`, `/partner/register`) | WORKING | 02 §1, §2 | — | — | No | — |
| Basic Kids | PARTIAL | `/gyerekeknek` real static shell, all interactive elements non-functional (11 §1) | Decide: cut interactivity claims or build stubs | Low | No | S (soften copy) or M (build minimal interactivity) |
| Basic Knowledge | **BROKEN (dead nav link, live-404)** | `/hirek` nav link 404s (11 §2) | Either the page or remove the nav link | Medium (visible on every page) | **Yes** (visible, unprofessional) | XS (remove link) to L (build a real news section) |
| Foundation landing | NOT_FOUND | 08 — no dedicated route exists at all | Entire feature | Medium | Only if donations are promised at launch | L |
| Auth | WORKING | Login/register/partner-login/admin-login all live-tested (02, 06) | Password reset (see below) | High | **Yes** (see security list) | S |
| 7 static marketing pages with dead/fake content | **BROKEN in parts** | `/rolunk`, `/szolgaltatasok`, `/onkentesek`, `/gyerekeknek`, `/fajtamentok`, `/bobilos-utazas`, `/menhelyek` — fictional stats vs. real 12-dog/3-partner dataset; non-functional forms/buttons; `/menhelyek/{id}` and `/fajtamentok`'s same links 404 live (02 §7) | Real data or honest copy; wire or remove dead forms/links; fix 404 links | **High** (visible, credibility-damaging) | **Yes** | M (across all 7 pages) |

## Partner

| Capability | Current state | Evidence | Missing | Severity | Launch blocker? | Effort |
|---|---|---|---|---|---|---|
| Shelter application | WORKING | Live-tested full flow (05 §1) | Onboarding wizard/doc upload (spec asked for it) — NOT_FOUND | Low | No | L if wizard desired |
| Verification (email) | NOT_FOUND (by design — auto-confirm) | 05 §2, 12 §4 | Real email verification | Medium | Recommended, not strictly blocking | S |
| Admin approval gate | **WORKING, but only after a same-day CRITICAL fix** | 05 §5, 12 §1b — self-approval was live-exploitable, now fixed+verified | — (fixed) | — | — (resolved) | Done |
| Onboarding | NOT_FOUND (single flat form) | 05 §4 | Multi-step wizard | Low | No | M |
| Dashboard | WORKING | Live-tested (05) | One always-zero stat (`pending_review` vs dog enum mismatch, 02 §5.1) | Low | No | XS |
| Dog CRUD | **PARTIAL — status-change is BROKEN** | Create/list/edit-normal-fields all live-tested working (05 §7); status→`not_available` fails with Postgres `22P02` on both partner and admin paths (02, 03, 05, 06) | Fix wrong enum string (`not_available`→`inactive`) in 4 files | **High** (a partner cannot hide/pull a dog from listing without hitting a raw DB error) | **Yes** | XS (one-string fix × 4 locations, but needs care + retest) |
| Applications (partner-side review) | WORKING | Live-tested full approve loop (05 §8) | Duplicate-submission spam protection (06) | Medium | Recommended before public launch | S |
| Organisation profile | WORKING | `/partner/profile`, live-reviewed (02 §4) | Slug-uniqueness UX (raw DB error on collision) | Low | No | XS |
| Team members / roles | **PLACEHOLDER (stored, never enforced)** | 05 §6, 03 (`partner_members`) | Any actual permission differentiation; invite UI | Low (single-operator shelters mostly unaffected) | No | L if needed at launch |

## Admin

| Capability | Current state | Evidence | Missing | Severity | Launch blocker? | Effort |
|---|---|---|---|---|---|---|
| Partner approval | **WORKING, post-fix** | 05, 12 §1b | — | — | — | Done |
| Dogs moderation | **PARTIAL — hide/unhide is BROKEN and silently logs false success** | 02 §5, 05 §7, 03 (`dogs` RLS note) | Same enum fix as above; also add error-checking to `DogStatusAction.tsx` so it can't silently log a false `activity_logs` success | **High** | **Yes** | S (fix + add error handling + retest) |
| Users | WORKING (role-grant/revoke) | Live-tested (admin_actions test), 12 §1 fix confirms it still works | — | — | No | — |
| Applications | WORKING | 02 §5 | — | — | No | — |
| Basic analytics | **PARTIAL** | 13 — 4 of ~15 spec metrics computable (partner/dog/application/user counts); no aggregation UI beyond raw tiles | Verified-shelter tile, applications/week chart | Low | No | S |

## Adoption flow

| Capability | Current state | Evidence | Missing | Severity | Launch blocker? | Effort |
|---|---|---|---|---|---|---|
| Browse | WORKING | 06 | — | — | No | — |
| Apply | WORKING | 06, live-tested 3× | Duplicate-submission protection | Medium | Recommended | S |
| Partner review | WORKING | 06 | — | — | No | — |
| Approve/reject | WORKING | 06 | — | — | No | — |
| Completion | **BROKEN (disconnected)** | 06, 13 §3 — approving an application never links to marking the dog adopted; no shared key, no reminder | A linking mechanism (new column/trigger) or a documented manual process | Medium (product-completeness, not a live bug) | Recommended before scaling, not a hard blocker for a 60-day pilot at 12-dog scale | M |

## Foundation

| Capability | Current state | Evidence | Missing | Severity | Launch blocker? | Effort |
|---|---|---|---|---|---|---|
| One-time donation | **NOT_FOUND (unreachable)** | 07 §1, 08 | Entire payment + UI + RLS-insert-policy stack | High (if promised for V1) | Only if donations are part of the V1 promise | L–XL |
| Recurring donation | NOT_FOUND | 07, 08 | Entire feature | High (if promised) | Same as above | XL |
| Virtual adoption | NOT_FOUND (schema stub only) | 07, 08 | Entire feature + UI | High (if promised) | Same as above | L–XL |

## Club

| Capability | Current state | Evidence | Missing | Severity | Launch blocker? | Effort |
|---|---|---|---|---|---|---|
| MVP membership | NOT_FOUND — zero trace at any level | 09 | Entire feature from scratch (schema, checkout, entitlement, UI) | High (if promised) | Only if Club is part of the V1 promise | XL |
| Recurring payment | NOT_FOUND | 09 | Payment provider integration entirely | High (if promised) | Same | XL |
| Entitlement / benefits | NOT_FOUND | 09 | Entire concept | Medium | Same | L |

## Services

| Capability | Current state | Evidence | Missing | Severity | Launch blocker? | Effort |
|---|---|---|---|---|---|---|
| Service provider directory | **PLACEHOLDER (static, fake data)** | 10 §4, §7 | Real browse/filter wired to `partners.type` | Medium (data model already supports it) | Recommended, not a hard blocker if scope-cut to "shelters only" for V1 | M |
| Map | **PLACEHOLDER (explicitly "coming soon" in the UI itself)** | 10 §2–3 | Map library + coordinate storage + geocoding | Medium | No (can defer — see report 18) | L–XL |
| Categories | PARTIAL (data model yes, browse UI no) | 10 §1, §4 | Consumer-facing filter UI | Medium | Recommended | M |
| Partner profile | WORKING | 10 §4 | — | — | No | — |
| Club discount | NOT_FOUND | 10 §6 (depends on Club, report 09) | Depends entirely on Club shipping first | — | No (deferred with Club) | — |

## Technical

| Capability | Current state | Evidence | Missing | Severity | Launch blocker? | Effort |
|---|---|---|---|---|---|---|
| Production env | WORKING | 15 §1–2 | Custom domain (only `*.vercel.app` today) | Medium | Recommended for a real HU launch | S (domain purchase + DNS + Vercel config) |
| Legal pages | NOT_VERIFIED — not directly audited as a distinct item; footer links to "Adatvédelem"/"ÁSZF" exist per nav copy seen across reports but their actual page content was not read in this audit | — | Confirm these are real, GDPR-adequate pages, not stubs | **High** (legal exposure for a public EU-market consumer app handling personal data) | **Likely yes — needs a dedicated check before launch** | S to verify, M if they need real content |
| Secure auth | **PARTIAL, two CRITICAL issues found+fixed same day; others remain** | 12 — profiles/partners escalation (fixed), no password reset (open), no rate limiting (open), auto-confirm signup (open, by design), 10 high-severity `npm audit` findings incl. Next.js (open) | Password reset flow; rate limiting; dependency updates | **Critical** (2 items fixed; several HIGH items remain) | **Yes**, remaining items | S (rate limit) + S (password reset) + S (`npm audit fix` non-force) + separate scheduled M (Next.js minor bump + regression test) |
| Analytics | NOT_FOUND | 01, 13 | Any analytics tool at all | Medium | Recommended, not a hard blocker | S (install + wire a tool) |
| Email notifications | **PARTIAL** | 14 — 2 of 9 spec flows implemented (application-received/confirmation), live-configured in Prod, delivery itself NOT_VERIFIED; no password-reset, status-change, or admin-notification emails exist | Verify real delivery; consider adding status-change email | Medium | Recommended | S (verify) + M (add missing flows) |
| Backup/logging | **NOT VERIFIED / NOT_FOUND** | 15 §5, §9 — backups reported "None" per a dashboard screenshot (not independently re-confirmed); no observability tool | Confirm/enable Supabase backups; add basic error tracking | **High** (data-loss risk with zero backup, unconfirmed) | **Yes — verify and enable backups before launch, at minimum** | XS to verify/enable (Supabase dashboard setting) + S for basic error tracking |
| Migration/CLI hygiene | BLOCKED (operational, not user-facing) | 15 §4 | Reconcile CLI migration history with live schema (mark 001–012 as applied) | Medium (blocks safe future `supabase db push`) | No (doesn't block launch, blocks safe *future* dev workflow) | S |
| Zero automated tests, zero CI | NOT_FOUND | 01, 16 | Test framework + at least smoke coverage of auth/RLS/adoption flow; a CI gate | **High** (no regression safety net for a live product) | Strongly recommended, not a hard blocker for day-1 launch | M–L to stand up meaningfully |
