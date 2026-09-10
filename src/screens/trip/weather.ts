import type { Day } from "./trip-data";

export interface Coords {
  lat: number;
  lng: number;
}

/** WMO weather codes → the short lowercase word this app already uses
 *  ("24° · humid", "26° · sunny"). https://open-meteo.com/en/docs */
function describeCode(code: number): string {
  if (code === 0) return "clear";
  if (code <= 2) return "partly cloudy";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "foggy";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "showers";
  if (code >= 85 && code <= 86) return "snow showers";
  if (code >= 95) return "storms";
  return "sunny";
}

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  weathercode: number[];
}

interface OpenMeteoResponse {
  daily?: OpenMeteoDaily;
}

/** Coordinates are rounded before they're grouped, so two days whose pins
 *  differ by metres share one location in the request rather than each
 *  buying their own. ~0.01° is a bit over a kilometre — far finer than a
 *  daily forecast resolves anyway. */
function keyOf(c: Coords): string {
  return `${c.lat.toFixed(2)},${c.lng.toFixed(2)}`;
}

/** Where a day actually is, rather than where the trip nominally is.
 *  A day is placed by the first item on it carrying real coordinates —
 *  for a driving day that's the leg's start, which is where you wake up
 *  and where the morning's weather matters. Days with nothing located
 *  fall back to the trip's own pin. */
export function dayCoords(day: Day, fallback: Coords | undefined): Coords | undefined {
  for (const item of day.items) {
    if (item.lat !== undefined && item.lng !== undefined) {
      return { lat: item.lat, lng: item.lng };
    }
  }
  return fallback;
}

/** Live forecast for each day, keyed by `day.date`.
 *
 *  A trip that moves — this app's whole subject — has no single forecast:
 *  asking for the trip's pin gave every one of a 3,800km road trip's days
 *  the weather at the start line. So days are grouped by where they
 *  actually are and asked for together, which Open-Meteo answers in one
 *  request per batch of coordinates and returns in the order sent.
 *
 *  Open-Meteo only forecasts ~16 days out and nothing in the past, so
 *  dates outside that window (or a trip with no geocoded location at all)
 *  simply come back missing and the day header stays as it was. */
export async function fetchWeather(
  days: Day[],
  coords: Coords | undefined,
): Promise<Record<string, string>> {
  if (days.length === 0) return {};

  /* One entry per distinct place, each remembering which dates it covers. */
  const places = new Map<string, { coords: Coords; dates: string[] }>();
  for (const day of days) {
    const at = dayCoords(day, coords);
    if (!at) continue;
    const key = keyOf(at);
    const existing = places.get(key);
    if (existing) existing.dates.push(day.date);
    else places.set(key, { coords: at, dates: [day.date] });
  }
  if (places.size === 0) return {};

  const entries = [...places.values()];
  const latitudes = entries.map((p) => p.coords.lat.toFixed(4)).join(",");
  const longitudes = entries.map((p) => p.coords.lng.toFixed(4)).join(",");

  /* The window is the whole trip; each location is then read back for the
     dates that belong to it. */
  const dates = days.map((d) => d.date).sort();
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}` +
    `&daily=weathercode,temperature_2m_max&temperature_unit=celsius&timezone=auto` +
    `&start_date=${startDate}&end_date=${endDate}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const body = (await res.json()) as OpenMeteoResponse | OpenMeteoResponse[];
  /* Asking for one location returns an object; asking for several returns
     an array, in the order the coordinates were sent. */
  const results = Array.isArray(body) ? body : [body];

  const byDate: Record<string, string> = {};
  entries.forEach((place, i) => {
    const daily = results[i]?.daily;
    if (!daily) return;
    const wanted = new Set(place.dates);
    daily.time.forEach((date, j) => {
      if (!wanted.has(date)) return;
      const temp = daily.temperature_2m_max[j];
      const code = daily.weathercode[j];
      if (temp === null || temp === undefined || code === null || code === undefined) return;
      byDate[date] = `${Math.round(temp)}° · ${describeCode(code)}`;
    });
  });
  return byDate;
}
