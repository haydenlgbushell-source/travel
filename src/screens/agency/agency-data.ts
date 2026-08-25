import { supabase } from "../../lib/supabase";
import { eventFromTripRow, type EventDetails } from "../trip-setup/event-data";

export interface Agency {
  id: string;
  name: string;
}

interface TripRow {
  id: string;
  name: string;
  dates: string;
  start_date: string;
  end_date: string;
  destination: string | null;
  lat: number | null;
  lng: number | null;
  from_example: boolean;
  agency_id?: string | null;
}

/** One agency per account, auto-provisioned the first time the travel-agent
 *  page opens — creating one up front for an account that never uses it
 *  would just be clutter. Only ever finds an agency this account *owns*;
 *  being added as a second Agent on someone else's agency has no UI yet
 *  (the schema supports it — agency_agents.role already distinguishes
 *  Owner/Agent — this just doesn't expose a way to invite one in). */
export async function loadOrCreateMyAgency(
  accountId: string,
  defaultName: string,
): Promise<Agency> {
  const { data: existing, error: selectError } = await supabase
    .from("agencies")
    .select("id, name")
    .eq("owner_account_id", accountId)
    .limit(1)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return existing as Agency;

  const { data: created, error: insertError } = await supabase
    .from("agencies")
    .insert({ owner_account_id: accountId, name: defaultName })
    .select("id, name")
    .single();
  if (insertError) throw insertError;
  return created as Agency;
}

/** Every trip tagged to this agency — RLS (has_agency_access) is what
 *  actually scopes this to agencies the caller belongs to, same as
 *  event-data.ts's loadEvents() relies on trip_members for personal ones. */
export async function loadAgencyTrips(agencyId: string): Promise<EventDetails[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("id, name, dates, start_date, end_date, destination, lat, lng, from_example, agency_id")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as TripRow[]).map(eventFromTripRow);
}
