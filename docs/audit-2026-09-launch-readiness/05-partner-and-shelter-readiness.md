# Partner / Shelter Readiness

Audited live against the real production Supabase project (`eikkgaocpkhwdgndiupm`) via a local dev server (`localhost:3000`) pointed at that same database, using a real, clearly-tagged, fully cleaned-up test partner ("E2E AUDIT TEST Shelter", deleted after testing) and the existing admin test account (`e2e-test-claude-...@example.com`, `role=admin`, left in place for continued audit use). All test rows created during this section were deleted via `service_role` after verification; none remain in the database.

Flow audited: `partner application -> verification -> account -> dashboard -> dog upload -> edit -> publish -> receive application -> process application`.

## Step-by-step results

### 1. Organisation registration — WORKING
- **File:** `src/app/partner/register/page.tsx`
- Live test: registered a real account + partner via the actual `/partner/register` form (name, email, password, org name, type, country, city). `supabase.auth.signUp()` succeeded, then `partners` insert succeeded with `status: "draft"` (`page.tsx:92`), `verified` defaulting to `false`.
- **Evidence:** HTTP flow observed via Playwright; final row confirmed via `service_role` GET before cleanup: `{"status":"draft","verified":false}`.

### 2. Email verification — NOT_FOUND / BLOCKED by design
- Supabase Auth auto-confirms signups project-wide (confirmed earlier in this audit session for regular users; identical behavior observed for the partner signup — `supabase.auth.signUp()` returned a live session immediately, no confirmation email step). There is no partner-specific email verification step in the code (`src/app/partner/register/page.tsx` has no confirmation-polling or verify-token logic).
- **Business risk:** anyone can create a partner account with a throwaway/unverified email address and immediately reach the partner dashboard (though not the public marketplace — see step 5).

### 3. Login — WORKING
- **File:** `src/app/partner/login/page.tsx:15-27`. Standard `signInWithPassword`, correct wrong-password error handling ("Hibás email cím vagy jelszó."), correct redirect-param support. Live-tested successfully.

### 4. Onboarding wizard — NOT_FOUND (single-step form only)
- Registration is a single flat form (account fields + org fields together, `src/app/partner/register/page.tsx:115-186`). There is no multi-step onboarding wizard, no document upload step, no guided profile-completion flow. The dashboard does prompt "Töltsd ki a profilt minél részletesebben!" but this is just static copy, not a wizard.

### 5. Admin approval / verified badge — WORKING (now, after a CRITICAL fix applied this session)
- **Files:** `src/app/admin/partners/[id]/page.tsx`, `src/components/admin/PartnerActions.tsx`.
- A freshly-registered (`draft`) partner's dogs are correctly invisible on the public `/kutyak` (RLS: `"Public can read dogs of approved partners"`, `supabase/migrations/001_initial_schema.sql:312-313`, requires `partners.status = 'approved'`) — live-verified: `/kutyak` showed "12 kutya" (real seeded count) with the new test dog absent while the test partner was still `draft`.
- Admin approval via `/admin/partners/[id]` → "Jóváhagyás" button correctly set `partners.status = 'approved'` — live-verified: after clicking, `/kutyak` immediately showed "13 kutya" including the newly-visible test dog, and the admin activity log correctly recorded `partner_status_changed_to_approved` (this action, unlike the dog-status bug below, uses a valid enum value and the code checks `.error`, so the audit trail is accurate here — see `src/components/admin/PartnerActions.tsx:22-34`).
- **CRITICAL finding (found and remediated this session, see `12-security-and-permissions.md` for full detail):** before a fix applied this session, ANY partner member could self-approve (`status: "approved"`) and self-verify (`verified: true`) their own partner directly via the public REST API, completely bypassing this admin gate — live-reproduced with a fresh throwaway partner (`PATCH /rest/v1/partners` succeeded, HTTP 204, ground-truth confirmed `status` became `approved`). Root cause: `"Members can update own partner" on partners for update using (is_partner_member(id))` had no `with check` restricting which columns change. **Fixed** via `supabase/migrations/012_fix_partner_approval_escalation.sql` (a `BEFORE UPDATE` trigger blocking `status`/`verified` changes unless `is_admin()`), applied to production and verified with a full negative/positive test suite: self-approve rejected (403), self-verify rejected (403), legitimate field edits (description/phone/city) still succeed, admin approval still succeeds.

### 6. Role model / partner permissions — PARTIAL, mostly unused
- **Files:** `partner_member_role` enum (`owner,manager,editor,viewer`, migration 001 line 15), `partner_members` table.
- A creating user is auto-added as `owner` via a trigger (`supabase/migrations/002_partner_portal.sql`) — live-verified: `partner_members` row appeared with `role: "owner"` immediately after partner creation.
- However, `is_partner_member()` (the function gating almost every partner-facing RLS policy) checks only membership *existence*, never the `role` column (`supabase/migrations/001_initial_schema.sql:287-291`) — so `owner`/`manager`/`editor`/`viewer` are stored but carry **zero actual permission difference** anywhere in the app. This is a data-model stub, not a working permission tier system.
- **Team members management (invite a co-worker, change their role):** NOT_FOUND. `partner_members` has RLS enabled with only a SELECT policy for members and an admin-all policy — no INSERT/UPDATE/DELETE policy exists for regular members, and no UI anywhere lets a partner invite or manage team members. A shelter with multiple staff cannot add a second login today.

### 7. Dog CRUD — WORKING (create/edit/list), with one CONFIRMED BUG in status changes
- **Create:** `src/app/partner/dogs/new/page.tsx` — live-tested successfully: filled the real form, submitted, got `POST /rest/v1/dogs → 201`, new dog appeared in `/partner/dogs` ("1 kutya").
- **List:** `src/app/partner/dogs/page.tsx` — correctly showed the created dog.
- **Edit — CONFIRMED BUG:** `src/app/partner/dogs/[id]/edit/page.tsx`. Editing ordinary fields (description, etc.) works. But setting the status dropdown to "Nem elérhető" ("not available") and saving fails every time: `PATCH /rest/v1/dogs → 400 {"code":"22P02","message":"invalid input value for enum dog_status: \"not_available\""}`. Root cause: the `dog_status` Postgres enum (`supabase/migrations/001_initial_schema.sql:19-22`) is `('available','reserved','pending','foster','adopted','medical','inactive','deceased')` — there is no `not_available` value; the correct value is almost certainly `inactive`. Unlike the admin one-click equivalent (see report 02/06), this page **does** check `updateError` and surfaces it (`src/app/partner/dogs/[id]/edit/page.tsx:129`) — live-verified the partner actually sees the raw, untranslated Postgres error on-page: *"Mentési hiba: invalid input value for enum dog_status: "not_available""* — technically non-silent, but a confusing, unlocalized, unresolvable error for a non-technical shelter volunteer. The identical wrong string also appears in `src/app/admin/dogs/page.tsx` and `src/app/partner/dogs/page.tsx` label maps. **Not fixed this session** (out of scope of the two approved security fixes — flag for a follow-up code fix: replace `not_available` with `inactive` in all four locations).
- **Draft/published states for dogs:** there is no separate draft/publish concept for a dog — a dog created under a `draft`-status partner simply inherits invisibility from the partner's own status (see step 5); once the partner is approved, every one of its `available`-status dogs is instantly public. There's no per-dog "ready to publish" toggle.
- **Bulk import:** NOT_FOUND — no CSV/bulk-upload UI or endpoint anywhere in `src/`.
- **Photo upload:** WORKING at the infrastructure level — `src/components/DogImageUpload.tsx` + `supabase/migrations/005_storage_dog_images.sql` (public bucket, 5MB limit, JPEG/PNG/WebP only, partner-folder-scoped storage policies) — reviewed in code, not re-tested live in this section (see security report for storage policy detail).

### 8. Application inbox / status change — WORKING
- **File:** `src/app/partner/applications/page.tsx`.
- Live-tested full loop: submitted a real public adoption application to the test dog → appeared instantly in `/partner/applications` ("1 új") with contact name/email/message all correct → changed status via the per-row `<select>` from "Beküldve" to "Jóváhagyva" → `PATCH /rest/v1/adoption_applications → 204` → page correctly re-rendered showing "Jóváhagyva". This uses valid `application_status` enum values (`submitted,reviewing,approved,rejected,withdrawn`) throughout and correctly checks `.error` (`page.tsx:64-74`) — no bug found here.
- **Note:** a Postgres trigger (`supabase/migrations/007_adoption_notifications.sql`) fires on this status change and writes a row to the applicant's in-app `notifications` table — confirmed by code read, not independently re-verified in this section (see report 14 for the full email/notification audit, which confirms this is in-app-only, no email is sent for this event).

### 9. Notifications to partner on new application — PARTIAL (in-app only, not email)
- See report 14: no email is sent to the partner when a new application arrives beyond the one immediate `sendApplicationReceivedToPartner` call from `/api/applications` (real, Resend-based, confirmed wired — but untested for actual inbox delivery since `RESEND_API_KEY` is absent locally). There is no separate "new application" in-app bell notification for the partner side (the `notifications` table's `user_id` FK points at `profiles`, and no code path inserts a partner-facing notification row for this event — only the applicant gets one, on status change).

### 10. Audit trail — PARTIAL, and proven unreliable for one action class
- `activity_logs` correctly records real admin partner-status changes (`partner_status_changed_to_approved`, confirmed live).
- **However**, the equivalent action for dogs (`DogStatusAction.tsx`, admin one-click hide/show) writes a log entry unconditionally *even when the underlying update fails* — see report 06 / 02 for the full reproduction. This means the audit trail cannot currently be trusted at face value for dog-status changes specifically.

## TEST DATA CREATED THIS SECTION (all deleted, listed for transparency)
- Partner: "E2E AUDIT TEST Shelter 1788690639" (id `77cded63-...`) — **deleted**.
- Dog: "AUDIT TEST DOG do-not-adopt" (id `fbd3c822-...`) — **deleted** (cascaded with partner).
- Auth user: `e2e-audit-partner-1788690639@example.com` — **deleted**.
- 3 adoption applications from `audit-applicant@example.com` — **deleted**.
- A leftover partner + auth user from an earlier interrupted privilege-escalation test ("E2E AUDIT TEST Partner PrivEsc2") — found during cleanup sweep and **deleted**.
- Confirmed via a final `service_role` read: the `partners` table now contains exactly the original 3 seeded partners (Happy Paws Rescue, Magyar Állatvédők, Paws of Spain), all `approved`.

## Summary status table

| Step | Status | Evidence |
|---|---|---|
| Registration | WORKING | Live test, real signup+insert |
| Email verification | NOT_FOUND | Auto-confirm project-wide |
| Login | WORKING | Live test |
| Onboarding wizard | NOT_FOUND | Single flat form only |
| Admin approval gate | WORKING (post-fix) | Live test + CRITICAL fix verified |
| Verified badge | WORKING (post-fix) | Same fix |
| Team roles/permissions | PLACEHOLDER | Enum stored, never checked |
| Team member invites | NOT_FOUND | No RLS policy, no UI |
| Dog create | WORKING | Live test, 201 |
| Dog edit (normal fields) | WORKING | Live test |
| Dog edit (status→inactive) | BROKEN | Live-reproduced 400, wrong enum value |
| Dog draft/publish | NOT_FOUND | Inherits partner status only |
| Bulk import | NOT_FOUND | No such feature |
| Photo upload | WORKING | Code-reviewed, correctly scoped |
| Application inbox | WORKING | Live test, full loop |
| Application status change | WORKING | Live test, 204 |
| Partner notification on new app | PARTIAL | Email wired but unverified; no in-app bell |
| Audit trail (partner actions) | WORKING | Live-verified accurate |
| Audit trail (dog actions) | BROKEN | Confirmed to log false successes |
