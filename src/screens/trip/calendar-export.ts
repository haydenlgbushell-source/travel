import type { Verdict } from "./ItemCard";
import type { Day } from "./trip-data";

/** Every event is written as a "floating" local time (no UTC offset, no
 *  VTIMEZONE block) rather than pinned to the destination's zone — simpler
 *  than embedding full DST rules, and calendar apps read floating time as
 *  "whatever timezone I'm in when I open this," which is what someone
 *  importing their own trip's plan actually wants. */
function icsDateTime(day: Day, time: string): string {
  const [hh, mm] = time.split(":");
  return `${day.date.replace(/-/g, "")}T${hh.padStart(2, "0")}${mm.padStart(2, "0")}00`;
}

/** RFC 5545 §3.3.11 — commas, semicolons and backslashes need escaping, and
 *  a real newline has to become a literal "\n" rather than break the line. */
function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
}

const DURATION_MINUTES: Record<string, number> = { Eat: 90, Do: 120, Stay: 60, Travel: 60 };

export function buildICS(eventName: string, days: Day[], resolved: Record<string, Verdict>): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wayfare//Trip Export//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(eventName)}`,
  ];
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  for (const day of days) {
    for (const item of day.items) {
      const verdict = resolved[item.id];
      if (verdict === "declined") continue;
      if (item.suggested && verdict !== "approved") continue;
      if (!/^\d{1,2}:\d{2}$/.test(item.time)) continue;

      const start = icsDateTime(day, item.time);
      const minutes = DURATION_MINUTES[item.kind] ?? 60;
      const endDate = new Date(
        `${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6, 8)}T${start.slice(9, 11)}:${start.slice(11, 13)}:00`,
      );
      endDate.setMinutes(endDate.getMinutes() + minutes);
      const end =
        `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, "0")}${String(endDate.getDate()).padStart(2, "0")}` +
        `T${String(endDate.getHours()).padStart(2, "0")}${String(endDate.getMinutes()).padStart(2, "0")}00`;

      lines.push(
        "BEGIN:VEVENT",
        `UID:${item.id}@wayfare-trip`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeText(item.title)}`,
        `LOCATION:${escapeText(item.place)}`,
        `DESCRIPTION:${escapeText(item.note)}`,
        "END:VEVENT",
      );
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(eventName: string, days: Day[], resolved: Record<string, Verdict>): void {
  const ics = buildICS(eventName, days, resolved);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${eventName.trim().replace(/[^\w-]+/g, "-") || "trip"}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
