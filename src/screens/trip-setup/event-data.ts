export interface EventDetails {
  name: string;
  dates: string;
}

const EVENT_KEY = "wayfare.event.v1";

/** Once an event's been created, a reload — including one with no signal,
 *  now that the app shell and map tiles are cached offline — should land
 *  back on it rather than an empty "set up your event" form that doesn't
 *  even remember what was typed in. */
export function loadEventDetails(): EventDetails | undefined {
  try {
    const raw = localStorage.getItem(EVENT_KEY);
    return raw ? (JSON.parse(raw) as EventDetails) : undefined;
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
