-- A real upload, not a pasted URL — an agency owner picks a file and it
-- lands in a bucket this project controls, at {agency_id}/{filename}. Public
-- read (loadTripBranding already serves an anonymous access-code guest, so
-- the logo itself was never going to be any more private than that); write
-- is owner-only, scoped by the agency_id folder segment in the object path.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'agency-logos',
  'agency-logos',
  true,
  2097152, -- 2MB
  array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
);

create policy "agency_logos_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'agency-logos');

create policy "agency_logos_owner_write"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'agency-logos'
  and public.is_agency_owner((storage.foldername(name))[1]::uuid)
);

create policy "agency_logos_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'agency-logos'
  and public.is_agency_owner((storage.foldername(name))[1]::uuid)
)
with check (
  bucket_id = 'agency-logos'
  and public.is_agency_owner((storage.foldername(name))[1]::uuid)
);

create policy "agency_logos_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'agency-logos'
  and public.is_agency_owner((storage.foldername(name))[1]::uuid)
);
