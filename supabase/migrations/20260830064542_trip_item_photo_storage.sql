-- Recorded after the fact: this was applied directly to the live database
-- by a different PR (#10, "Let an item's photo be uploaded directly, not
-- just pulled from a website") without ever being committed to this
-- directory, so the repo's migration history didn't match the live schema.
-- This file reproduces what's actually applied, unmodified — see the
-- agency-review notes for the gap this leaves open (no file_size_limit or
-- allowed_mime_types on the bucket, unlike agency-logos).
insert into storage.buckets (id, name, public)
values ('trip-item-photos', 'trip-item-photos', true);

create policy "trip_item_photos_public_read"
on storage.objects for select
using (bucket_id = 'trip-item-photos');

create policy "trip_item_photos_editor_write"
on storage.objects for insert
with check (
  bucket_id = 'trip-item-photos'
  and my_trip_role((storage.foldername(name))[1]::uuid) = any (array['Organiser', 'Editor'])
);

create policy "trip_item_photos_editor_update"
on storage.objects for update
using (
  bucket_id = 'trip-item-photos'
  and my_trip_role((storage.foldername(name))[1]::uuid) = any (array['Organiser', 'Editor'])
)
with check (
  bucket_id = 'trip-item-photos'
  and my_trip_role((storage.foldername(name))[1]::uuid) = any (array['Organiser', 'Editor'])
);

create policy "trip_item_photos_editor_delete"
on storage.objects for delete
using (
  bucket_id = 'trip-item-photos'
  and my_trip_role((storage.foldername(name))[1]::uuid) = any (array['Organiser', 'Editor'])
);
