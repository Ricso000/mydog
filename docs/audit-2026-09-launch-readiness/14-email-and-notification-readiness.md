# 14 — Email & Notification Readiness

Scope: every transactional-email and notification trigger point named in the audit spec. Method: full
read of `src/lib/email.ts`, both files that import from it, all three notification-trigger migrations
(007, 009, 010), `src/components/NotificationBell.tsx`, the signup and (absent) password-reset flows,
and repo-wide greps for every `send*` function name and for `pg_net`/edge-function/webhook mechanisms
that could turn a DB row into an email. Repo:
`/Users/bankirichard/Developer/MyDog projekt/rescueconnect`. No live email was sent or received during
this audit — inbox delivery is explicitly out of scope and marked NOT_VERIFIED throughout.

## 0. Provider baseline

Email provider is **Resend** (`resend` package, confirmed in `package.json` dependencies).
`src/lib/email.ts` (83 lines, read in full):

- `getResend()` (lines 6-13) reads `process.env.RESEND_API_KEY`; if absent, logs
  `console.warn("[email] RESEND_API_KEY nincs beállítva – email küldés kihagyva.")` and returns
  `null` — a deliberate no-op, not a crash.
- `send(to, subject, html)` (lines 15-22) calls `getResend()`; if it got `null`, returns immediately
  without sending. If a key is present, calls `resend.emails.send(...)` and logs (but does not throw)
  on error.
- `esc(s)` (lines 25-31) HTML-escapes `&`, `<`, `>`, `"` before interpolation into any template —
  used consistently in both templates below to prevent HTML injection from user-supplied names/
  messages/emails.
- `layout(body)` (lines 33-41) wraps every email in a shared branded shell.

**Local vs. production key presence:**
- Local: `.env.local` (read in full this session) contains only `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `VERCEL_OIDC_TOKEN` — **no `RESEND_API_KEY`**. Confirmed by
  `grep -c RESEND .env.local` → `0`. This means every `send()` call in local dev silently no-ops.
- Production/Preview: `vercel env ls production` and `vercel env ls preview` (run this session,
  `.vercel` project link already present in this directory) both show:
  `RESEND_API_KEY   Hidden   Sensitive   Preview, Production   60d ago`. The key has been configured
  for roughly two months as of this audit (2026-09-06).
- **Conclusion: the code path is live-configured in Production and Preview, no-op locally.** Nobody
  on this audit had inbox access, so whether a real email actually arrives is **NOT_VERIFIED** for
  every single trigger below, regardless of key presence — that distinction (configured vs.
  delivered) is kept explicit in every row of §2.

## 1. Complete inventory of `send*` functions

`src/lib/email.ts` exports exactly **two** send functions — this is the entire outbound-email surface
of the application, confirmed by `grep -n "^export async function" src/lib/email.ts`:

| Function | Line | Recipient | Trigger site |
|---|---|---|---|
| `sendApplicationReceivedToPartner` | 43-67 | The partner/shelter's `email` column | `src/app/api/applications/route.ts:82-92` |
| `sendApplicationConfirmationToApplicant` | 69-83 | The applicant's submitted email | `src/app/api/applications/route.ts:73-78` |

Both usages are confirmed by `grep -rn "sendApplicationConfirmationToApplicant\|sendApplicationReceivedToPartner" src`
— the only two call sites in the entire codebase are inside `src/app/api/applications/route.ts`
itself; there is no other file that imports either function.

### How the one wired flow works (`src/app/api/applications/route.ts`, read in full)

1. Validates the request body, looks up the dog (and its partner via a join, `line 45`) so the
   partner identity is server-derived, never client-supplied.
2. Inserts the `adoption_applications` row (`lines 53-62`).
3. Builds an `emailJobs` array (`lines 72-93`): always includes the applicant-confirmation email;
   conditionally includes the partner-notification email only `if (partner?.email)`.
4. Fires both via `Promise.allSettled(emailJobs)` (`line 94`) — **email failures cannot fail the
   submission**, and the route always returns `{ ok: true }` regardless of email outcome.

This session confirmed the DB-insert half of this flow end-to-end with a real test submission
(application row was created successfully). The email half could not be confirmed locally because
`RESEND_API_KEY` is absent from `.env.local` — `getResend()` returns `null` and both `send()` calls
silently no-op, logging the warning above to the server console. **Status: code path correctly wired,
email delivery itself NOT_VERIFIED / BLOCKED in local dev, live-configured in production per §0.**

## 2. Trigger-by-trigger ledger

| Trigger | Email exists in code? | Wired into a real call site? | Key configured? | Production delivery confirmed? |
|---|---|---|---|---|
| Signup confirmation | No — see below | N/A | N/A | N/A |
| Application received (to applicant) | Yes, `sendApplicationConfirmationToApplicant` | Yes, `src/app/api/applications/route.ts:73-78` | Yes (Prod/Preview), No (local) | **NOT_VERIFIED** |
| Partner notification (new application) | Yes, `sendApplicationReceivedToPartner` | Yes, `src/app/api/applications/route.ts:80-93` (conditional on partner having an email) | Yes (Prod/Preview), No (local) | **NOT_VERIFIED** |
| Application status change (approved/rejected/etc.) | **No email function exists for this** | Only an **in-app** notification is produced — see §3 | N/A | N/A |
| Adoption completed | **No email function exists** | No trigger point exists at all — see report 13 §3: there is no unambiguous "adoption completed" event in the data model to hang a trigger on in the first place | N/A | N/A |
| Donation receipt | **No email function exists** | No donation flow exists anywhere in the app (confirmed by report 07: `donations` table has 0 writes from any route/component) | N/A | N/A |
| Recurring donation / Club lifecycle emails | **No email function exists** | No Club or recurring-donation feature exists at all (confirmed by report 09: zero trace of "club"/"subscription"/"membership" anywhere in `src` or `supabase`) | N/A | N/A |
| Password reset | **No email function exists** | No password-reset flow exists anywhere in the app — `grep -rn "resetPasswordForEmail\|forgot.*password\|elfelejtett" src` (case-insensitive) → **0 hits**. There is no "forgot password" link on `src/app/bejelentkezes` (login) at all | N/A | N/A |
| Admin notification (e.g. new partner pending review) | **No email function exists** | Admins have no push signal of any kind when a partner registers; the only way to discover a pending partner is to manually open `/admin/partners?status=pending_review` (linked from the dashboard quick-actions, `src/app/admin/dashboard/page.tsx`, but not proactively surfaced) | N/A | N/A |

## 3. In-app notifications vs. email: the critical distinction for this audit

Three Postgres trigger functions exist, introduced across migrations 007, 009, and 010 (all three read
in full):

- `notify_application_status_change()` (`supabase/migrations/007_adoption_notifications.sql:2-31`) —
  fires `after update on adoption_applications`, and on any status change inserts one row into
  `notifications` with `type='adoption_update'`.
- `notify_matching_saved_searches(p_dog_id)` (`supabase/migrations/009_saved_search_notifications.sql:50-77`)
  — fires when a dog becomes `available` (insert or status transition, trigger at line 90) or when its
  partner gets approved (trigger at line 109); loops every `saved_searches` row and inserts a
  `notifications` row (`type='system'`) for each matching search's owner.
- `notify_partner_followers(p_dog_id)` (`supabase/migrations/010_partner_follow_notifications.sql:6-31`)
  — same two trigger points (dog becomes available: line 44; partner approved: line 63), inserts a
  `notifications` row (`type='partner_message'`) for every row in `favorite_partners` matching that
  partner.

**All three do exactly one thing: `insert into notifications (...)`. None of them call any external
system.** This was verified precisely as instructed:

```
grep -rniE "pg_net|edge.?function|http_post|webhook" --include="*.sql" --include="*.ts" --include="*.tsx" supabase src
→ 0 hits (repo-wide, all migrations and all application code)

find supabase -type d
→ supabase, supabase/migrations, supabase/.temp   (no supabase/functions directory exists)
```

There is no `pg_net` extension usage, no `net.http_post` call, no `supabase/functions/` directory, and
no cron/scheduled job anywhere that reads unprocessed `notifications` rows and turns them into an
email via Resend or any other provider. `src/lib/email.ts` has no function named or shaped to send an
email from a `notifications` row, and neither of its two functions is called from anywhere near these
triggers (their only call sites are in `src/app/api/applications/route.ts`, per §1).

The only consumer of the `notifications` table is `src/components/NotificationBell.tsx` (read in
full) — a client component that:
1. On mount, runs `select count(id) from notifications where user_id=... and read=false` to badge the
   bell icon (`lines 20-31`).
2. On click, fetches the 10 most recent rows and marks them read (`lines 33-54`).

This is pure client-side polling triggered by the user opening the bell menu in their browser — there
is no push mechanism (no websocket subscription, no service worker, no browser push API usage) even
for the in-app channel; a user only sees a new notification once they reload/revisit a page with the
bell mounted and the initial unread-count `useEffect` re-runs.

**Conclusion: application status changes, saved-search matches, and partner-follow matches produce
ONLY an in-app bell notification. Zero email is ever sent for any of these three triggers** — a user
must be logged in and looking at the site to ever see them; there is no re-engagement channel (email,
push, SMS) that reaches a user who isn't already back on the site.

## 4. Verdict table (implemented / configured / delivered)

| Flow | Implemented in code | Live-configured (Resend key present) | Production-tested (inbox confirmed) |
|---|---|---|---|
| Signup confirmation | **NOT_FOUND** — `src/app/regisztracio/page.tsx:31-35` calls `supabase.auth.signUp()` with no `emailRedirectTo` and immediately redirects to `/profil` on success (`line 48`) with no "check your email" interstitial — consistent with Supabase Auth's email-confirmation requirement being disabled for this project, so no confirmation email is part of the flow at all, by design or by default config | N/A | N/A |
| Application received (applicant) | **WORKING** (code) | Yes, Prod/Preview only | **NOT_VERIFIED** |
| Partner notified of new application | **WORKING** (code) | Yes, Prod/Preview only | **NOT_VERIFIED** |
| Application status change | **NOT_FOUND** (email) / in-app only, migration 007 | N/A | N/A |
| Adoption completed | **NOT_FOUND** — no trigger point exists in the data model (see report 13 §3) | N/A | N/A |
| Donation receipt | **NOT_FOUND** — no donation flow exists (report 07) | N/A | N/A |
| Recurring donation / Club lifecycle | **NOT_FOUND** — no Club exists (report 09) | N/A | N/A |
| Password reset | **NOT_FOUND** — no reset flow exists anywhere | N/A | N/A |
| Admin notification (new partner, etc.) | **NOT_FOUND** — admins must manually check `/admin/partners` | N/A | N/A |

`NOT VERIFIED: whether Supabase's own built-in auth emails (confirmation, magic link, password
recovery) are enabled at the Supabase-project-config level (Auth → Email Templates) independent of
this application's own code — that setting lives in Supabase project configuration, not in this git
repository, and was not accessible for a code-only audit. The application-code observation that
signUp() never waits for or references a confirmation step (§4, "Signup confirmation" row) is the
strongest evidence available from within the repo, and matches this session's earlier live test where
registration returned an active session immediately with no confirmation step required.`

`NOT VERIFIED: actual inbox delivery of either wired email (application-received /
application-confirmation) in the production environment — no test submission against production was
performed with a real, checkable inbox during this audit.`
