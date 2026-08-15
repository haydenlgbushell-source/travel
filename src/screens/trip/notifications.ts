import type { Verdict } from "./ItemCard";
import type { Day } from "./trip-data";

/** Matches the itinerary's real dates — see the same constant in
 *  weather.ts and calendar-export.ts. */
const ITINERARY_YEAR = 2026;
const ITINERARY_MONTH = 8;

const LEAD_MINUTES = 30;
const STORAGE_KEY = "wayfare.notify.v1";

export function loadNotifyEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveNotifyEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    /* private mode or a full quota — the toggle just won't stick. */
  }
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notifyPermission(): NotificationPermission | "unsupported" {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

export async function requestNotifyPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  return Notification.requestPermission();
}

function itemDate(day: Day, time: string): Date | undefined {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return undefined;
  return new Date(ITINERARY_YEAR, ITINERARY_MONTH - 1, Number(day.num), Number(match[1]), Number(match[2]));
}

/** Schedules a browser notification `LEAD_MINUTES` before each upcoming,
 *  live item — only while this tab stays open, since there's no backend to
 *  deliver a real push once the app is closed. Returns a cleanup function
 *  that cancels everything scheduled, for re-scheduling when the plan
 *  changes or the toggle turns off. */
export function scheduleNotifications(days: Day[], resolved: Record<string, Verdict>): () => void {
  if (notifyPermission() !== "granted") return () => {};

  const timers: ReturnType<typeof setTimeout>[] = [];
  const now = Date.now();

  for (const day of days) {
    for (const item of day.items) {
      const verdict = resolved[item.id];
      if (verdict === "declined") continue;
      if (item.suggested && verdict !== "approved") continue;
      const when = itemDate(day, item.time);
      if (!when) continue;

      const delay = when.getTime() - LEAD_MINUTES * 60_000 - now;
      // setTimeout silently clamps anything past a 32-bit signed int
      // (~24.8 days) to fire immediately — skip those instead of that.
      if (delay <= 0 || delay > 2_147_000_000) continue;

      timers.push(
        setTimeout(() => {
          new Notification(item.title, {
            body: `${item.time} · ${item.place}`,
            tag: item.id,
          });
        }, delay),
      );
    }
  }

  return () => timers.forEach(clearTimeout);
}
