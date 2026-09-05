import type { Theme } from "../../theme";
import { flightTrackingUrl, formatDuration, type Day, type TripItem } from "./trip-data";

/** What the mode reads as when it isn't spelled out for you. */
const MODE_LABEL: Record<string, string> = {
  Flight: "Flight",
  Drive: "Drive",
  Train: "Train",
  Ferry: "Ferry",
  Other: "Travel",
};

/** How long a leg takes. The real figure — typed off the ticket, in
 *  `durationMinutes` — always wins when it's there. Failing that, this
 *  falls back to subtracting the two local clock times, which is only ever
 *  right for a leg that stays in one time zone: a Sydney–Los Angeles
 *  flight's 06:00 landing minus its 14:00 departure reads as a negative
 *  trip, "corrected" by adding a day, and comes out roughly a full day
 *  short of the real ~13-hour flight. The `~` on the fallback is the only
 *  thing telling the two apart, so it stays even where the true answer
 *  would happen to match. Returns nothing when there's not enough to
 *  compute at all. */
function legDuration(depart: string, arrive: string, durationMinutes?: number): string | undefined {
  if (durationMinutes !== undefined) return formatDuration(durationMinutes);

  const [dh, dm] = depart.split(":").map(Number);
  const [ah, am] = arrive.split(":").map(Number);
  if ([dh, dm, ah, am].some((n) => Number.isNaN(n))) return undefined;
  let mins = ah * 60 + am - (dh * 60 + dm);
  if (mins <= 0) mins += 24 * 60;
  if (mins >= 24 * 60) return undefined;
  return `~${formatDuration(mins)}`;
}

function TravelLegCard({ item, day, theme }: { item: TripItem; day: Day; theme: Theme }) {
  const leg = item.travel;
  const modeLabel = (leg && MODE_LABEL[leg.mode]) || undefined;
  const duration = leg?.arrive ? legDuration(item.time, leg.arrive, leg.durationMinutes) : undefined;
  const trackingUrl = leg?.mode === "Flight" ? flightTrackingUrl(leg.number) : undefined;
  const chipStyle = {
    fontFamily: theme.fontMono,
    color: theme.ink,
    background: theme.strip,
    borderRadius: theme.chipRadius,
  };

  return (
    <div
      className="wf-card wf-card--pad travel-leg"
      style={{ background: theme.card, borderColor: theme.line }}
    >
      <div className="wf-card__eyebrow" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
        {day.dow} {day.num}
        {modeLabel ? ` · ${modeLabel.toUpperCase()}` : ""}
        {leg?.carrier ? ` · ${leg.carrier}` : ""}
        {leg?.number ? ` ${leg.number}` : ""}
        {item.time ? ` · Departs ${item.time}` : ""}
      </div>
      <div className="stay__name" style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
        {item.title}
      </div>

      {leg && (leg.from || leg.to) && (
        <div className="leg__route">
          <span className="leg__place" style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
            {leg.from || "—"}
          </span>
          <span className="leg__arrow" style={{ color: theme.meta }}>
            →
          </span>
          <span className="leg__place" style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
            {leg.to || "—"}
          </span>
        </div>
      )}

      {(leg?.arrive || duration) && (
        <div className="stat-row">
          {duration && (
            <span className="stat-chip" style={chipStyle}>
              {duration}
            </span>
          )}
          {leg?.arrive && (
            <span className="stat-chip" style={chipStyle}>
              Arrives {leg.arrive}
            </span>
          )}
        </div>
      )}

      {item.note && (
        <div
          className="travel-leg__note"
          style={{
            color: theme.body,
            borderTop: `1px solid ${theme.line}`,
            paddingTop: 10,
          }}
        >
          {item.note}
        </div>
      )}

      {(trackingUrl || (item.documents?.length ?? 0) > 0) && (
        <div className="item-detail__links">
          {trackingUrl && (
            <a
              className="item__maps"
              href={trackingUrl}
              target="_blank"
              rel="noreferrer noopener"
              style={{ fontFamily: theme.fontMono, color: theme.accent }}
            >
              Track this flight ↗
            </a>
          )}
          {item.documents?.map((doc) => (
            <a
              key={doc.url}
              className="item__maps"
              href={doc.url}
              target="_blank"
              rel="noreferrer noopener"
              style={{ fontFamily: theme.fontMono, color: theme.accent }}
            >
              {doc.name} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function StayCard({ item, day, theme }: { item: TripItem; day: Day; theme: Theme }) {
  return (
    <div className="wf-card wf-card--pad stay" style={{ background: theme.card, borderColor: theme.line }}>
      <div className="stay__head">
        <div>
          <div className="wf-card__eyebrow" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
            {day.dow} {day.num} · Stay
          </div>
          <div className="stay__name" style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
            {item.title}
          </div>
          {item.place !== "Not set" && (
            <a
              className="stay__address"
              style={{ color: theme.body }}
              href={item.mapsUrl ?? `https://maps.google.com/?q=${encodeURIComponent(item.place)}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              {item.place}
            </a>
          )}
        </div>
        {item.bookingKind && (
          <span
            className="stay__status"
            style={{ fontFamily: theme.fontMono, color: theme.btnInk, background: item.accent }}
          >
            {item.bookingKind}
          </span>
        )}
      </div>

      {item.note && (
        <div className="travel-leg__note" style={{ color: theme.body }}>
          {item.note}
        </div>
      )}

      {item.booking && (
        <div className="fact-grid">
          {item.booking.map((fact) => (
            <div key={fact.label}>
              <div className="fact__label" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
                {fact.label}
              </div>
              <div className="fact__value" style={{ fontFamily: theme.fontMono, color: theme.ink }}>
                {fact.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TravelTab({
  days,
  theme,
}: {
  days: Day[];
  theme: Theme;
}) {
  /* Every Stay and Travel item on the plan, grouped by day so a road trip's
     dozen driving legs read as an itinerary rather than one undifferentiated
     pile — gathered in one place rather than inventing a hotel nobody
     booked. Applies equally to the example trip, which already carries real
     Travel/Stay items of its own (the O'Hare landing, the Hotel Julian
     check-in): this used to render those from a separate, hand-authored
     "boarding pass" layout that only ever showed the trip's original seed,
     so any real item added afterward — to the example or otherwise — never
     appeared here. */
  const dayGroups = days
    .map((day) => ({
      day,
      items: day.items.filter((item) => item.kind === "Travel" || item.kind === "Stay"),
    }))
    .filter((group) => group.items.length > 0);

  if (dayGroups.length === 0) {
    return (
      <div className="trip-page__stack trip-page__tab-panel">
        <div className="empty-day" style={{ borderColor: theme.line, color: theme.body }}>
          <span
            className="empty-day__title"
            style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
          >
            Nothing booked yet
          </span>
          <span className="empty-day__note">
            Add a flight, a drive or where you're staying to the plan and it'll be gathered
            here.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-page__stack trip-page__tab-panel">
      {dayGroups.map(({ day, items }) => (
        <div key={day.date} className="travel-day-group">
          <div
            className="travel-day-group__head"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            {day.dow} {day.num} · {day.label}
          </div>
          {items.map((item) =>
            item.kind === "Travel" ? (
              <TravelLegCard key={item.id} item={item} day={day} theme={theme} />
            ) : (
              <StayCard key={item.id} item={item} day={day} theme={theme} />
            ),
          )}
        </div>
      ))}
    </div>
  );
}
