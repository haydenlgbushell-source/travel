import type { Day } from "./trip-data";

/** Downtown Chicago — good enough for a single trip-wide forecast; the
 *  itinerary itself doesn't move around enough day to day to need a pin
 *  per location. */
const TRIP_LOCATION = { lat: 41.8781, lng: -87.6298 };

/** The itinerary's dates are fixed content (Chicago, August 2026) even
 *  though the event name/dates entered at setup can be anything — so the
 *  forecast follows the itinerary's real dates, not whatever the user
 *  typed in. */
const ITINERARY_YEAR = 2026;
const ITINERARY_MONTH = "08";

function isoDateFor(day: Day): string {
  return `${ITINERARY_YEAR}-${ITINERARY_MONTH}-${day.num.padStart(2, "0")}`;
}

/** WMO weather codes → the short lowercase word this app already uses
 *  ("84° · humid", "86° · sunny"). https://open-meteo.com/en/docs */
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

interface OpenMeteoResponse {
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    weathercode: number[];
  };
}

/** Live forecast for each day, keyed by day.num — Open-Meteo only forecasts
 *  ~16 days out and nothing in the past, so trip dates outside that window
 *  (or a failed fetch) simply come back missing and the caller keeps
 *  showing the seed weather text for those days. */
export async function fetchWeather(days: Day[]): Promise<Record<string, string>> {
  const dates = days.map(isoDateFor).sort();
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${TRIP_LOCATION.lat}&longitude=${TRIP_LOCATION.lng}` +
    `&daily=weathercode,temperature_2m_max&temperature_unit=fahrenheit&timezone=auto` +
    `&start_date=${startDate}&end_date=${endDate}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = (await res.json()) as OpenMeteoResponse;
  if (!data.daily) return {};

  const byDate = new Map<string, string>();
  data.daily.time.forEach((date, i) => {
    const temp = Math.round(data.daily!.temperature_2m_max[i]);
    byDate.set(date, `${temp}° · ${describeCode(data.daily!.weathercode[i])}`);
  });

  const byDayNum: Record<string, string> = {};
  for (const day of days) {
    const text = byDate.get(isoDateFor(day));
    if (text) byDayNum[day.num] = text;
  }
  return byDayNum;
}
