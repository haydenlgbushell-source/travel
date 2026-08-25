import { supabase } from "../../lib/supabase";
import { eventFromTripRow, type EventDetails } from "../trip-setup/event-data";

export interface Agency {
  id: string;
  name: string;
  role: "Owner" | "Agent";
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
  theme_key: string;
}

interface AgencyRpcRow {
  id: string;
  name: string;
  role: string;
}

/** Agency access is granted, not self-served — an account only has one once
 *  the admin has designated it as an agency's Owner (or, once that UI
 *  exists, been added as an Agent to someone else's). This just reads
 *  whether that's true for the signed-in account; it never creates one. */
export async function loadMyAgency(): Promise<Agency | undefined> {
  const { data, error } = await supabase.rpc("my_agency");
  if (error) throw error;
  const row = (data as AgencyRpcRow[])[0];
  return row ? { id: row.id, name: row.name, role: row.role as Agency["role"] } : undefined;
}

/** Every trip tagged to this agency — RLS (has_agency_access) is what
 *  actually scopes this to agencies the caller belongs to, same as
 *  event-data.ts's loadEvents() relies on trip_members for personal ones. */
export async function loadAgencyTrips(agencyId: string): Promise<EventDetails[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("id, name, dates, start_date, end_date, destination, lat, lng, from_example, agency_id, theme_key")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as TripRow[]).map(eventFromTripRow);
}
