import type { Theme } from "../../theme";
import { INFO } from "./trip-data";

export function InfoTab({
  savedCount,
  onSaveTrip,
  onOpenPast,
  theme,
}: {
  savedCount: number;
  onSaveTrip: () => void;
  onOpenPast: () => void;
  theme: Theme;
}) {
  return (
    <div className="trip-page__stack trip-page__stack--tight trip-page__tab-panel">
      {INFO.map((entry) => (
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
