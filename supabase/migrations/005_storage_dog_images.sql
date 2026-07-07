-- Sprint 5: Supabase Storage bucket for dog images

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
