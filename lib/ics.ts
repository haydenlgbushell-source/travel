import type { Trip, TripDay } from "./types";

/**
 * Minimal RFC 5545 generator for "add to calendar".
 *
 * Times are emitted as *floating* local times (no Z, no TZID): an itinerary
 * item at 18:00 should read 18:00 on the traveller's phone once they land,
 * which is exactly what floating time means. Anchoring to a timezone would make
 * events shift for anyone importing from another country.
 */

const CRLF = "\r\n";

/** Escape per RFC 5545 §3.3.11 — backslash first, or it double-escapes. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold lines at 75 octets as the spec requires; continuations start with a space. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;

  const parts: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest.length > 0) parts.push(` ${rest}`);
  return parts.join(CRLF);
}

/** "2026-09-10" + "18:00" → "20260910T180000" */
function toFloatingStamp(isoDate: string, time: string): string {
  const [hours, minutes] = time.split(":");
  return `${isoDate.replace(/-/g, "")}T${hours}${minutes}00`;
}

function addMinutes(isoDate: string, time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const base = new Date(`${isoDate}T00:00:00Z`);
  base.setUTCMinutes(base.getUTCMinutes() + h * 60 + m + minutes);

  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${base.getUTCFullYear()}${pad(base.getUTCMonth() + 1)}${pad(base.getUTCDate())}` +
    `T${pad(base.getUTCHours())}${pad(base.getUTCMinutes())}00`
  );
}

const DEFAULT_DURATION_MINUTES = 60;

export function buildTripCalendar(trip: Trip, days: TripDay[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wayfare//Trip Itinerary//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(trip.name)}`,
  ];

  for (const day of days) {
    for (const event of day.events) {
      const description = [event.subtitle, event.location]
        .filter(Boolean)
        .join(" · ");

      lines.push(
        "BEGIN:VEVENT",
        // Stable across regenerations, so re-importing updates rather than duplicates.
        `UID:${event.id}@${trip.slug}.wayfare`,
        `DTSTAMP:${toFloatingStamp(day.date, event.time)}Z`,
        `DTSTART:${toFloatingStamp(day.date, event.time)}`,
        `DTEND:${addMinutes(day.date, event.time, DEFAULT_DURATION_MINUTES)}`,
        `SUMMARY:${escapeText(event.title)}`,
      );

      if (description) {
        lines.push(`DESCRIPTION:${escapeText(description)}`);
      }
      if (event.location) {
        lines.push(`LOCATION:${escapeText(event.location)}`);
      }

      lines.push("END:VEVENT");
    }
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join(CRLF) + CRLF;
}
