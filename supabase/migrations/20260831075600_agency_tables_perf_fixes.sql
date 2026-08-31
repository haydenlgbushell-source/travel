-- Two small perf fixes the advisors flagged on this session's own tables:
-- (1) FK columns with no covering index — cheap to add now, before any of
--     these tables have real volume.
-- (2) auth.uid() inside an insert policy's with-check gets re-evaluated per
--     row rather than once per statement unless it's wrapped as a
--     sub-select — the standard Postgres RLS optimisation.
create index if not exists agency_activities_created_by_idx
  on public.agency_activities (created_by);
create index if not exists agency_activity_template_items_activity_id_idx
  on public.agency_activity_template_items (activity_id);
create index if not exists agency_activity_templates_created_by_idx
  on public.agency_activity_templates (created_by);
create index if not exists agency_invites_created_by_idx
  on public.agency_invites (created_by);
create index if not exists agency_invites_redeemed_agency_id_idx
  on public.agency_invites (redeemed_agency_id);
create index if not exists agency_invites_redeemed_by_idx
  on public.agency_invites (redeemed_by);

drop policy "agency_activities_insert" on public.agency_activities;
create policy "agency_activities_insert"
on public.agency_activities for insert
with check (is_agency_member(agency_id) and created_by = (select auth.uid()));

drop policy "agency_activity_templates_insert" on public.agency_activity_templates;
create policy "agency_activity_templates_insert"
on public.agency_activity_templates for insert
with check (is_agency_member(agency_id) and created_by = (select auth.uid()));
