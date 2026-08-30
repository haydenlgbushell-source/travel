-- A named bundle of an agency's own saved activities, scoped to one country
-- and city — "Kyoto Highlights", "Japan Essentials" — applied to a trip in
-- one action instead of adding each activity by hand. The join table just
-- orders the bundle; the activities themselves still live in
-- agency_activities, so editing one updates every template it's in.
create table public.agency_activity_templates (
  id         uuid primary key default gen_random_uuid(),
  agency_id  uuid not null references public.agencies (id) on delete cascade,
  country    text not null,
  city       text not null,
  name       text not null,
  created_by uuid not null default auth.uid() references public.accounts (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agency_activity_template_items (
  template_id uuid not null references public.agency_activity_templates (id) on delete cascade,
  activity_id uuid not null references public.agency_activities (id) on delete cascade,
  position    integer not null default 0,
  primary key (template_id, activity_id)
);

create index agency_activity_templates_agency_idx
  on public.agency_activity_templates (agency_id, country, city);
create index agency_activity_template_items_template_idx
  on public.agency_activity_template_items (template_id, position);

alter table public.agency_activity_templates enable row level security;
alter table public.agency_activity_template_items enable row level security;

grant select, insert, update, delete on public.agency_activity_templates to authenticated;
grant select, insert, update, delete on public.agency_activity_template_items to authenticated;

create policy "agency_activity_templates_select"
on public.agency_activity_templates for select
using (is_agency_member(agency_id));

create policy "agency_activity_templates_insert"
on public.agency_activity_templates for insert
with check (is_agency_member(agency_id) and created_by = auth.uid());

create policy "agency_activity_templates_update"
on public.agency_activity_templates for update
using (is_agency_member(agency_id))
with check (is_agency_member(agency_id));

create policy "agency_activity_templates_delete"
on public.agency_activity_templates for delete
using (is_agency_member(agency_id));

-- Junction rows inherit access from the parent template's agency, and every
-- write additionally has to prove the activity being linked belongs to that
-- same agency — otherwise one agency's template could point at another
-- agency's activity row and leak it through the join.
create policy "agency_activity_template_items_select"
on public.agency_activity_template_items for select
using (
  exists (
    select 1 from public.agency_activity_templates t
    where t.id = template_id and is_agency_member(t.agency_id)
  )
);

create policy "agency_activity_template_items_write"
on public.agency_activity_template_items for insert
with check (
  exists (
    select 1 from public.agency_activity_templates t
    join public.agency_activities a on a.agency_id = t.agency_id
    where t.id = template_id and a.id = activity_id and is_agency_member(t.agency_id)
  )
);

create policy "agency_activity_template_items_update"
on public.agency_activity_template_items for update
using (
  exists (
    select 1 from public.agency_activity_templates t
    where t.id = template_id and is_agency_member(t.agency_id)
  )
)
with check (
  exists (
    select 1 from public.agency_activity_templates t
    join public.agency_activities a on a.agency_id = t.agency_id
    where t.id = template_id and a.id = activity_id and is_agency_member(t.agency_id)
  )
);

create policy "agency_activity_template_items_delete"
on public.agency_activity_template_items for delete
using (
  exists (
    select 1 from public.agency_activity_templates t
    where t.id = template_id and is_agency_member(t.agency_id)
  )
);
