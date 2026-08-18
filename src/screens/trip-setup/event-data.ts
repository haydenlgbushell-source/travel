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
}

/** Everything is keyed to the account that made it. One device can be shared
 *  — signing out and in as someone else must not hand them the previous
 *  person's trips. */
function eventsKey(accountId: string): string {
  return `wayfare.events.v1.${accountId}`;
}

function currentKey(accountId: string): string {
  return `wayfare.current-event.v1.${accountId}`;
}

/** A trip saved before it carried a real date range has nothing to rebuild
 *  its day strip from, so it's dropped rather than shown with the wrong
 *  days under its dates. */
function isUsable(event: Partial<EventDetails>): event is EventDetails {
  return Boolean(event.id && event.name && event.startDate && event.endDate);
}

export function loadEvents(accountId: string): EventDetails[] {
  try {
    const raw = localStorage.getItem(eventsKey(accountId));
    const parsed = raw ? (JSON.parse(raw) as Partial<EventDetails>[]) : [];
    return Array.isArray(parsed) ? parsed.filter(isUsable) : [];
  } catch {
    return [];
  }
}

export function saveEvents(accountId: string, events: EventDetails[]): void {
  try {
    localStorage.setItem(eventsKey(accountId), JSON.stringify(events));
  } catch {
    /* private mode or a full quota — the trip just won't be remembered. */
  }
}

/** Which trip to reopen on the next visit, so a reload — including one with
 *  no signal, now the shell is cached offline — lands back where you were
 *  rather than on an empty setup form. */
export function loadCurrentEventId(accountId: string): string | undefined {
  try {
    return localStorage.getItem(currentKey(accountId)) ?? undefined;
  } catch {
    return undefined;
  }
}

export function saveCurrentEventId(accountId: string, eventId: string | undefined): void {
  try {
    if (eventId === undefined) localStorage.removeItem(currentKey(accountId));
    else localStorage.setItem(currentKey(accountId), eventId);
  } catch {
    /* nothing to do — the next visit just starts from the trip list. */
  }
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
