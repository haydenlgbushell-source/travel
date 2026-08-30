-- Lets an admin invite someone to create their own brand-new agency, via a
-- one-time link rather than the admin setting a password on their behalf.
-- The invited person signs up for their own account; the invite token rides
-- along in that signup's auth.users.raw_user_meta_data (set client-side via
-- supabase.auth.signUp options.data) so it survives the email-confirmation
-- redirect, which does not preserve URL hashes. redeem_agency_invite() then
-- reads the token from the *caller's own* metadata (via auth.uid()) rather
-- than accepting one as a parameter, so knowing a token alone can't be used
-- to redeem it onto someone else's account.

create table public.agency_invites (
  id                 uuid primary key default gen_random_uuid(),
  agency_name        text not null,
  token              text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by         uuid not null references public.accounts (id),
  expires_at         timestamptz not null default (now() + interval '14 days'),
  redeemed_at        timestamptz,
  redeemed_by        uuid references public.accounts (id),
  redeemed_agency_id uuid references public.agencies (id),
  created_at         timestamptz not null default now()
);

alter table public.agency_invites enable row level security;
revoke all on public.agency_invites from anon, authenticated;

create or replace function public.admin_create_agency_invite(p_agency_name text)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_name text := btrim(p_agency_name);
  v_token text;
begin
  if not exists (select 1 from public.accounts where accounts.id = auth.uid() and accounts.is_admin) then
    raise exception 'not authorized';
  end if;
  if v_name = '' then
    raise exception 'agency name required';
  end if;

  insert into public.agency_invites (agency_name, created_by)
  values (v_name, auth.uid())
  returning token into v_token;

  return v_token;
end;
$$;

create or replace function public.get_agency_invite(p_token text)
returns table (agency_name text, valid boolean)
language sql
stable
security definer
set search_path to 'public'
as $$
  select i.agency_name, (i.redeemed_at is null and i.expires_at > now())
  from public.agency_invites i
  where i.token = p_token;
$$;

create or replace function public.redeem_agency_invite()
returns uuid
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare
  v_token text;
  v_agency_name text;
  v_agency_id uuid;
begin
  if auth.uid() is null then
    raise exception 'sign in first';
  end if;
  if exists (select 1 from public.agencies where agencies.owner_account_id = auth.uid()) then
    raise exception 'account already owns an agency';
  end if;

  select u.raw_user_meta_data ->> 'agency_invite_token' into v_token
  from auth.users u
  where u.id = auth.uid();

  if v_token is null then
    raise exception 'no agency invite on this account';
  end if;

  update public.agency_invites
  set redeemed_at = now(), redeemed_by = auth.uid()
  where token = v_token and redeemed_at is null and expires_at > now()
  returning agency_name into v_agency_name;

  if v_agency_name is null then
    raise exception 'invite not found, already used, or expired';
  end if;

  insert into public.agencies (owner_account_id, name)
  values (auth.uid(), v_agency_name)
  returning id into v_agency_id;

  update public.agency_invites set redeemed_agency_id = v_agency_id where token = v_token;

  return v_agency_id;
end;
$$;

revoke execute on function public.admin_create_agency_invite(text) from public, anon;
grant  execute on function public.admin_create_agency_invite(text) to authenticated;

-- Deliberately anon-reachable, same as get_invite(): a person opening the
-- invite link has no session yet, and it only ever leaks an agency name plus
-- whether the link is still valid.
grant  execute on function public.get_agency_invite(text) to anon, authenticated;

revoke execute on function public.redeem_agency_invite() from public, anon;
grant  execute on function public.redeem_agency_invite() to authenticated;
