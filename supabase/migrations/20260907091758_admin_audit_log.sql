-- A minimal audit trail for admin actions (grant/revoke agency access,
-- agency invites, moving a trip's agency, resending a confirmation email).
-- Harmless to be light-touch about today — there's exactly one admin
-- account — but worth having in place before a second one ever exists,
-- rather than retrofitting it after the fact with no history to show.
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_account_id uuid not null references public.accounts (id),
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

-- No insert policy: every write goes through admin_log_action below, which
-- checks is_admin itself and stamps auth.uid() as the actor server-side, so
-- a log entry can't be forged as someone else having done it.
create policy "admin_audit_log_select"
on public.admin_audit_log for select
to authenticated
using (
  exists (select 1 from public.accounts where accounts.id = auth.uid() and accounts.is_admin)
);

create index admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);

create or replace function public.admin_log_action(p_action text, p_detail text default null)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (select 1 from public.accounts where accounts.id = auth.uid() and accounts.is_admin) then
    raise exception 'not authorized';
  end if;
  insert into public.admin_audit_log (actor_account_id, action, detail)
  values (auth.uid(), p_action, p_detail);
end;
$$;

grant execute on function public.admin_log_action(text, text) to authenticated;

create or replace function public.admin_list_audit_log()
returns table (
  id uuid,
  actor_account_id uuid,
  actor_mobile text,
  actor_name text,
  action text,
  detail text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select l.id, l.actor_account_id, a.mobile, a.name, l.action, l.detail, l.created_at
  from public.admin_audit_log l
  join public.accounts a on a.id = l.actor_account_id
  where exists (select 1 from public.accounts me where me.id = auth.uid() and me.is_admin)
  order by l.created_at desc
  limit 200;
$$;

grant execute on function public.admin_list_audit_log() to authenticated;
