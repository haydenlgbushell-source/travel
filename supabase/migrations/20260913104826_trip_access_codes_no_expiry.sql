-- A "trip code" is meant to stay valid for the whole trip -- the 90-day
-- default (a reasonable guard for a one-off client link, the only thing
-- this table was built for) is exactly what makes it a poor fit for
-- something an organiser hands to travel companions to keep using, and
-- there's no way today to issue one that doesn't quietly expire under
-- them. expires_at going nullable, with NULL meaning "never", covers
-- that without touching how existing timed codes behave.
alter table public.trip_access_codes
  alter column expires_at drop not null,
  alter column expires_at drop default;

create or replace function public.redeem_access_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_trip_id uuid;
  v_role text;
  v_created_by uuid;
begin
  if auth.uid() is null then
    raise exception 'sign in first';
  end if;

  select trip_id, role, created_by into v_trip_id, v_role, v_created_by
  from public.trip_access_codes
  where code = p_code
    and revoked_at is null
    and (expires_at is null or expires_at > now())
    and (max_uses is null or use_count < max_uses)
  for update;

  if v_trip_id is null then
    raise exception 'code not found, revoked, expired, or fully used';
  end if;

  update public.trip_access_codes set use_count = use_count + 1 where code = p_code;

  insert into public.trip_members (trip_id, account_id, role, invited_by)
  values (v_trip_id, auth.uid(), v_role, v_created_by)
  on conflict (trip_id, account_id) do nothing;

  return v_trip_id;
end;
$function$;
