import { useState } from "react";
import { THEMES, getTheme } from "../../theme";
import { StyleCard } from "./StyleCard";
import { PhonePreview } from "./PhonePreview";
import "./trip-setup.css";

export interface EventDetails {
  name: string;
  dates: string;
}

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
  onCreate,
}: {
  themeKey: string;
  onThemeKeyChange: (key: string) => void;
  onCreate: (event: EventDetails) => void;
}) {
  const [editorsCanStyle, setEditorsCanStyle] = useState(false);
  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const selected = getTheme(themeKey);

  const dates = formatDateRange(startDate, endDate);
  const canCreate = eventName.trim().length > 0 && dates.length > 0;
  const previewName = eventName.trim() || "Your event";
  const previewDates = dates || "Pick your dates";

  return (
    <div className="trip-setup">
      <div className="trip-setup__main">
        <header className="trip-setup__header">
          <div className="trip-setup__header-left">
            <span className="trip-setup__brand">Meridian</span>
            <span className="wf-mono trip-setup__step">New event</span>
          </div>
          <div className="trip-setup__header-right">
            <span className="wf-mono trip-setup__organiser">Organiser only</span>
            <span className="trip-setup__avatar">AN</span>
          </div>
        </header>

        <div className="trip-setup__content">
          <div className="trip-setup__intro">
            <h1 className="trip-setup__title">Set up your event</h1>
            <p className="trip-setup__lede">
              Give it a name and its dates, then pick a style. The itinerary underneath is
              still the Chicago example trip — this app doesn't build a new one for you yet,
              it just wraps your event around it.
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
              <label className="event-field">
                <span className="wf-mono event-field__label">Starts</span>
                <input
                  className="event-field__input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="event-field">
                <span className="wf-mono event-field__label">Ends</span>
                <input
                  className="event-field__input"
                  type="date"
                  min={startDate || undefined}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </div>
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
              <label className="scope-panel__toggle" onClick={() => setEditorsCanStyle((v) => !v)}>
                <span
                  className="scope-panel__checkbox"
                  style={{
                    borderColor: editorsCanStyle ? "#14171A" : "#C9CAC3",
                    background: editorsCanStyle ? "#14171A" : "transparent",
                  }}
                >
                  {editorsCanStyle ? "✓" : ""}
                </span>
                <span className="scope-panel__toggle-label">
                  Let editors change the style too
                </span>
              </label>
            </div>
          </section>

          <div className="trip-setup__actions">
            <button
              type="button"
              className="trip-setup__btn trip-setup__btn--primary"
              disabled={!canCreate}
              onClick={() => canCreate && onCreate({ name: eventName.trim(), dates })}
            >
              Create trip and invite
            </button>
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
