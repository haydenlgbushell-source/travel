-- An agency's reusable library of things to do, by country and city — built
-- once, dropped into any client trip that visits the same place rather than
-- retyped from scratch every time. Kept deliberately smaller than a full
-- trip item: no time, no travel leg, nothing that only makes sense pinned to
-- one specific day.
create table public.agency_activities (
  id         uuid primary key default gen_random_uuid(),
  agency_id  uuid not null references public.agencies (id) on delete cascade,
  country    text not null,
  city       text not null,
  kind       text not null default 'Do',
  title      text not null,
  place      text,
  lat        double precision,
  lng        double precision,
  note       text,
  cost_each  numeric(10,2),
  photo_url  text,
  created_by uuid not null default auth.uid() references public.accounts (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index agency_activities_agency_idx on public.agency_activities (agency_id, country, city);

alter table public.agency_activities enable row level security;

-- Same trust model as trip_agency_details: real access control is the RLS
-- predicate (is_agency_member), not the grantee list — but unlike that
-- table's original migration, anon gets no grant at all here, since there's
-- no case where an agency's internal activity library should be anon-
-- reachable the way a trip invite or access code deliberately is.
grant select, insert, update, delete on public.agency_activities to authenticated;

create policy "agency_activities_select"
on public.agency_activities for select
using (is_agency_member(agency_id));

create policy "agency_activities_insert"
on public.agency_activities for insert
with check (is_agency_member(agency_id) and created_by = auth.uid());

create policy "agency_activities_update"
on public.agency_activities for update
using (is_agency_member(agency_id))
with check (is_agency_member(agency_id));

create policy "agency_activities_delete"
on public.agency_activities for delete
using (is_agency_member(agency_id));
