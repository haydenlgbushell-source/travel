import { useState } from "react";
import { THEMES, getTheme } from "../../theme";
import { StyleCard } from "./StyleCard";
import { PhonePreview } from "./PhonePreview";
import "./trip-setup.css";
import { geocodePlace, type EventDetails } from "./event-data";
import { EXAMPLE_END, EXAMPLE_START, initialsOf } from "../trip/trip-data";

/** "14 – 19 August 2026" — spans a month name only once when both ends
 *  fall in the same month, the way the rest of the app already writes it. */
function formatDateRange(startISO: string, endISO: string): string {
  if (!startISO || !endISO) return "";
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";

  const endMonth = end.toLocaleDateString("en-US", { month: "long" });
  const year = end.getFullYear();
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} – ${end.getDate()} ${endMonth} ${year}`;
  }
  const startMonth = start.toLocaleDateString("en-US", { month: "long" });
  return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth} ${year}`;
}

const SCOPE_RULES = [
  {
    label: "Changes",
    detail:
      "Colours, fonts, corner radius and the wording of small labels — countdowns, tags, button text.",
  },
  {
    label: "Stays the same",
    detail:
      "Every screen, every field, all bookings, ratings, money and permissions. A style is a skin, not a different product.",
  },
  {
    label: "Who sees it",
    detail:
      "Everyone on the trip, on desktop and on their phones. Nobody can override it for themselves.",
  },
];

export function TripSetupPage({
  themeKey,
  onThemeKeyChange,
  editing,
  userName,
  onCreate,
  onCancel,
}: {
  themeKey: string;
  onThemeKeyChange: (key: string) => void;
  /** Set when changing an existing trip rather than starting one. */
  editing?: EventDetails;
  /** For the header avatar — absent for a guest who hasn't picked a name
   *  yet, same as everywhere else in the app that shows initials. */
  userName?: string;
  onCreate: (event: EventDetails) => void;
  onCancel?: () => void;
}) {
  const [eventName, setEventName] = useState(editing?.name ?? "");
  const [destination, setDestination] = useState(editing?.destination ?? "");
  const [startDate, setStartDate] = useState(editing?.startDate ?? "");
  const [endDate, setEndDate] = useState(editing?.endDate ?? "");
  const [useExample, setUseExample] = useState(editing?.fromExample ?? false);
  const [creating, setCreating] = useState(false);
  const selected = getTheme(themeKey);
  const isEditing = editing !== undefined;

  /* The example is a real, authored six-day Chicago trip — its dates come
     with it rather than being whatever was typed above. */
  const dates = useExample
    ? formatDateRange(EXAMPLE_START, EXAMPLE_END)
    : formatDateRange(startDate, endDate);
  const canCreate = eventName.trim().length > 0 && dates.length > 0 && !creating;
  const previewName = eventName.trim() || "Your event";
  const previewDates = dates || "Pick your dates";

  async function create() {
    if (!canCreate) return;
    setCreating(true);
    try {
      /* A place we can't geocode still makes a perfectly good trip — it
         just has no forecast and no map centre, so a lookup that fails
         shouldn't stop the event being created. */
      let place;
      try {
        place = useExample
          ? await geocodePlace("Chicago")
          : await geocodePlace(destination);
      } catch {
        place = undefined;
      }

      onCreate({
        /* Editing keeps the id, so the trip's saved plan stays attached. */
        id: editing?.id ?? crypto.randomUUID(),
        name: eventName.trim(),
        dates,
        startDate: useExample ? EXAMPLE_START : startDate,
        endDate: useExample ? EXAMPLE_END : endDate,
        destination: place?.label ?? (destination.trim() || undefined),
        lat: place?.lat,
        lng: place?.lng,
        fromExample: useExample,
        themeKey,
        /* Not editable here — carried forward so saving changes to a
           client trip can't silently detach it from its agency. */
        agencyId: editing?.agencyId,
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="trip-setup">
      <div className="trip-setup__main">
        <header className="trip-setup__header">
          <div className="trip-setup__header-left">
            <span className="trip-setup__brand">{selected.wordmark}</span>
            <span className="wf-mono trip-setup__step">{isEditing ? "Edit trip" : "New event"}</span>
          </div>
          <div className="trip-setup__header-right">
            <span className="wf-mono trip-setup__organiser">Organiser only</span>
            <span className="trip-setup__avatar">
              {userName ? initialsOf(userName) : "?"}
            </span>
          </div>
        </header>

        <div className="trip-setup__content">
          <div className="trip-setup__intro">
            <h1 className="trip-setup__title">
              {isEditing ? "Edit your trip" : "Set up your event"}
            </h1>
            <p className="trip-setup__lede">
              {isEditing
                ? "Change the name, the dates or where it is. Widening the range adds the new days; narrowing it drops the days that fall outside, along with anything planned on them."
                : "Name it, say where and when, then pick a style. You'll get a day for every date in the range, empty and ready to fill in."}
            </p>
          </div>

          <section className="trip-setup__section">
            <span className="wf-mono trip-setup__eyebrow">Event details</span>
            <div className="event-fields">
              <label className="event-field event-field--wide">
                <span className="wf-mono event-field__label">Event name</span>
                <input
                  className="event-field__input"
                  type="text"
                  placeholder="Chicago"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </label>
              <label className="event-field event-field--wide">
                <span className="wf-mono event-field__label">Where</span>
                <input
                  className="event-field__input"
                  type="text"
                  placeholder="Chicago, Illinois"
                  value={useExample ? "Chicago, Illinois" : destination}
                  disabled={useExample}
                  onChange={(e) => setDestination(e.target.value)}
                />
                <span className="event-field__hint">
                  Sets the forecast and where the map opens. Optional.
                </span>
              </label>
              <label className="event-field">
                <span className="wf-mono event-field__label">Starts</span>
                <input
                  className="event-field__input"
                  type="date"
                  value={useExample ? EXAMPLE_START : startDate}
                  disabled={useExample}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="event-field">
                <span className="wf-mono event-field__label">Ends</span>
                <input
                  className="event-field__input"
                  type="date"
                  min={startDate || undefined}
                  value={useExample ? EXAMPLE_END : endDate}
                  disabled={useExample}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </div>

            {!isEditing && (
            <label className="event-example" onClick={() => setUseExample((v) => !v)}>
              <span
                className="scope-panel__checkbox"
                style={{
                  borderColor: useExample ? "#14171A" : "#C9CAC3",
                  background: useExample ? "#14171A" : "transparent",
                }}
              >
                {useExample ? "✓" : ""}
              </span>
              <span className="event-example__text">
                <span className="event-example__label">Fill it with the example trip</span>
                <span className="event-example__note">
                  Six days in Chicago, already planned — a quick way to see how the app
                  works before building your own.
                </span>
              </span>
            </label>
            )}
          </section>

          <section className="trip-setup__section">
            <div className="trip-setup__section-head">
              <span className="wf-mono trip-setup__eyebrow">Trip style</span>
              <span className="wf-mono trip-setup__selected-name">
                {selected.name} selected
              </span>
            </div>

            <div className="style-grid">
              {THEMES.map((t) => (
                <StyleCard
                  key={t.key}
                  theme={t}
                  selected={t.key === themeKey}
                  onSelect={() => onThemeKeyChange(t.key)}
                  eventName={previewName}
                />
              ))}
            </div>
          </section>

          <section className="trip-setup__section">
            <span className="wf-mono trip-setup__eyebrow">How it applies</span>
            <div className="scope-panel">
              {SCOPE_RULES.map((rule) => (
                <div key={rule.label} className="scope-panel__row">
                  <span className="wf-mono scope-panel__label">{rule.label}</span>
                  <span className="scope-panel__detail">{rule.detail}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="trip-setup__actions">
            <button
              type="button"
              className="trip-setup__btn trip-setup__btn--primary"
              disabled={!canCreate}
              onClick={create}
            >
              {creating ? "Saving…" : isEditing ? "Save changes" : "Create trip and invite"}
            </button>
            {onCancel && (
              <button
                type="button"
                className="trip-setup__btn trip-setup__btn--secondary"
                onClick={onCancel}
              >
                Cancel
              </button>
            )}
            <span className="wf-mono trip-setup__actions-note">
              {canCreate ? "Everyone joins as a contributor" : "Add a name and both dates first"}
            </span>
          </div>
        </div>
      </div>

      <aside className="trip-setup__preview">
        <div className="trip-setup__preview-head">
          <span className="wf-mono trip-setup__preview-label">Live preview</span>
          <span className="wf-mono trip-setup__preview-label">What the group sees</span>
        </div>
        <PhonePreview theme={selected} eventName={previewName} eventDates={previewDates} />
      </aside>
    </div>
  );
}
