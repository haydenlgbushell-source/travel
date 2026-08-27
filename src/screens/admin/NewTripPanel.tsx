import { useState } from "react";
import { DEFAULT_THEME_KEY, THEMES } from "../../theme";
import {
  EXAMPLE_END,
  EXAMPLE_START,
} from "../trip/trip-data";
import {
  formatDateRange,
  geocodePlace,
  type EventDetails,
} from "../trip-setup/event-data";
import { adminCreateTrip } from "./admin-data";
import type { AdminAgencyRow } from "./admin-data";

/** Sets a trip up from the console: the same fields the organiser's own setup
 *  screen collects, plus the one thing only an admin can do — hand it
 *  straight to an agency so its agents pick it up without an invite. */
export function NewTripPanel({
  accountId,
  agencies,
  onCreated,
}: {
  accountId: string;
  agencies: AdminAgencyRow[];
  /** Fired after a successful create so the console can refresh its lists. */
  onCreated: (message: string, tone: "ok" | "warn") => void;
}) {
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);
  const [useExample, setUseExample] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const dates = useExample
    ? formatDateRange(EXAMPLE_START, EXAMPLE_END)
    : formatDateRange(startDate, endDate);
  /* formatDateRange returns nothing for a reversed range, so this covers
     both "not filled in yet" and "the end is before the start" — the hint
     below says which. */
  const backwards = !useExample && startDate !== "" && endDate !== "" && endDate < startDate;
  const ready = name.trim().length > 0 && dates.length > 0 && !busy;

  function reset() {
    setName("");
    setDestination("");
    setStartDate("");
    setEndDate("");
    setAgencyId("");
    setUseExample(false);
  }

  async function create() {
    if (!ready) return;
    setBusy(true);
    setError(undefined);
    try {
      /* A place that won't geocode still makes a perfectly good trip — it
         just opens without a forecast or a map centre. */
      let place;
      try {
        place = useExample
          ? await geocodePlace("Chicago")
          : destination.trim()
            ? await geocodePlace(destination)
            : undefined;
      } catch {
        place = undefined;
      }

      const trip: EventDetails = {
        id: crypto.randomUUID(),
        name: name.trim(),
        dates,
        startDate: useExample ? EXAMPLE_START : startDate,
        endDate: useExample ? EXAMPLE_END : endDate,
        destination: place?.label ?? (destination.trim() || undefined),
        lat: place?.lat,
        lng: place?.lng,
        fromExample: useExample,
        themeKey,
        agencyId: agencyId || undefined,
      };

      const { assigned } = await adminCreateTrip(accountId, trip);
      const agency = agencies.find((a) => a.id === agencyId);
      reset();
      if (agencyId && !assigned) {
        onCreated(
          `Created "${trip.name}", but it couldn't be assigned to ${agency?.name ?? "that agency"} — the database refused the agency tag. It's on your own trips for now.`,
          "warn",
        );
      } else {
        onCreated(
          assigned
            ? `Created "${trip.name}" for ${agency?.name ?? "the agency"}.`
            : `Created "${trip.name}".`,
          "ok",
        );
      }
    } catch {
      setError("Couldn't create that trip. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin__panel">
      <div className="admin__panel-head">
        <span className="admin__panel-title">Set up a trip</span>
        <span className="admin__hint">
          {dates || (backwards ? "Dates are the wrong way round" : "Name and dates are required")}
        </span>
      </div>
      <div className="admin__panel-body">
        {error && <div className="admin__notice admin__notice--error">{error}</div>}

        <div className="admin__grid">
          <label className="admin__field admin__field--wide">
            <span className="admin__label">Trip name</span>
            <input
              className="admin__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="The Bennett family, Japan"
            />
          </label>

          <label className="admin__field admin__field--wide">
            <span className="admin__label">Where</span>
            <input
              className="admin__input"
              value={useExample ? "Chicago, Illinois" : destination}
              disabled={useExample}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Kyoto, Japan"
            />
            <span className="admin__hint">
              Sets the forecast and where the map opens. Optional.
            </span>
          </label>

          <label className="admin__field">
            <span className="admin__label">Starts</span>
            <input
              className="admin__input"
              type="date"
              /* The two fields constrain each other, so a reversed range
                 can't be built in the first place. */
              max={useExample ? undefined : endDate || undefined}
              value={useExample ? EXAMPLE_START : startDate}
              disabled={useExample}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label className="admin__field">
            <span className="admin__label">Ends</span>
            <input
              className="admin__input"
              type="date"
              min={useExample ? undefined : startDate || undefined}
              value={useExample ? EXAMPLE_END : endDate}
              disabled={useExample}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          <label className="admin__field">
            <span className="admin__label">Hand to</span>
            <select
              className="admin__select"
              value={agencyId}
              onChange={(e) => setAgencyId(e.target.value)}
            >
              <option value="">Nobody — keep it mine</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <span className="admin__hint">
              {agencies.length === 0
                ? "No agencies yet — grant one from Accounts first."
                : "Every agent at that agency can open and edit it."}
            </span>
          </label>

          <label className="admin__field">
            <span className="admin__label">Style</span>
            <select
              className="admin__select"
              value={themeKey}
              onChange={(e) => setThemeKey(e.target.value)}
            >
              {THEMES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
            <span className="admin__hint">What everyone on the trip sees.</span>
          </label>
        </div>

        <label className="admin__check">
          <span
            className="admin__check-box"
            style={{
              background: useExample ? "var(--wf-ink)" : "transparent",
              borderColor: useExample ? "var(--wf-ink)" : "var(--wf-line)",
            }}
          >
            {useExample ? "✓" : ""}
          </span>
          <input
            type="checkbox"
            checked={useExample}
            onChange={(e) => setUseExample(e.target.checked)}
            style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
          />
          <span>
            Fill it with the example itinerary
            <span className="admin__check-note">
              Six planned days in Chicago, on the example's own dates. Useful for
              showing someone how the app works — not for a real client trip.
            </span>
          </span>
        </label>

        <div className="admin__actions">
          <button
            type="button"
            className="admin__reset admin__btn admin__btn--primary"
            disabled={!ready}
            onClick={() => void create()}
          >
            {busy ? "Creating…" : "Create trip"}
          </button>
          <button
            type="button"
            className="admin__reset admin__btn admin__btn--ghost"
            disabled={busy}
            onClick={reset}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
