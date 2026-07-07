# Sprint 5 — Dog images Storage bucket

Run the following SQL in the **Supabase SQL Editor** for your MyDog project.

## File: `supabase/migrations/005_storage_dog_images.sql`

```sql
-- Public bucket for dog photos (public read, partner-scoped write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dog-images', 'dog-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Anyone can view dog images (bucket is public anyway, this covers API access)
create policy "Public read dog images"
  on storage.objects for select
  using (bucket_id = 'dog-images');

-- Partner members can upload into their own partner folder: dog-images/<partner_id>/...
create policy "Partners upload dog images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'dog-images'
    and (
      (storage.foldername(name))[1] in (
        select partner_id::text from partner_members where profile_id = auth.uid()
      )
      or is_admin()
    )
  );

create policy "Partners update own dog images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'dog-images'
    and (
      (storage.foldername(name))[1] in (
        select partner_id::text from partner_members where profile_id = auth.uid()
      )
      or is_admin()
    )
  );

create policy "Partners delete own dog images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'dog-images'
    and (
      (storage.foldername(name))[1] in (
        select partner_id::text from partner_members where profile_id = auth.uid()
      )
      or is_admin()
    )
  );
```

## Notes

- A bucket publikus (a kutyafotók amúgy is publikusan jelennek meg az oldalon).
- Feltöltés csak bejelentkezett partner-tagoknak, kizárólag a saját `partner_id` mappájukba (vagy adminnak).
- Méretlimit: 5 MB, engedélyezett típusok: JPG, PNG, WebP.
