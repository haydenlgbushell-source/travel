import type { Theme } from "../../theme";
import type { Verdict } from "./ItemCard";
import { downloadICS } from "./calendar-export";
import { INFO, type Day } from "./trip-data";

export function InfoTab({
  savedCount,
  onSaveTrip,
  onOpenPast,
  eventName,
  days,
  resolved,
  isExample,
  theme,
}: {
  savedCount: number;
  onSaveTrip: () => void;
  onOpenPast: () => void;
  eventName: string;
  days: Day[];
  resolved: Record<string, Verdict>;
  isExample: boolean;
  theme: Theme;
}) {
  /* Visas, currency and emergency numbers here are written for the example's
     US trip — showing them on someone's trip to anywhere else would be
     actively wrong, so they only appear on the example. */
  const entries = isExample ? INFO : [];

  return (
    <div className="trip-page__stack trip-page__stack--tight trip-page__tab-panel">
      {entries.map((entry) => (
        <div
          key={entry.label}
          className="info-card"
          style={{ background: theme.card, borderColor: theme.line }}
        >
          <div
            className="wf-card__eyebrow"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            {entry.label}
          </div>
          <div
            className="info-card__value"
            style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
          >
            {entry.value}
          </div>
          <div className="info-card__note" style={{ color: theme.body }}>
            {entry.note}
          </div>
        </div>
      ))}

      <div
        className="info-card"
        style={{ background: theme.card, borderColor: theme.line }}
      >
        <div
          className="wf-card__eyebrow"
          style={{ fontFamily: theme.fontMono, color: theme.meta }}
        >
          Keep it with you
        </div>
        <div
          className="info-card__value"
          style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
        >
          Add to your calendar
        </div>
        <div className="info-card__note" style={{ color: theme.body }}>
          Every approved item, as its own event with the time and place —
          import the file into whichever calendar app you actually use.
        </div>
        <div className="info-card__actions">
          <button
            type="button"
            className="trip-page__reset info-card__btn"
            onClick={() => downloadICS(eventName, days, resolved)}
            style={{ color: theme.bg, background: theme.ink }}
          >
            Download .ics
          </button>
        </div>
      </div>

      {/* When the trip is over, what is worth keeping is where you went. */}
      <div
        className="info-card"
        style={{ background: theme.card, borderColor: theme.line }}
      >
        <div
          className="wf-card__eyebrow"
          style={{ fontFamily: theme.fontMono, color: theme.meta }}
        >
          When you are home
        </div>
        <div
          className="info-card__value"
          style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
        >
          Save the places
        </div>
        <div className="info-card__note" style={{ color: theme.body }}>
          Keep the restaurants, the stay and the things you did as a list you
          can send to whoever asks where to go.
        </div>
        <div className="info-card__actions">
          <button
            type="button"
            className="trip-page__reset info-card__btn"
            onClick={onSaveTrip}
            style={{ color: theme.bg, background: theme.ink }}
          >
            Save this trip
          </button>
          <button
            type="button"
            className="trip-page__reset add-sheet__more"
            onClick={onOpenPast}
            style={{ fontFamily: theme.fontMono, color: theme.accent }}
          >
            Past trips{savedCount > 0 ? ` · ${savedCount}` : ""} →
          </button>
        </div>
      </div>
    </div>
  );
}
