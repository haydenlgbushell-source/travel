-- Postgres grants EXECUTE on new functions to PUBLIC, so the earlier
-- `grant ... to authenticated` widened nothing — anon could already call
-- all four through /rest/v1/rpc. Each one gates internally, so a signed-out
-- caller got an exception or zero rows rather than data. But none of them
-- has any business being reachable signed out: agency branding is read by
-- members and by people on the trip, and a client reached through an access
-- code holds a real (anonymous) session, which is the authenticated role.
revoke execute on function public.admin_set_trip_agency(uuid, uuid) from public, anon;
revoke execute on function public.agency_branding_get(uuid) from public, anon;
revoke execute on function public.trip_branding(uuid) from public, anon;
revoke execute on function public.agency_branding_set(uuid, text, text, text, text) from public, anon;

grant execute on function public.admin_set_trip_agency(uuid, uuid) to authenticated;
grant execute on function public.agency_branding_get(uuid) to authenticated;
grant execute on function public.trip_branding(uuid) to authenticated;
grant execute on function public.agency_branding_set(uuid, text, text, text, text) to authenticated;
