import type { Day } from "./trip-data";

export interface Coords {
  lat: number;
  lng: number;
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

/** Live forecast for each day, keyed by `day.date`. Open-Meteo only
 *  forecasts ~16 days out and nothing in the past, so dates outside that
 *  window (or a trip with no geocoded location at all) simply come back
 *  missing and the day header stays as it was. */
export async function fetchWeather(
  days: Day[],
  coords: Coords | undefined,
): Promise<Record<string, string>> {
  if (!coords || days.length === 0) return {};

  const dates = days.map((d) => d.date).sort();
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}` +
    `&daily=weathercode,temperature_2m_max&temperature_unit=fahrenheit&timezone=auto` +
    `&start_date=${startDate}&end_date=${endDate}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = (await res.json()) as OpenMeteoResponse;
  if (!data.daily) return {};

  const byDate: Record<string, string> = {};
  data.daily.time.forEach((date, i) => {
    const temp = Math.round(data.daily!.temperature_2m_max[i]);
    byDate[date] = `${temp}° · ${describeCode(data.daily!.weathercode[i])}`;
  });
  return byDate;
}
