import type { Theme } from "../../theme";

/** Today as `YYYY-MM-DD` in the viewer's own timezone.
 *
 *  Deliberately not `toISOString().slice(0, 10)`, which is UTC: for anyone
 *  east of Greenwich — this app's author included, at UTC+10 — that reads
 *  as yesterday for the first hours of every day, and the countdown would
 *  sit a day behind all morning. */
export function todayISO(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Whole days from `from` to `to`, both `YYYY-MM-DD`.
 *
 *  Parsed as UTC midnight purely to subtract them: calendar days apart is
 *  the question, so anchoring both ends to the same clock keeps daylight
 *  saving from turning a difference into 4.958 days and rounding badly. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.NaN;
  return Math.round((b - a) / 86_400_000);
}

/** The header's countdown, in the voice of the active style.
 *
 *  Returns nothing when the dates can't be read, so the caller can leave
 *  the slot empty rather than print a placeholder — this used to render
 *  `theme.countdown` flat, which meant the Dispatch header claimed "T–0"
 *  on a trip that was still five days away. */
export function countdownLabel(
  startDate: string | undefined,
  endDate: string | undefined,
  theme: Theme,
  today: string = todayISO(),
): string | undefined {
  if (!startDate) return undefined;
  const until = daysBetween(today, startDate);
  if (Number.isNaN(until)) return undefined;

  if (until > 0) {
    return theme.countdownAway
      .replace("{n}", String(until))
      .replace("{s}", until === 1 ? "" : "s");
  }

  /* On or after the start date: still running until the last day is past.
     A trip with no end date is treated as a single day. */
  const last = endDate ?? startDate;
  const since = daysBetween(last, today);
  if (Number.isNaN(since) || since <= 0) return theme.countdown;
  return theme.countdownDone;
}
