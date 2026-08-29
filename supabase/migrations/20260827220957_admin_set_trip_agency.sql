-- Lets an admin hand a trip to an agency, or take it back out of one.
--
-- RLS on `trips` deliberately refuses this from the client: both
-- trips_insert_own and trips_update_editor carry
--   (agency_id is null or is_agency_member(agency_id))
-- so an account can only ever tag a trip to an agency it belongs to. An
-- admin belongs to none of them, which is correct for everyone except the
-- admin, and is why the console's "hand to an agency" never took effect.
--
-- Gated on accounts.is_admin exactly as the other admin_* functions are.
create or replace function public.admin_set_trip_agency(
  p_trip_id   uuid,
  p_agency_id uuid
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (
    select 1 from public.accounts
    where accounts.id = auth.uid() and accounts.is_admin
  ) then
    raise exception 'not authorized';
  end if;

  if p_agency_id is not null
     and not exists (select 1 from public.agencies where agencies.id = p_agency_id) then
    raise exception 'no such agency';
  end if;

  update public.trips
     set agency_id = p_agency_id,
         updated_at = now()
   where trips.id = p_trip_id;

  if not found then
    raise exception 'no such trip';
  end if;
end;
$$;

grant execute on function public.admin_set_trip_agency(uuid, uuid) to authenticated;
