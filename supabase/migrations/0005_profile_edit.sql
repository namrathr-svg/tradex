-- ===========================================================================
-- 0005 — profile editing: bio/location columns + public avatars bucket.
-- Run this in the Supabase SQL Editor after the earlier migrations.
-- ===========================================================================

alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists location text;

-- Public avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_owner" on storage.objects;
create policy "avatars_insert_owner"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_owner" on storage.objects;
create policy "avatars_update_owner"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete_owner" on storage.objects;
create policy "avatars_delete_owner"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
