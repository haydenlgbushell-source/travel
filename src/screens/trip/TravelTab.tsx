import type { Theme } from "../../theme";
import { FLIGHTS, STAY, type Day } from "./trip-data";

export function TravelTab({
  isExample,
  days,
  theme,
}: {
  isExample: boolean;
  days: Day[];
  theme: Theme;
}) {
  /* The stay and the flights below are part of the authored example. A real
     trip shows its own — every Stay and Travel item on the plan, gathered in
     one place rather than inventing a hotel nobody booked. */
  if (!isExample) {
    const legs = days.flatMap((day) =>
      day.items
        .filter((item) => item.kind === "Travel" || item.kind === "Stay")
        .map((item) => ({ item, day })),
    );

    if (legs.length === 0) {
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
              Add a flight, a drive or where you're staying to the plan and it'll be
              gathered here.
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="trip-page__stack trip-page__tab-panel">
        {legs.map(({ item, day }) => (
          <div
            key={item.id}
            className="wf-card wf-card--pad"
            style={{ background: theme.card, borderColor: theme.line, gap: "8px" }}
          >
            <div
              className="wf-card__eyebrow"
              style={{ fontFamily: theme.fontMono, color: theme.meta }}
            >
              {day.dow} {day.num} · {item.time}
              {item.travel?.carrier ? ` · ${item.travel.carrier}` : ""}
              {item.travel?.number ? ` ${item.travel.number}` : ""}
            </div>
            <div className="stay__name" style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
              {item.title}
            </div>

            {item.travel && (item.travel.from || item.travel.to) ? (
              <div className="flight__route">
                <span
                  className="flight__code"
                  style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
                >
                  {item.travel.from || "—"}
                </span>
                <span className="flight__line" style={{ background: theme.line }}>
                  <span className="flight__line-dot" style={{ background: theme.accent }} />
                </span>
                <span
                  className="flight__code"
                  style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
                >
                  {item.travel.to || "—"}
                </span>
              </div>
            ) : (
              item.place !== "Not set" && (
                <div className="stay__address" style={{ color: theme.body }}>
                  {item.place}
                </div>
              )
            )}

            <div className="fact-grid">
              <div>
                <div
                  className="fact__label"
                  style={{ fontFamily: theme.fontMono, color: theme.meta }}
                >
                  {item.travel ? "Leaves" : "From"}
                </div>
                <div
                  className="fact__value"
                  style={{ fontFamily: theme.fontMono, color: theme.ink }}
                >
                  {item.time}
                </div>
              </div>
              {item.travel?.arrive && (
                <div>
                  <div
                    className="fact__label"
                    style={{ fontFamily: theme.fontMono, color: theme.meta }}
                  >
                    Arrives
                  </div>
                  <div
                    className="fact__value"
                    style={{ fontFamily: theme.fontMono, color: theme.ink }}
                  >
                    {item.travel.arrive}
                  </div>
                </div>
              )}
              {item.travel?.mode && (
                <div>
                  <div
                    className="fact__label"
                    style={{ fontFamily: theme.fontMono, color: theme.meta }}
                  >
                    Mode
                  </div>
                  <div
                    className="fact__value"
                    style={{ fontFamily: theme.fontMono, color: theme.ink }}
                  >
                    {item.travel.mode}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="trip-page__stack trip-page__tab-panel">
      <div
        className="wf-card wf-card--pad stay"
        style={{ background: theme.card, borderColor: theme.line }}
      >
        <div className="stay__head">
          <div>
            <div
              className="wf-card__eyebrow"
              style={{ fontFamily: theme.fontMono, color: theme.meta }}
            >
              Where you're staying
            </div>
            <div
              className="stay__name"
              style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
            >
              {STAY.name}
            </div>
            <a
              className="stay__address"
              style={{ color: theme.body }}
              href={`https://maps.google.com/?q=${encodeURIComponent(`${STAY.name} ${STAY.address}`)}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              {STAY.address}
            </a>
          </div>
          <span
            className="stay__status"
            style={{
              fontFamily: theme.fontMono,
              color: theme.tagInk,
              background: theme.tagBg,
            }}
          >
            Confirmed
          </span>
        </div>

        <div className="fact-grid">
          {STAY.facts.map((fact) => (
            <div key={fact.label}>
              <div
                className="fact__label"
                style={{ fontFamily: theme.fontMono, color: theme.meta }}
              >
                {fact.label}
              </div>
              <div
                className="fact__value"
                style={{ fontFamily: theme.fontMono, color: theme.ink }}
              >
                {fact.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {FLIGHTS.map((flight) => (
        <div
          key={flight.number}
          className="flight"
          style={{ background: theme.card, borderColor: theme.line }}
        >
          <div className="flight__body">
            <div className="flight__airline-row">
              <span
                className="flight__airline"
                style={{ fontFamily: theme.fontMono, color: theme.meta }}
              >
                {flight.airline}
              </span>
              <span className="flight__sep" />
              <span
                className="flight__airline"
                style={{ fontFamily: theme.fontMono, color: theme.meta }}
              >
                {flight.date}
              </span>
            </div>

            <div className="flight__route">
              <span
                className="flight__code"
                style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
              >
                {flight.from}
              </span>
              <span className="flight__line" style={{ background: "#E1E1DA" }}>
                <span className="flight__line-dot" style={{ background: theme.accent }} />
              </span>
              <span
                className="flight__code"
                style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
              >
                {flight.to}
              </span>
            </div>

            <div className="flight__cells">
              {flight.cells.map((cell) => (
                <div key={cell.label}>
                  <div
                    className="fact__label"
                    style={{ fontFamily: theme.fontMono, color: theme.meta }}
                  >
                    {cell.label}
                  </div>
                  <div
                    className="flight__cell-value"
                    style={{ fontFamily: theme.fontMono, color: theme.ink }}
                  >
                    {cell.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="flight__status" style={{ background: flight.statusBg }}>
              <div className="flight__status-row">
                <span
                  className="flight__status-dot"
                  style={{ background: flight.statusColor }}
                />
                <span
                  className="flight__status-label"
                  style={{ fontFamily: theme.fontMono, color: flight.statusColor }}
                >
                  {flight.status}
                </span>
                <span className="item__foot-spacer" />
                <span
                  className="flight__updated"
                  style={{ fontFamily: theme.fontMono, color: theme.body }}
                >
                  {flight.updatedShort}
                </span>
              </div>
              <div className="flight__live">
                {flight.liveCells.map((cell) => (
                  <div key={cell.label}>
                    <div
                      className="fact__label"
                      style={{ fontFamily: theme.fontMono, color: theme.body }}
                    >
                      {cell.label}
                    </div>
                    <div
                      className="flight__cell-value"
                      style={{ fontFamily: theme.fontMono, color: theme.ink }}
                    >
                      {cell.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flight__stub">
            <div
              className="flight__notch flight__notch--left"
              style={{ background: theme.bg, borderColor: theme.line }}
            />
            <div
              className="flight__notch flight__notch--right"
              style={{ background: theme.bg, borderColor: theme.line }}
            />
            <div>
              <div
                className="fact__label"
                style={{ fontFamily: theme.fontMono, color: theme.meta }}
              >
                Flight
              </div>
              <div
                className="flight__number"
                style={{ fontFamily: theme.fontMono, color: theme.ink }}
              >
                {flight.number}
              </div>
            </div>
            <div className="flight__barcode" />
            <div className="flight__ref">
              <div
                className="fact__label"
                style={{ fontFamily: theme.fontMono, color: theme.meta }}
              >
                Ref
              </div>
              <div
                className="flight__ref-value"
                style={{ fontFamily: theme.fontMono, color: theme.ink }}
              >
                {flight.ref}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
