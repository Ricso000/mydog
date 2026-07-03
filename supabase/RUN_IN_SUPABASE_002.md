# Migration 002 – Partner Portal Trigger

## What this does

Adds a PostgreSQL trigger that automatically inserts the creating user as `owner`
into `partner_members` whenever a new row is inserted into `partners`.

This fixes the RLS issue where a newly registered partner user could not insert
into `partner_members` (no INSERT policy exists for regular users on that table).
The trigger runs as `security definer`, bypassing RLS.

## How to run

1. Open your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New query**
4. Paste the contents of `supabase/migrations/002_partner_portal.sql` into the editor
5. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

## SQL to run

```sql
-- Auto-add creator as 'owner' when a partner is created
create or replace function handle_new_partner()
returns trigger language plpgsql security definer as $$
begin
  insert into partner_members (partner_id, profile_id, role)
  values (new.id, auth.uid(), 'owner');
  return new;
end;
$$;

create trigger on_partner_created
  after insert on partners
  for each row execute function handle_new_partner();
```

## Verification

After running, you can verify the trigger was created by checking:

```sql
select trigger_name, event_manipulation, event_object_table
from information_schema.triggers
where trigger_name = 'on_partner_created';
```

## Notes

- This only affects **new** partner registrations going forward.
- Existing partners in the database will NOT have a `partner_members` row created retroactively.
- If you need to backfill existing partners, you will need a separate migration.
