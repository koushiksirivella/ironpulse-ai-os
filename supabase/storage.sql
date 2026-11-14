-- J7 Commerce Engine — image storage.
--
-- One public bucket. Product photos and gym logos are meant to be seen by
-- everyone, so public READ is correct. WRITE is operator-only: an anon visitor
-- who could upload would turn the bucket into free file hosting.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gym-media', 'gym-media', true, 5242880,     -- 5 MB ceiling per file
  array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists gym_media_public_read on storage.objects;
drop policy if exists gym_media_operator_write on storage.objects;

create policy gym_media_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'gym-media');

-- `to authenticated` alone is not a wall: public signup means anyone can become
-- authenticated. Without is_operator() this bucket is free file hosting for
-- anybody who reads the anon key out of the page source.
create policy gym_media_operator_write on storage.objects
  for all to authenticated
  using (bucket_id = 'gym-media' and public.is_operator())
  with check (bucket_id = 'gym-media' and public.is_operator());
