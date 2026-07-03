# Running the Migration Manually

The full schema SQL is in `supabase/migrations/001_initial_schema.sql`.
The seed data is in `supabase/seed.sql`.

## Steps

1. Open the Supabase Dashboard: https://supabase.com/dashboard/project/eikkgaocpkhwdgndiupm
2. Go to **SQL Editor** (left sidebar)
3. Click **New query**
4. Paste the contents of `supabase/migrations/001_initial_schema.sql` and click **Run**
5. After the schema is created, paste the contents of `supabase/seed.sql` and click **Run**

## Why manual?

- The anon/publishable key does not have DDL privileges (cannot create tables)
- `psql` is not installed on this machine
- The Supabase CLI (`supabase db push`) requires a service role key / linked project config

## Supabase CLI alternative (if you have a service key)

```bash
supabase link --project-ref eikkgaocpkhwdgndiupm
supabase db push
```
