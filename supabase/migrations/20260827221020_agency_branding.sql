-- Agency branding: a logo, a name and two colours per agency, applied to
-- every client trip that agency owns.

create table if not exists public.agency_branding (
  agency_id  uuid primary key references public.agencies (id) on delete cascade,
  logo_url   text,
  wordmark   text,
  accent     text,
  head_bg    text,
  updated_at timestamptz not null default now()
);

-- Colours are read straight into CSS, so only a plain 6-digit hex gets in.
alter table public.agency_branding
  drop constraint if exists agency_branding_colour_format;
alter table public.agency_branding
  add constraint agency_branding_colour_format check (
    (accent  is null or accent  ~* '^#[0-9a-f]{6}$') and
    (head_bg is null or head_bg ~* '^#[0-9a-f]{6}$')
  );

-- A logo is loaded by the browser as an image. Restricting it to https here
-- keeps a javascript: or data: URL from ever reaching an <img src>.
alter table public.agency_branding
  drop constraint if exists agency_branding_logo_https;
alter table public.agency_branding
  add constraint agency_branding_logo_https check (
    logo_url is null or logo_url ~* '^https://'
  );

-- No direct table access: everything goes through the three functions below,
-- which is what lets a client on an access code read the branding of the
-- agency whose trip they are on without being handed the table itself.
alter table public.agency_branding enable row level security;
revoke all on public.agency_branding from anon, authenticated;

-- Read, for the agency's own people. Filters rather than raising, so an
-- agency with no branding and an account with no business here look the
-- same from the client: no rows.
create or replace function public.agency_branding_get(p_agency_id uuid)
returns setof public.agency_branding
language sql
stable
security definer
set search_path to 'public'
as $$
  select b.*
  from public.agency_branding b
  where b.agency_id = p_agency_id
    and public.is_agency_member(p_agency_id);
$$;

-- Read, for anyone who can open the trip — including a guest on an access
-- code, who has no agency relationship of their own. The predicate mirrors
-- the trips_select_member policy exactly, so this can never reveal the
-- existence of a trip the caller could not already read.
create or replace function public.trip_branding(p_trip_id uuid)
returns setof public.agency_branding
language sql
stable
security definer
set search_path to 'public'
as $$
  select b.*
  from public.trips t
  join public.agency_branding b on b.agency_id = t.agency_id
  where t.id = p_trip_id
    and t.agency_id is not null
    and (
      public.is_trip_member(t.id)
      or public.has_agency_access(t.id)
      or t.owner_id = auth.uid()
    );
$$;

-- Write, Owner only. An Agent can build client trips but not restyle the
-- agency they work for.
create or replace function public.agency_branding_set(
  p_agency_id uuid,
  p_logo_url  text,
  p_wordmark  text,
  p_accent    text,
  p_head_bg   text
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_agency_owner(p_agency_id) then
    raise exception 'not agency owner';
  end if;

  insert into public.agency_branding (agency_id, logo_url, wordmark, accent, head_bg, updated_at)
  values (
    p_agency_id,
    nullif(btrim(p_logo_url), ''),
    nullif(btrim(p_wordmark), ''),
    nullif(btrim(p_accent),   ''),
    nullif(btrim(p_head_bg),  ''),
    now()
  )
  on conflict (agency_id) do update set
    logo_url   = excluded.logo_url,
    wordmark   = excluded.wordmark,
    accent     = excluded.accent,
    head_bg    = excluded.head_bg,
    updated_at = now();
end;
$$;

grant execute on function public.agency_branding_get(uuid) to authenticated;
grant execute on function public.trip_branding(uuid) to authenticated;
grant execute on function public.agency_branding_set(uuid, text, text, text, text) to authenticated;
