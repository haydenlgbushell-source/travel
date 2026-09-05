import { useState } from "react";
import type { Theme } from "../../theme";
import { locatedItems, mapsLink, type Day } from "./trip-data";
import { TripMap } from "./TripMap";

/** Every place across the trip in one view. A day pill row lets the map
 *  itself be narrowed to a single day's pins instead of the whole trip —
 *  replaces the old per-day maps at the foot of each day's plan, which
 *  duplicated this same view over and over down the page. */
export function MapTab({
  days,
  center,
  theme,
}: {
  days: Day[];
  center?: { lat: number; lng: number };
  theme: Theme;
}) {
  const [dayFilter, setDayFilter] = useState<Day | undefined>(undefined);
  const located = locatedItems(days);
  const pinNumber = new Map(located.map((entry, i) => [entry.item.id, i + 1]));
  const shown = dayFilter ? located.filter((entry) => entry.day === dayFilter) : located;
  const visibleDays = dayFilter ? [dayFilter] : days;

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
            Whole trip
          </div>
          <div
            className="day-head__label"
            style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
          >
            Trip map
          </div>
        </div>
        <span
          className="day-head__weather"
          style={{ fontFamily: theme.fontMono, color: theme.body }}
        >
          {shown.length} places
        </span>
      </div>

      <div className="map-day-toggle">
        <button
          type="button"
          className="trip-page__reset map-day-toggle__pill"
          aria-pressed={dayFilter === undefined}
          onClick={() => setDayFilter(undefined)}
          style={{
            fontFamily: theme.fontMono,
            background: dayFilter === undefined ? theme.ink : theme.card,
            color: dayFilter === undefined ? theme.bg : theme.body,
            borderColor: dayFilter === undefined ? theme.ink : theme.line,
          }}
        >
          All days
        </button>
        {days.map((day) => {
          const on = dayFilter === day;
          return (
            <button
              key={day.date}
              type="button"
              className="trip-page__reset map-day-toggle__pill"
              aria-pressed={on}
              onClick={() => setDayFilter(on ? undefined : day)}
              style={{
                fontFamily: theme.fontMono,
                background: on ? theme.ink : theme.card,
                color: on ? theme.bg : theme.body,
                borderColor: on ? theme.ink : theme.line,
              }}
            >
              {day.dow} {day.num}
            </button>
          );
        })}
      </div>

      <div className="map-canvas" style={{ borderColor: theme.line }}>
        <TripMap
          pins={shown.map((entry) => ({ item: entry.item, number: pinNumber.get(entry.item.id) ?? 0 }))}
          center={center}
          height={dayFilter ? 300 : 220}
        />
      </div>

      {visibleDays.map((day) => {
        const items = shown.filter((entry) => entry.day === day);
        if (items.length === 0) return null;
        return (
          <div key={day.date} className="map-group">
            <span
              className="wf-card__eyebrow"
              style={{ fontFamily: theme.fontMono, color: theme.meta }}
            >
              {day.dow} {day.num} · {day.label}
            </span>
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
