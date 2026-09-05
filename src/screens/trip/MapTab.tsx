import { useState } from "react";
import type { Theme } from "../../theme";
import { locatedItems, mapsLink, type Day } from "./trip-data";
import { TripMap } from "./TripMap";

type View = "day" | "whole";

/** The active day's places by default — filtered by the same day strip
 *  Plan and Stay & travel already use, rather than a second, own day picker
 *  repeating those exact same chips. A "Whole trip" tab switches to every
 *  located item at once, for the one thing the day strip alone can't do:
 *  see the whole trip's geography in one look. Pin numbers stay keyed off
 *  the whole trip either way, so an item's number never changes with the
 *  view or the day strip. */
export function MapTab({
  days,
  activeDay,
  center,
  theme,
}: {
  days: Day[];
  activeDay: Day;
  center?: { lat: number; lng: number };
  theme: Theme;
}) {
  const [view, setView] = useState<View>("day");
  const located = locatedItems(days);
  const pinNumber = new Map(located.map((entry, i) => [entry.item.id, i + 1]));
  const shown = view === "day" ? located.filter((entry) => entry.day === activeDay) : located;
  /* Grouped by day only in the whole-trip view — a single day's own list
     needs no day heading repeating what the day-head above already says. */
  const groups = view === "day" ? [{ day: activeDay, items: shown }] : days.map((day) => ({
    day,
    items: shown.filter((entry) => entry.day === day),
  }));

  if (located.length === 0) {
    return (
      <div className="empty-day" style={{ borderColor: theme.line, color: theme.body }}>
        <span
          className="empty-day__title"
          style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
        >
          Nothing on the map yet
        </span>
        <span className="empty-day__note">Items with a place show up here.</span>
      </div>
    );
  }

  return (
    <div className="trip-page__stack">
      <div className="day-head">
        <div>
          <div
            className="day-head__date"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            {view === "day" ? activeDay.fullDate : "Whole trip"}
          </div>
          <div
            className="day-head__label"
            style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
          >
            {view === "day" ? activeDay.label : "Trip map"}
          </div>
        </div>
        <span
          className="day-head__weather"
          style={{ fontFamily: theme.fontMono, color: theme.body }}
        >
          {shown.length} places
        </span>
      </div>

      <div className="kind-picker">
        <button
          type="button"
          aria-pressed={view === "day"}
          className="trip-page__reset kind-picker__option"
          onClick={() => setView("day")}
          style={{
            background: view === "day" ? theme.ink : theme.card,
            borderColor: view === "day" ? theme.ink : theme.line,
            color: view === "day" ? theme.bg : theme.body,
          }}
        >
          This day
        </button>
        <button
          type="button"
          aria-pressed={view === "whole"}
          className="trip-page__reset kind-picker__option"
          onClick={() => setView("whole")}
          style={{
            background: view === "whole" ? theme.ink : theme.card,
            borderColor: view === "whole" ? theme.ink : theme.line,
            color: view === "whole" ? theme.bg : theme.body,
          }}
        >
          Whole trip
        </button>
      </div>

      <div className="map-canvas" style={{ borderColor: theme.line }}>
        <TripMap
          pins={shown.map((entry) => ({ item: entry.item, number: pinNumber.get(entry.item.id) ?? 0 }))}
          center={center}
          height={view === "day" ? 300 : 220}
        />
      </div>

      {groups.map(({ day, items }) => {
        if (items.length === 0) return null;
        return (
          <div key={day.date} className="map-group">
            {view === "whole" && (
              <span
                className="wf-card__eyebrow"
                style={{ fontFamily: theme.fontMono, color: theme.meta }}
              >
                {day.dow} {day.num} · {day.label}
              </span>
            )}
            <div
              className="map-list"
              style={{ background: theme.card, borderColor: theme.line }}
            >
              {items.map((entry) => (
                <a
                  key={entry.item.id}
                  className="map-row"
                  href={mapsLink(entry.item)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <span
                    className="map-row__pin"
                    style={{
                      fontFamily: theme.fontMono,
                      background: entry.item.accent,
                      color: theme.btnInk,
                    }}
                  >
                    {pinNumber.get(entry.item.id)}
                  </span>
                  <span className="map-row__body">
                    <span className="map-row__title" style={{ color: theme.ink }}>
                      {entry.item.title}
                    </span>
                    <span
                      className="map-row__place"
                      style={{ fontFamily: theme.fontMono, color: theme.body }}
                    >
                      {entry.item.place}
                    </span>
                  </span>
                  <span
                    className="map-row__link"
                    style={{ fontFamily: theme.fontMono, color: theme.accent }}
                  >
                    Maps ↗
                  </span>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
