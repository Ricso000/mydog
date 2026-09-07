# Adoption Flow Readiness (Consumer Side)

Audited live against the real production Supabase project, end to end: `browse -> search/filter -> dog profile -> apply -> partner review -> approve/reject -> "adoption completion"`. All test data created during this audit was deleted afterward (see report 05 for the full cleanup log).

## Dog discovery / search / filter — WORKING
- `/kutyak` renders 12 real seeded dogs (verified independently by a parallel audit pass in report 02, which live-tested `?country=DE` → 4/12 and `?size=small` → 3/12 and confirmed the filters genuinely change the server-side Supabase query in `src/app/kutyak/page.tsx:97-144`). An earlier session-internal suspicion that filters were stuck at "12 kutya" regardless of selection could not be reproduced and is retracted.
- Pagination: `.limit(50)` style queries were seen but no visible page-through UI was found for `/kutyak` beyond the 12 seeded dogs — NOT_VERIFIED at scale (untested with >50 dogs, dataset too small to exercise this).

## Dog detail page — WORKING
- `/kutyak/[id]` shows partner info, health/compatibility badges, "Kapcsolatfelvétel a menhellyel" and "Kedvencekhez adom" CTAs. Live-tested against a real dog id.
- "Similar dogs" section renders real related dogs from Supabase, not mock data.

## Partner details — WORKING
- `/partners/[slug]` is a real, working, previously-uncatalogued route with `generateMetadata` and live Supabase queries (per report 02's finding) — separate from the fully-static `/menhelyek` list page which links to a broken `/menhelyek/{id}` (404, per report 02).

## Favourites — WORKING (add AND remove, both directions live-tested)
- **File:** `src/components/FavoriteButton.tsx`.
- Add: clicking "Kedvencekhez adom" on a dog while logged out correctly redirects to `/bejelentkezes?redirect=...` (no silent failure). While logged in, a real click inserted a `favorite_dogs` row and the dog immediately appeared on `/kedvencek`.
- Remove: clicking the now-labeled "Kedvenceim között ♥" button correctly deleted the row — `/kedvencek` reverted to its empty state ("Még nincs kedvenc kutyád.") immediately after. Both directions confirmed via direct UI interaction, not just code reading.
- Favourite *partners* (follow a shelter) share the same table/component pattern but were not independently re-tested this session; code (`favorite_partners`, `FollowPartnerButton.tsx`) mirrors the dog-favourite implementation and is presumed WORKING by the same mechanism (INFERENCE).

## Form validation — WORKING, minimal
- `src/components/ContactForm.tsx` requires name+email client-side; `src/app/api/applications/route.ts` re-validates server-side (`dogId`/`name`/`email` required, plus an email-format regex `EMAIL_RE`). No phone validation, no message length cap.

## Application persistence — WORKING end-to-end
- A real submission through the live UI (`POST /api/applications`) returns `{"ok":true}` and creates a real `adoption_applications` row. Verified across three scenarios this session: (1) anonymous submitter (`applicant_id: null`, correctly shows up in admin's applications list by contact name/email but NOT in any user's `/jelentkezeseim`), (2) a logged-in test partner's own applicant flow, (3) a fresh dedicated test dog created specifically for this audit.

## Duplicate application protection — CONFIRMED MISSING (BUG)
- Live-reproduced: submitted 3 back-to-back applications for the *same dog* with the *same contact email* via the public API — all 3 succeeded (`HTTP 200 {"ok":true}` each time), all 3 persisted as separate rows in `adoption_applications` with no rejection, no merge, no warning. `src/app/api/applications/route.ts` has no uniqueness check (no query against existing `dog_id`+`contact_email`/`applicant_id` combinations before inserting) and the table has no unique constraint enforcing this either (`supabase/migrations/001_initial_schema.sql:150-160`, no `unique(dog_id, applicant_id)` or similar). Combined with the confirmed absence of any rate-limiting anywhere in the app (see report 12), this makes the public contact form a straightforward spam/flooding vector against real shelter inboxes (each submission also attempts to email the partner via Resend in production).

## Authenticated vs unauthenticated flow — WORKING as designed
- Both paths correctly reach the same `/api/applications` endpoint; the only difference is whether `applicant_id` gets populated (`user?.id ?? null`, `src/app/api/applications/route.ts`). This was exactly the observed, correct behavior: an application submitted while logged out never appears in that same person's `/jelentkezeseim` even if they later log in with a matching email — there is no email-based reconciliation, only the `applicant_id` foreign key.

## Notification on status change — PARTIAL (in-app only)
- `supabase/migrations/007_adoption_notifications.sql` fires `AFTER UPDATE OF status` on `adoption_applications` and inserts a row into the applicant's in-app `notifications` table (read by `NotificationBell.tsx`) with a human-readable Hungarian status label. Confirmed this is real and would fire on the live status change tested in report 05 (code-verified trigger logic, not independently re-queried this session — the /jelentkezeseim page for the applicant was not re-checked post-status-change since the test used an anonymous, non-authenticated applicant email with no linked account). No email is sent for this event (see report 14).

## User dashboard (`/jelentkezeseim`) — WORKING
- Correctly filters `adoption_applications` by `applicant_id = auth.uid()` (`src/app/jelentkezeseim/page.tsx:27-30`). Empty-state and populated-state both rendered correctly in live tests this session.

## Partner dashboard / review — WORKING (see report 05 for full detail)
- Full loop live-tested: application appears in partner inbox in real time, status change via dropdown persists correctly (`204`, ground-truth confirmed).

## Final adoption state / "adoption completed" — BROKEN / disconnected (confirmed by a parallel audit pass, corroborated here)
- Per report 13 (analytics/KPI audit, which specifically traced this): `dogs.status = 'adopted'` **is** reachable through a real UI path (the partner dog-edit page's status dropdown, `src/app/partner/dogs/[id]/edit/page.tsx`), but it is **entirely decoupled** from `adoption_applications.status = 'approved'` — no trigger, no shared column, no code anywhere links "this application was approved" to "this dog is now marked adopted." A partner must manually remember to separately go edit the dog's own status after approving an application. There is no single-click "mark this application as completed adoption" action anywhere in the UI.
- Consequence: there is no reliable way today to measure application→adoption conversion or time-to-adoption (both confirmed NOT_FOUND / BROKEN in report 13 for the same underlying reason).

## Adopted dog archiving — PARTIAL
- The public dogs query (`src/app/kutyak/page.tsx`) filters on `partners.status = 'approved'` but does **not** appear to filter out `dogs.status = 'adopted'` from the public listing by default (NOT independently re-verified with a live `status=adopted` dog in this session — flagging as `NOT_VERIFIED`, worth a follow-up check before launch: an adopted dog might keep appearing in the public "browse" list indefinitely unless the UI status filter is used, which most visitors won't do).

## Reporting — NOT_FOUND
- No admin reporting/export/CSV/chart UI exists beyond the raw list pages and the 7 static count tiles on `/admin/dashboard` (count of partners/dogs/applications/users only — no time-series, no export button found anywhere in `src/app/admin/**`).

## Summary status table

| Capability | Status | Evidence |
|---|---|---|
| Browse | WORKING | Live, real seeded data |
| Search/filter | WORKING | Live-tested (`?country=DE`, `?size=small`) |
| Pagination at scale | NOT_VERIFIED | Dataset too small (12 dogs) |
| Dog profile | WORKING | Live test |
| Partner profile | WORKING | Live test (`/partners/[slug]`) |
| Favourites (add/remove) | WORKING | Live-tested both directions |
| Form validation | WORKING | Minimal but present client+server |
| Application persistence | WORKING | Live, 3 real scenarios |
| Duplicate-application protection | BROKEN (missing) | Live-reproduced, 3/3 duplicates accepted |
| Auth vs anon flow | WORKING as designed | Live-verified `applicant_id` behavior |
| Status-change notification | PARTIAL | In-app only, no email |
| User "my applications" | WORKING | Live test |
| Partner review/approve | WORKING | Live test, 204 |
| Final adoption completion | BROKEN (disconnected) | Code-traced, no link between application approval and dog status |
| Adoption→conversion/time-to-adoption metrics | BROKEN / NOT_FOUND | Consequence of the above |
| Adopted-dog archiving from public list | NOT_VERIFIED | Not live-tested with an adopted dog |
| Admin reporting/export | NOT_FOUND | No such UI exists |
