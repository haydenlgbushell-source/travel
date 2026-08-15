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

const EVENT_KEY = "wayfare.event.v1";

/** Once an event's been created, a reload — including one with no signal,
 *  now that the app shell and map tiles are cached offline — should land
 *  back on it rather than an empty "set up your event" form that doesn't
 *  even remember what was typed in. */
export function loadEventDetails(): EventDetails | undefined {
  try {
    const raw = localStorage.getItem(EVENT_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<EventDetails>;
    /* Events saved before the day strip was driven by real dates have no
       range to rebuild days from — there's nothing to restore, so send
       them back to setup rather than showing August under their dates. */
    if (!parsed.id || !parsed.startDate || !parsed.endDate) return undefined;
    return parsed as EventDetails;
  } catch {
    return undefined;
  }
}

export function saveEventDetails(event: EventDetails): void {
  try {
    localStorage.setItem(EVENT_KEY, JSON.stringify(event));
  } catch {
    /* private mode or a full quota — the event just won't be remembered. */
  }
}

export function clearEventDetails(): void {
  try {
    localStorage.removeItem(EVENT_KEY);
  } catch {
    /* nothing to clear if storage never worked in the first place. */
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
