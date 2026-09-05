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
  /** The destination's country, as geocoding resolved it — drives the
   *  Info tab's emergency number and travel-advice link for a real trip,
   *  which used to only ever appear on the authored Chicago example. */
  country?: string;
  /** Whether this event was seeded with the Chicago example itinerary. */
  fromExample?: boolean;
  /** Set when a travel agent created this on a client's behalf — null for
   *  every trip anyone makes for themselves. */
  agencyId?: string;
  /** Which THEMES entry this trip renders in — chosen once at setup, seen by
   *  everyone on the trip, same as the "Trip style" picker's copy already
   *  promises. Always set (defaults server-side), never undefined. */
  themeKey: string;
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
  country: string | null;
  from_example: boolean;
  agency_id?: string | null;
  theme_key: string;
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
    country: row.country ?? undefined,
    fromExample: row.from_example,
    agencyId: row.agency_id ?? undefined,
    themeKey: row.theme_key,
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
    .select(
      "id, name, dates, start_date, end_date, destination, lat, lng, country, from_example, agency_id, theme_key",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as TripRow[]).map(eventFromTripRow);
}

/** Creates the trip if its id hasn't been seen, otherwise updates it in
 *  place — covers both "new event" and "edit an existing one" without the
 *  caller needing to know which. `event.agencyId`, when set, tags it as a
 *  client trip an agent created rather than a personal one — set once at
 *  creation and never touched by ordinary edits. */
export async function upsertEvent(
  accountId: string,
  event: EventDetails,
  isNew: boolean,
): Promise<void> {
  const { error } = await supabase.from("trips").upsert({
    id: event.id,
    /* Only stamped when the row is being created. Re-sending it on every
       edit would hand ownership to whoever saved last — which on an agency
       trip means the second agent to touch it quietly becomes the owner,
       while trip_members still lists the original creator as Organiser. */
    ...(isNew ? { owner_id: accountId } : {}),
    name: event.name,
    dates: event.dates,
    start_date: event.startDate,
    end_date: event.endDate,
    destination: event.destination ?? null,
    lat: event.lat ?? null,
    lng: event.lng ?? null,
    country: event.country ?? null,
    from_example: event.fromExample ?? false,
    agency_id: event.agencyId ?? null,
    theme_key: event.themeKey,
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

/** "14 – 19 August 2026" — spans a month name only once when both ends fall
 *  in the same month, the way the rest of the app already writes it. Returns
 *  an empty string for a range that ends before it starts, which is what
 *  stops such a trip being created at all: a reversed range generates no
 *  days, and a trip with no days can't be opened. */
export function formatDateRange(startISO: string, endISO: string): string {
  if (!startISO || !endISO) return "";
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  if (end < start) return "";

  const endMonth = end.toLocaleDateString("en-US", { month: "long" });
  const year = end.getFullYear();
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} – ${end.getDate()} ${endMonth} ${year}`;
  }
  const startMonth = start.toLocaleDateString("en-US", { month: "long" });
  return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth} ${year}`;
}

export interface GeocodedPlace {
  label: string;
  lat: number;
  lng: number;
  /** The country Photon resolved the place to, in English — absent for a
   *  hit with no country of its own (open ocean, a disputed territory
   *  Photon doesn't tag). */
  country?: string;
}

interface PhotonResponse {
  features?: Array<{
    geometry: { coordinates: [number, number] };
    properties: {
      name?: string;
      street?: string;
      city?: string;
      state?: string;
      country?: string;
    };
  }>;
}

/** Photon (komoot's OSM-backed geocoder) — free, keyless, and CORS-enabled
 *  for browser use, same reasoning as the CARTO map tiles it draws pins on.
 *
 *  Swapped in for Open-Meteo's geocoding API, which only indexes cities and
 *  towns — it had no way to resolve "Sydney Airport" or a named restaurant,
 *  which is most of what actually gets typed into an item's "Where" field.
 *  Photon is built on general OSM data (POIs, addresses, venues) as well as
 *  places, so the same call now serves both a trip's city-level destination
 *  and an item's specific venue. An unrecognised place still resolves to
 *  nothing rather than guessing, so the trip simply has no coordinates and
 *  the weather strip stays quiet. */
export async function geocodePlace(place: string): Promise<GeocodedPlace | undefined> {
  const query = place.trim();
  if (!query) return undefined;

  const res = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en`,
  );
  if (!res.ok) throw new Error(`Geocoding ${res.status}`);
  const data = (await res.json()) as PhotonResponse;
  const hit = data.features?.[0];
  if (!hit) return undefined;

  const [lng, lat] = hit.geometry.coordinates;
  const p = hit.properties;
  const parts = [p.name, p.city ?? p.state, p.country].filter(Boolean);
  return { label: parts.join(", ") || query, lat, lng, country: p.country };
}
