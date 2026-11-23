alter table public.profiles
  add column if not exists avatar_url text;

alter table public.profiles
  drop constraint if exists profiles_avatar_url_check;
alter table public.profiles
  add constraint profiles_avatar_url_check
  check (avatar_url is null or char_length(avatar_url) <= 1000);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', true, 2097152,
  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatar_upload on storage.objects;
create policy avatar_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and name = (select auth.uid())::text || '/avatar'
  );

drop policy if exists avatar_read on storage.objects;
create policy avatar_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'profile-avatars'
    and name = (select auth.uid())::text || '/avatar'
  );

drop policy if exists avatar_replace on storage.objects;
create policy avatar_replace on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-avatars'
    and name = (select auth.uid())::text || '/avatar'
  )
  with check (
    bucket_id = 'profile-avatars'
    and name = (select auth.uid())::text || '/avatar'
  );

drop policy if exists avatar_delete on storage.objects;
create policy avatar_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-avatars'
    and name = (select auth.uid())::text || '/avatar'
  );
