import { ThemeProvider, type Theme } from "../../theme";
import { KIND_HEADINGS, ITEM_KINDS, type PastTrip } from "./trip-data";
import "./trip-page.css";

export function PastTripsScreen({
  trips,
  onOpen,
  onBack,
  theme,
}: {
  trips: PastTrip[];
  onOpen: (id: string) => void;
  onBack: () => void;
  theme: Theme;
}) {
  return (
    <ThemeProvider
      theme={theme}
      className="trip-page trip-page--wide"
      style={{ background: theme.bg, color: theme.ink }}
    >
      <div
        className="trip-page__head"
        style={{ background: theme.headBg, color: theme.headInk }}
      >
        <div className="trip-page__head-row">
          <button
            type="button"
            className="trip-page__reset trip-page__wordmark"
            onClick={onBack}
            style={{ fontFamily: theme.fontDisplay, letterSpacing: theme.wordTrack }}
          >
            ← {theme.wordmark}
          </button>
        </div>
        <div className="trip-page__head-main">
          <div>
            <div
              className="trip-page__dates"
              style={{ fontFamily: theme.fontMono, color: theme.headMeta }}
            >
              {trips.length} saved
            </div>
            <div className="trip-page__name" style={{ fontFamily: theme.fontDisplay }}>
              Past trips
            </div>
          </div>
        </div>
      </div>

      <div className="trip-page__body">
        <div className="trip-page__stack trip-page__stack--cards">
          {trips.length === 0 ? (
            <div className="empty-day" style={{ borderColor: theme.line, color: theme.body }}>
              <span
                className="empty-day__title"
                style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
              >
                Nothing saved yet
              </span>
              <span className="empty-day__note">
                When a trip is over, save it from the Info tab. The places you
                went become a list you can send to anyone.
              </span>
            </div>
          ) : (
            trips.map((trip) => {
              const counts = ITEM_KINDS.map((kind) => ({
                kind,
                n: trip.places.filter((p) => p.kind === kind).length,
              })).filter((c) => c.n > 0);
              return (
                <button
                  key={trip.id}
                  type="button"
                  className="trip-page__reset past-card"
                  onClick={() => onOpen(trip.id)}
                  style={{ background: theme.card, borderColor: theme.line }}
                >
                  <span
                    className="past-card__dates"
                    style={{ fontFamily: theme.fontMono, color: theme.meta }}
                  >
                    {trip.dates}
                  </span>
                  <span
                    className="past-card__name"
                    style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
                  >
                    {trip.name}
                  </span>
                  <span
                    className="past-card__counts"
                    style={{ fontFamily: theme.fontMono, color: theme.body }}
                  >
                    {counts.map((c) => `${c.n} ${KIND_HEADINGS[c.kind].toLowerCase()}`).join(" · ")}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
