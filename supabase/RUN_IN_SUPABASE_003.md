# Migration 003 – Run in Supabase SQL Editor

The `adoption_applications` table currently only allows authenticated users to insert rows.
To allow anonymous visitors to submit the contact form, run the following SQL in your
Supabase project's **SQL Editor** (Dashboard → SQL Editor → New Query):

```sql
create policy "Anyone can submit adoption application"
  on adoption_applications for insert
  with check (true);
```

**Why this is needed:**
The existing RLS policy `"Applicants can create applications"` requires `auth.uid() is not null`,
which blocks unauthenticated users. This new policy adds an open insert rule so that any
visitor (logged in or not) can submit an adoption enquiry via the contact form.

**Security note:** The form collects name, email, phone and message only. No user data is
exposed. Partners and admins can view these enquiries via their dashboards.
