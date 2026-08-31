-- Closes a gap the review found: the bucket had no server-side size or
-- MIME cap, only the client-side check in uploadItemPhoto() — so any
-- Editor could bypass the JS entirely via the storage REST API and upload
-- an unbounded file of any type to a public bucket. Mirrors it to the
-- client's own limits (5MB, png/jpeg/webp) rather than inventing new ones.
update storage.buckets
set file_size_limit = 5242880, -- 5MB, matches MAX_ITEM_PHOTO_BYTES in trip-data.ts
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'trip-item-photos';

-- The four policies were also missing an explicit `to` role clause
-- (defaulting to PUBLIC, i.e. every role including service_role and
-- anything future), unlike every other bucket this session added —
-- tightened to match, without changing what they actually allow: public
-- read stays anon+authenticated (an access-code guest needs it), writes
-- stay authenticated-only since my_trip_role() already requires a real
-- trip membership.
drop policy "trip_item_photos_public_read" on storage.objects;
create policy "trip_item_photos_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'trip-item-photos');

drop policy "trip_item_photos_editor_write" on storage.objects;
create policy "trip_item_photos_editor_write"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'trip-item-photos'
  and my_trip_role((storage.foldername(name))[1]::uuid) = any (array['Organiser', 'Editor'])
);

drop policy "trip_item_photos_editor_update" on storage.objects;
create policy "trip_item_photos_editor_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'trip-item-photos'
  and my_trip_role((storage.foldername(name))[1]::uuid) = any (array['Organiser', 'Editor'])
)
with check (
  bucket_id = 'trip-item-photos'
  and my_trip_role((storage.foldername(name))[1]::uuid) = any (array['Organiser', 'Editor'])
);

drop policy "trip_item_photos_editor_delete" on storage.objects;
create policy "trip_item_photos_editor_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'trip-item-photos'
  and my_trip_role((storage.foldername(name))[1]::uuid) = any (array['Organiser', 'Editor'])
);
