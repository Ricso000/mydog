# 15 — Production Readiness

Audit date: 2026-09-06. Read-only checks only; no destructive commands were run (`supabase db push`/`db reset` explicitly avoided). Secrets are never printed — Vercel CLI values shown as `Hidden` are the CLI's own redaction, not ours.

## 1. Vercel project & deployments

- Project is linked: `.vercel/project.json` → `{"projectId":"prj_Us9EmOj2kmmJMpmnnI76Qwc9GUIU","orgId":"team_94QWqRv3pYBRSWBf02ADX6Z3","projectName":"mydog"}`.
- `vercel inspect https://rescueconnect-nu.vercel.app` confirms the alias resolves to the latest production deployment (`dpl_BV8D2ZfN5oxJwNiRncJJ59BhVfdj`, target `production`, status `● Ready`, created "30d ago" from audit date). Aliases on that deployment: `rescueconnect-nu.vercel.app`, `mydog-richards-projects-4b5b46d6.vercel.app`, `mydog-git-main-richards-projects-4b5b46d6.vercel.app`.
- `vercel ls mydog` shows 20 most-recent deployments, all with `Environment: Production` and `Status: ● Ready`, ages ranging 30d–66d — i.e. every deploy in the visible history succeeded; no failed/errored deployments are visible in this window. NOT VERIFIED beyond this window (older deploys not checked; command truncated at ~20 rows).
- Deployment builds run on Vercel Functions in region `iad1` (from `vercel inspect` build list, e.g. `λ index (1.22MB) [iad1]`).

## 2. Environment variables — Production vs Preview vs local

`vercel env ls production` output (values redacted by the CLI itself, "Hidden"):

```
 name                               value     type                environments                created
 NEXT_PUBLIC_SUPABASE_ANON_KEY      Hidden    Sensitive           Production                  60d ago
 NEXT_PUBLIC_SUPABASE_URL           Hidden    Sensitive           Production                  60d ago
 RESEND_API_KEY                     Hidden    Sensitive           Preview, Production         60d ago
```

`vercel env ls preview` output:

```
 name                               value     type                environments                created
 NEXT_PUBLIC_SUPABASE_ANON_KEY      Hidden    Sensitive           Preview                     60d ago
 NEXT_PUBLIC_SUPABASE_URL           Hidden    Sensitive           Preview                     60d ago
 RESEND_API_KEY                     Hidden    Sensitive           Preview, Production          60d ago
```

Local `.env.local` (keys only, values redacted by us):

```
NEXT_PUBLIC_SUPABASE_URL=<redacted>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<redacted>
# Created by Vercel CLI
VERCEL_OIDC_TOKEN=<redacted>
```

**Finding, verified**: `RESEND_API_KEY` is configured for both Preview and Production on Vercel, but is **absent from local `.env.local`**. Cross-checked against `src/lib/email.ts:6-13` (`getResend()`): when `RESEND_API_KEY` is falsy, the function logs `"[email] RESEND_API_KEY nincs beállítva – email küldés kihagyva."` (line 9) and returns `null` (line 10); the caller `send()` (lines 15-22) then no-ops (`if (!resend) return;`, line 17) without throwing. **Net effect**: email sending (application-received / confirmation emails, `src/lib/email.ts:43-83`) is silently disabled in local dev and should work in Production/Preview deployments on Vercel. Status: WORKING (in Production/Preview), by design a no-op locally — not a bug, but worth knowing when testing locally and seeing "no email arrived."

No `EMAIL_FROM` variable is set in either environment (not listed in either `env ls` output) — production emails send from the fallback `MyDog <onboarding@resend.dev>` (`src/lib/email.ts:3`), Resend's shared sandbox sender domain, not a verified custom domain. This is worth flagging for deliverability at scale/reputation, though functionally it works for a 60-day pilot.

## 3. Staging environment

Vercel Preview deployments function as informal staging: `vercel env ls preview` (above) confirms Preview has its own env-var scope (same Supabase project as Production — i.e. previews point at the **same live database**, not an isolated staging DB). No separate Supabase project exists for staging: `supabase projects list` shows only two projects total, "Family Budget" (unrelated, `status: INACTIVE`) and "MyDog projekt" (`eikkgaocpkhwdgndiupm`, linked, `ACTIVE_HEALTHY`) — no second MyDog-related Supabase project for staging/dev isolation. **Risk**: any preview deployment (e.g. from a feature branch) reads/writes the same production data, since `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` are identical across Preview and Production scopes per the `env ls` output above.

## 4. Supabase migration history vs. live schema — verified operational risk

Ran (read-only): `supabase migration list` (after `export SUPABASE_ACCESS_TOKEN=$(cat <token file>)`), output:

```json
{"migrations":[
  {"local":"001","remote":"","time":"001"},
  {"local":"002","remote":"","time":"002"},
  {"local":"003","remote":"","time":"003"},
  {"local":"004","remote":"","time":"004"},
  {"local":"005","remote":"","time":"005"},
  {"local":"006","remote":"","time":"006"},
  {"local":"007","remote":"","time":"007"},
  {"local":"008","remote":"","time":"008"},
  {"local":"009","remote":"","time":"009"},
  {"local":"010","remote":"","time":"010"}
],"message":"Migrations listed"}
```

**Confirmed**: all 10 local migration files (`001_initial_schema.sql` through `010_partner_follow_notifications.sql`) have an **empty `remote` column** — the Supabase CLI's own migration-history bookkeeping (the `supabase_migrations.schema_migrations` table it maintains) has no record of any of these ever being applied via `supabase db push`/CLI. This is despite the schema clearly existing and being live (the app functions against real data, `supabase projects list` shows the project `ACTIVE_HEALTHY`).

This is corroborated by `supabase/RUN_IN_SUPABASE_EDITOR.md` (read in full), which explicitly documents the actual deployment method used:

> "## Why manual?
> - The anon/publishable key does not have DDL privileges (cannot create tables)
> - `psql` is not installed on this machine
> - The Supabase CLI (`supabase db push`) requires a service role key / linked project config"

The repo also contains `RUN_IN_SUPABASE_002.md` through `RUN_IN_SUPABASE_006.md` — per-migration manual instructions — further supporting that migrations were pasted into the Supabase Dashboard SQL Editor by hand rather than applied via CLI. Migrations 007–010 have no corresponding `RUN_IN_SUPABASE_0XX.md` file (`find supabase -type f` lists none for 007–010), so their application method is **NOT VERIFIED** beyond the same empty-`remote` CLI evidence — plausibly the same manual process continued informally without new instruction files.

**Operational risk (verified mechanism, plain statement)**: because the CLI has no record of these migrations, a future `supabase db push` from this repo would attempt to (re-)apply all 10 migrations from scratch against a database that already has this schema — this would fail on `create table`/`create type` conflicts at minimum, and could error destructively depending on statement ordering. This was **not tested** (per instructions, `db push`/`db reset` were not run). Anyone continuing development must either (a) manually mark these migrations as applied in the CLI's tracking table, or (b) continue the manual SQL-Editor workflow and keep the CLI's migration history and the live schema informally in sync by hand. Status: **BLOCKED** (from using standard CLI-driven migration workflows safely, until reconciled).

## 5. Backups

Not independently verified via CLI in this session — `supabase status`/`postgres-config get` do not expose a backup-history endpoint reachable from the CLI's read-only commands used here. Per the user's own account, a Supabase Dashboard screenshot shared earlier in this session showed **"No backups"** as of 2026-09-06. Status: **NOT VERIFIED** by this audit directly (no CLI command available to confirm/deny from this session); the dashboard-screenshot claim is passed through as user-reported, not independently re-checked.

## 6. Rate limiting

`grep -rniE "rate.?limit|ratelimit" src` and a review of `src/proxy.ts` (full file read, 67 lines) show no rate-limiting logic, no `@upstash/ratelimit` or similar dependency in `package.json`, and no middleware-level throttling. The single custom API route (`src/app/api/applications/route.ts`) has input validation (email regex, required fields) but no per-IP/per-user submission throttling. Status: **NOT_FOUND**.

## 7. Secrets handling

- `.gitignore:34` contains `.env*`, confirming all local env files (`.env.local` included) are git-ignored and were never committed.
- No secrets were found hardcoded in `src/` — every credential-shaped value flows through `process.env.*` (full list cross-referenced in 01-technical-architecture.md §7).
- `.vercel/` (containing `project.json` with project/org IDs, not secrets) is also git-ignored per `.gitignore:37` (`# vercel` / `.vercel`).
- The `SUPABASE_ACCESS_TOKEN` used for this audit's CLI checks was sourced from a scratchpad file outside the repo and exported only into the local shell session; it was never written into repo files.

## 8. Domain / HTTPS

- Production currently resolves only on Vercel-issued domains: `rescueconnect-nu.vercel.app` (primary alias used in this audit) and `mydog-richards-projects-4b5b46d6.vercel.app` / `mydog-git-main-richards-projects-4b5b46d6.vercel.app` (per `vercel inspect` Aliases list, §1 above). All Vercel-issued `*.vercel.app` domains get automatic HTTPS by platform default.
- `vercel domains ls` was run and returned **9 domains** under the account (`richards-projects-4b5b46d6`), none of which is `rescueconnect`, `mydog`, or otherwise obviously tied to this project: `kovacsbalazsingatlan.com`, `saleselesben.hu`, `smartlivinghome.hu`, `voicescribe.eu`, `b22penthouses.hu`, `drbanyaierika.hu`, `banyaierika.hu`, `compassmarketing.hu`, `teacherpass.eu` — these belong to the account's other projects. **Confirmed: no custom domain is configured for the MyDog/rescueconnect project.** For a Hungarian public launch, a `.hu` (or similar) custom domain is not yet set up.

## 9. Logs / observability

- No dedicated observability tool is configured (cross-reference §11 of 01-technical-architecture.md — Sentry/LogRocket/Datadog/Bugsnag all absent via grep).
- Vercel provides basic function invocation logs by default for every deployment (standard platform behavior for all Vercel projects; this was not separately re-verified by pulling live log output in this session, since doing so would require triggering traffic — stated as INFERENCE/platform-default behavior, not independently tested here). No log drain, structured logging pipeline, or alerting was found in the codebase (no `console.log`→external-sink wiring; `console.warn`/`console.error` calls in `src/lib/email.ts:9,20` and `src/app/api/applications/route.ts:65` go only to Vercel's default stdout/stderr capture).

## 10. Summary status table

| Area | Status | Note |
|---|---|---|
| Production deploy | WORKING | 20/20 recent deploys `● Ready` |
| Preview/staging | PARTIAL | Preview envs exist but share the same live Supabase project — no data isolation |
| Env vars (prod) | WORKING | Supabase URL/anon key + Resend key all present in Production |
| Env vars (local dev email) | PARTIAL | `RESEND_API_KEY` intentionally/incidentally absent locally; email silently no-ops per `src/lib/email.ts:6-13` |
| Migration/CLI sync | BLOCKED | All 10 migrations show empty `remote` in `supabase migration list`; live schema was applied by hand via SQL Editor per `RUN_IN_SUPABASE_EDITOR.md` |
| Backups | NOT VERIFIED | User-reported dashboard screenshot said "No backups" (2026-09-06); no CLI confirmation obtained this session |
| Rate limiting | NOT_FOUND | No middleware/library found |
| Secrets hygiene | WORKING | `.env*` and `.vercel` both gitignored; no hardcoded secrets found |
| Custom domain | NOT_FOUND | Only Vercel-issued `*.vercel.app` domains in use; none of the account's 9 registered domains belong to this project |
| Observability | NOT_FOUND | No dedicated tool; default Vercel function logs only (platform default, not independently re-verified live) |
