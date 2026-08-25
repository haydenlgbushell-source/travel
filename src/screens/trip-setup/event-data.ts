import { supabase } from "../../lib/supabase";

export interface EventDetails {
  /** Trip state is saved against this, so changing events can't show the
   *  previous trip's plan under the new one's dates. */
  id: string;
  name: string;
  /** Display string for the header, e.g. "14 – 19 August 2026". */
  dates: string;
  /** The real range the day strip is built from, ISO `YYYY-MM-DD`. */
  startDate: string;
  endDate: string;
  /** Where the trip is, and the coordinates it geocoded to — what makes
   *  weather and the map work for a real event rather than only for the
   *  hardcoded Chicago example. */
  destination?: string;
  lat?: number;
  lng?: number;
  /** Whether this event was seeded with the Chicago example itinerary. */
  fromExample?: boolean;
  /** Set when a travel agent created this on a client's behalf — null for
   *  every trip anyone makes for themselves. */
  agencyId?: string;
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

/** Shared with agency-data.ts, which lists trips the same way but filtered
 *  to one agency rather than "everything I can see". */
export function eventFromTripRow(row: TripRow): EventDetails {
  return {
    id: row.id,
    name: row.name,
    dates: row.dates,
    startDate: row.start_date,
    endDate: row.end_date,
    destination: row.destination ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    fromExample: row.from_example,
    agencyId: row.agency_id ?? undefined,
  };
}

/** Every trip the signed-in account can see — RLS (trip_members-based since
 *  Phase 2) is what actually scopes this, not a client-side filter, since a
 *  trip someone else invited them onto is exactly as real as one they made
 *  themselves. One device can be shared; signing out and in as someone else
 *  still can't reach the previous person's trips, because that account has
 *  no trip_members rows on them. */
export async function loadEvents(): Promise<EventDetails[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("id, name, dates, start_date, end_date, destination, lat, lng, from_example, agency_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as TripRow[]).map(eventFromTripRow);
}

/** Creates the trip if its id hasn't been seen, otherwise updates it in
 *  place — covers both "new event" and "edit an existing one" without the
 *  caller needing to know which. `event.agencyId`, when set, tags it as a
 *  client trip an agent created rather than a personal one — set once at
 *  creation and never touched by ordinary edits. */
export async function upsertEvent(accountId: string, event: EventDetails): Promise<void> {
  const { error } = await supabase.from("trips").upsert({
    id: event.id,
    owner_id: accountId,
    name: event.name,
    dates: event.dates,
    start_date: event.startDate,
    end_date: event.endDate,
    destination: event.destination ?? null,
    lat: event.lat ?? null,
    lng: event.lng ?? null,
    from_example: event.fromExample ?? false,
    agency_id: event.agencyId ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Deleting the trip row cascades to its saved content — nothing else needs
 *  cleaning up separately. */
export async function deleteEventRow(id: string): Promise<void> {
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw error;
}

/** Which trip to reopen on the next visit, so a reload — including one with
 *  no signal, now the shell is cached offline — lands back where you were
 *  rather than on an empty setup form. */
export async function loadCurrentEventId(accountId: string): Promise<string | undefined> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("current_trip_id")
    .eq("account_id", accountId)
    .maybeSingle();
  if (error) throw error;
  return data?.current_trip_id ?? undefined;
}

export async function saveCurrentEventId(
  accountId: string,
  eventId: string | undefined,
): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ account_id: accountId, current_trip_id: eventId ?? null });
  if (error) throw error;
}

export interface GeocodedPlace {
  label: string;
  lat: number;
  lng: number;
}

interface GeocodeResponse {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }>;
}

/** Open-Meteo's geocoding API — free and keyless, the same reasoning as the
 *  forecast and the CARTO map tiles. An unrecognised place resolves to
 *  nothing rather than guessing, so the trip simply has no coordinates and
 *  the weather strip stays quiet. */
export async function geocodePlace(place: string): Promise<GeocodedPlace | undefined> {
  const query = place.trim();
  if (!query) return undefined;

  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
  );
  if (!res.ok) throw new Error(`Geocoding ${res.status}`);
  const data = (await res.json()) as GeocodeResponse;
  const hit = data.results?.[0];
  if (!hit) return undefined;

  const parts = [hit.name, hit.admin1, hit.country].filter(Boolean);
  return { label: parts.join(", "), lat: hit.latitude, lng: hit.longitude };
}
