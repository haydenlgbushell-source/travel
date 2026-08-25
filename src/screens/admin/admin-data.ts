import { supabase } from "../../lib/supabase";

export interface AdminAccountRow {
  id: string;
  mobile: string;
  name?: string;
  isAnonymous: boolean;
  email: string;
  emailConfirmedAt?: string;
  createdAt: string;
}

export interface AdminTripRow {
  id: string;
  name: string;
  dates: string;
  ownerId: string;
  ownerMobile: string;
  agencyId?: string;
  fromExample: boolean;
  memberCount: number;
  createdAt: string;
}

interface AccountRpcRow {
  id: string;
  mobile: string | null;
  name: string | null;
  is_anonymous: boolean;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
}

interface TripRpcRow {
  id: string;
  name: string;
  dates: string;
  owner_id: string;
  owner_mobile: string | null;
  agency_id: string | null;
  from_example: boolean;
  member_count: number;
  created_at: string;
}

export interface AdminAgencyRow {
  id: string;
  name: string;
  ownerAccountId: string;
  ownerMobile: string;
  agentCount: number;
  createdAt: string;
}

interface AgencyRpcRow {
  id: string;
  name: string;
  owner_account_id: string;
  owner_mobile: string | null;
  agent_count: number;
  created_at: string;
}

/** Both RPCs check is_admin on the caller server-side and return nothing at
 *  all if that fails — there's no client-side gate to bypass, this is just
 *  reading what the database already refused everyone else. */
export async function adminListAccounts(): Promise<AdminAccountRow[]> {
  const { data, error } = await supabase.rpc("admin_list_accounts");
  if (error) throw error;
  return (data as AccountRpcRow[]).map((r) => ({
    id: r.id,
    mobile: r.mobile ?? "",
    name: r.name ?? undefined,
    isAnonymous: r.is_anonymous,
    email: r.email,
    emailConfirmedAt: r.email_confirmed_at ?? undefined,
    createdAt: r.created_at,
  }));
}

export async function adminListTrips(): Promise<AdminTripRow[]> {
  const { data, error } = await supabase.rpc("admin_list_trips");
  if (error) throw error;
  return (data as TripRpcRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    dates: r.dates,
    ownerId: r.owner_id,
    ownerMobile: r.owner_mobile ?? "",
    agencyId: r.agency_id ?? undefined,
    fromExample: r.from_example,
    memberCount: Number(r.member_count),
    createdAt: r.created_at,
  }));
}

export async function adminListAgencies(): Promise<AdminAgencyRow[]> {
  const { data, error } = await supabase.rpc("admin_list_agencies");
  if (error) throw error;
  return (data as AgencyRpcRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    ownerAccountId: r.owner_account_id,
    ownerMobile: r.owner_mobile ?? "",
    agentCount: Number(r.agent_count),
    createdAt: r.created_at,
  }));
}

/** The only way an account gets agency access at all — makes it that
 *  account's agency Owner. Server-side this is is_admin-gated the same way
 *  the two list RPCs are, and refuses an account that already owns one. */
export async function adminCreateAgency(accountId: string, name: string): Promise<void> {
  const { error } = await supabase.rpc("admin_create_agency", {
    p_account_id: accountId,
    p_name: name,
  });
  if (error) throw error;
}

/** Undoes a grant. Client trips aren't deleted — they lose the agency tag
 *  and carry on as ordinary trips belonging to whoever built them, so this
 *  returns how many that affects for the caller to confirm against. */
export async function adminRevokeAgency(agencyId: string): Promise<number> {
  const { data, error } = await supabase.rpc("admin_revoke_agency", {
    p_agency_id: agencyId,
  });
  if (error) throw error;
  return Number(data ?? 0);
}
