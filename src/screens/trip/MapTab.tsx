import type { Theme } from "../../theme";
import { locatedItems, mapsLink, type Day } from "./trip-data";
import { TripMap } from "./TripMap";

/** The active day's places on the map — filtered by the same day strip
 *  Plan and Stay & travel already use, rather than a second, own day picker
 *  repeating those exact same chips (which is what this used to be: a
 *  pill row duplicating the day strip a scroll above it). Pin numbers stay
 *  keyed off the whole trip regardless, so an item's number doesn't change
 *  as the day strip moves. */
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
  const located = locatedItems(days);
  const pinNumber = new Map(located.map((entry, i) => [entry.item.id, i + 1]));
  const shown = located.filter((entry) => entry.day === activeDay);

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
            {activeDay.fullDate}
          </div>
          <div
            className="day-head__label"
            style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
          >
            {activeDay.label}
          </div>
        </div>
        <span
          className="day-head__weather"
          style={{ fontFamily: theme.fontMono, color: theme.body }}
        >
          {shown.length} places
        </span>
      </div>

      <div className="map-canvas" style={{ borderColor: theme.line }}>
        <TripMap
          pins={shown.map((entry) => ({ item: entry.item, number: pinNumber.get(entry.item.id) ?? 0 }))}
          center={center}
          height={300}
        />
      </div>

      {shown.length > 0 && (
        <div className="map-group">
          <div
            className="map-list"
            style={{ background: theme.card, borderColor: theme.line }}
          >
            {shown.map((entry) => (
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
      )}
    </div>
  );
}
