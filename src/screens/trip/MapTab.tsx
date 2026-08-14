import type { Theme } from "../../theme";
import { locatedItems, mapsLink, type Day } from "./trip-data";
import { TripMap } from "./TripMap";

/** Every place across the trip in one view, grouped by day underneath —
 *  the day maps show one day at a time, this is the whole picture. */
export function MapTab({ days, theme }: { days: Day[]; theme: Theme }) {
  const located = locatedItems(days);
  const pinNumber = new Map(located.map((entry, i) => [entry.item.id, i + 1]));

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
          {located.length} places
        </span>
      </div>

      <div className="map-canvas" style={{ borderColor: theme.line }}>
        <TripMap
          pins={located.map((entry) => ({ item: entry.item, number: pinNumber.get(entry.item.id) ?? 0 }))}
          height={220}
        />
      </div>

      {days.map((day) => {
        const items = located.filter((entry) => entry.day === day);
        if (items.length === 0) return null;
        return (
          <div key={day.num} className="map-group">
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
