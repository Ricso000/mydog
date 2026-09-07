# Database Migration Operating Procedure

## Why this document exists

The 2026-09-06 launch-readiness audit (`docs/audit-2026-09-launch-readiness/15-production-readiness.md` §4) found that all migrations `001`–`010` had an **empty** `remote` entry in `supabase migration list` against production, even though the schema was fully live — meaning every migration to that point had been applied by hand, pasting SQL into the Supabase Dashboard's SQL Editor, not via the CLI. The repo's own `supabase/RUN_IN_SUPABASE_EDITOR.md` documents why: at the time, "the anon/publishable key does not have DDL privileges," "`psql` is not installed," and the CLI's `db push` "requires a service role key / linked project config" that hadn't been set up yet.

This meant the CLI's own bookkeeping table (`supabase_migrations.schema_migrations`) had no record of any of it — so a future `supabase db push` would have tried to re-run `create table`/`create type` statements against objects that already existed, which fails at best and could behave unpredictably at worst.

**This has been fixed** (2026-09-06, Phase 0 of the post-audit execution plan): `supabase migration repair --status applied --linked 001 002 ... 012` was run against production. This command **only writes rows into the CLI's tracking table** — it does not execute any migration SQL — so no risk was taken re-running DDL that already existed. Verified immediately after: `supabase migration list --linked` shows `local` = `remote` for all 12 migrations, and `supabase db push --linked --dry-run` reports "Remote database is up to date."

## The rule, going forward

**Every future schema change must be a migration file in `supabase/migrations/`, committed to git, and applied via the CLI — never a manual Dashboard SQL Editor paste again.**

### Applying a new migration to production

```bash
export SUPABASE_ACCESS_TOKEN=<a Supabase personal access token with project access>
supabase link --project-ref eikkgaocpkhwdgndiupm   # once per machine/session
supabase db push --linked --dry-run                 # always review first
supabase db push --linked --yes                     # apply for real
supabase migration list --linked                    # confirm local == remote afterward
```

### Applying the same migration to the CI Test project (`MyDog CI Test`, ref `zzkudljlyvkjfkjwamcn`)

The CI Test project should always carry the same schema as production, one migration behind at most. Since it's a fully separate, isolated project (see `docs/implementation/phase-0-1-plan.md`), pushing to it is zero-risk and should happen first as a sanity check before touching production:

```bash
supabase db push --db-url "postgresql://postgres:<CI-test-db-password>@db.zzkudljlyvkjfkjwamcn.supabase.co:5432/postgres" --include-all --yes
```

(`--db-url` avoids re-linking the local CLI session away from production; the CI Test project's DB password is stored only in the team's password manager / CI secrets, never in this repo.)

### What "repair" is for, and what it is not for

`supabase migration repair --status applied <version>` marks a migration as already-applied in the CLI's bookkeeping **without running its SQL**. It exists for exactly the situation this project was in: a migration is genuinely, verifiably already live (applied by some other means), and the CLI's tracking just needs to catch up to reality. **Never** use `repair --status applied` on a migration that has *not* actually been applied to that database — that would create a false record and cause a real, needed schema change to be silently skipped by future `db push` runs. If ever in doubt, `supabase db push --dry-run` first and read its output carefully before repairing anything.

### Numbering

Migrations are numbered sequentially (`001`, `002`, ... `013`, ...) — always check `ls supabase/migrations/` for the current highest number before naming a new one, and never renumber or reorder an existing migration file once it has been applied anywhere (production or the CI Test project).
