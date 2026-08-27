-- Agency branding: a logo, a name and two colours per agency, applied to
-- every client trip that agency owns.
--
-- Written against only the objects the client already calls, so nothing here
-- guesses at a table name it hasn't seen: `agencies`, and the existing
-- functions `my_agencies()` and `my_trip_role(uuid)`. If your schema names
-- the agency-membership table something this doesn't reference, that is on
-- purpose — the permission checks below go through those two functions
-- rather than reading the membership tables directly.

create table if not exists public.agency_branding (
  agency_id  uuid primary key references public.agencies (id) on delete cascade,
  logo_url   text,
  wordmark   text,
  accent     text,
  head_bg    text,
  updated_at timestamptz not null default now()
);

-- Colours are read straight into CSS, so only a plain 6-digit hex is allowed
-- in. The client validates too, but the client is not the gate.
alter table public.agency_branding
  drop constraint if exists agency_branding_colour_format;
alter table public.agency_branding
  add constraint agency_branding_colour_format check (
    (accent  is null or accent  ~* '^#[0-9a-f]{6}$') and
    (head_bg is null or head_bg ~* '^#[0-9a-f]{6}$')
  );

-- A logo is loaded by the browser as an image. Restricting it to https here
-- keeps a `javascript:` or `data:` URL from ever reaching an <img src>.
alter table public.agency_branding
  drop constraint if exists agency_branding_logo_https;
alter table public.agency_branding
  add constraint agency_branding_logo_https check (
    logo_url is null or logo_url ~* '^https://'
  );

-- No direct access at all: everything goes through the three functions
-- below, which is what lets a client on an access code read the branding of
-- the agency whose trip they are on without being given the table.
alter table public.agency_branding enable row level security;
revoke all on public.agency_branding from anon, authenticated;

-- Read, for the agency's own people.
create or replace function public.agency_branding_get(p_agency_id uuid)
returns setof public.agency_branding
language sql
security definer
set search_path = public
as $$
  select b.*
  from public.agency_branding b
  where b.agency_id = p_agency_id
    and exists (select 1 from public.my_agencies() m where m.id = p_agency_id);
$$;

-- Read, for anyone who can open the trip — including a guest on an access
-- code, who has no agency relationship of their own. my_trip_role() is the
-- same function the trip's own RLS is built on, so this can't widen who sees
-- a trip; it only says whose brand that trip carries.
create or replace function public.trip_branding(p_trip_id uuid)
returns setof public.agency_branding
language sql
security definer
set search_path = public
as $$
  select b.*
  from public.trips t
  join public.agency_branding b on b.agency_id = t.agency_id
  where t.id = p_trip_id
    and t.agency_id is not null
    and public.my_trip_role(p_trip_id) is not null;
$$;

-- Write, Owner only. An Agent can build trips but not restyle the agency.
create or replace function public.agency_branding_set(
  p_agency_id uuid,
  p_logo_url  text,
  p_wordmark  text,
  p_accent    text,
  p_head_bg   text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.my_agencies() m
    where m.id = p_agency_id and m.role = 'Owner'
  ) then
    raise exception 'not_agency_owner';
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

grant execute on function public.agency_branding_get(uuid)                    to authenticated;
grant execute on function public.trip_branding(uuid)                          to authenticated;
grant execute on function public.agency_branding_set(uuid, text, text, text, text) to authenticated;
