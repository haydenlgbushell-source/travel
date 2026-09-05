-- A confirmation kept with the item itself — a boarding pass, an e-ticket,
-- a booking PDF — rather than only ever a copy left behind in an inbox that
-- may have no signal on the day it's actually needed. Same shape as
-- trip-item-photos (public read, Organiser/Editor write, scoped by
-- my_trip_role on the object path's trip id), but its own bucket so a
-- document never turns up mixed into a photo listing, and with the size/
-- MIME limits trip-item-photos only got added after the fact.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trip-item-documents',
  'trip-item-documents',
  true,
  10485760, -- 10MB, matches MAX_ITEM_DOCUMENT_BYTES in trip-data.ts
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
);

create policy "trip_item_documents_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'trip-item-documents');

create policy "trip_item_documents_editor_write"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'trip-item-documents'
  and my_trip_role((storage.foldername(name))[1]::uuid) = any (array['Organiser', 'Editor'])
);

create policy "trip_item_documents_editor_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'trip-item-documents'
  and my_trip_role((storage.foldername(name))[1]::uuid) = any (array['Organiser', 'Editor'])
)
with check (
  bucket_id = 'trip-item-documents'
  and my_trip_role((storage.foldername(name))[1]::uuid) = any (array['Organiser', 'Editor'])
);

create policy "trip_item_documents_editor_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'trip-item-documents'
  and my_trip_role((storage.foldername(name))[1]::uuid) = any (array['Organiser', 'Editor'])
);
