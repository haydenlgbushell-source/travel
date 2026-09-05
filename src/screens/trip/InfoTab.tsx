import type { Theme } from "../../theme";
import type { Verdict } from "./ItemCard";
import { downloadICS } from "./calendar-export";
import { emergencyNumberFor, travelAdviceUrl, INFO, type Day } from "./trip-data";

export function InfoTab({
  savedCount,
  onSaveTrip,
  onOpenPast,
  eventName,
  destination,
  country,
  days,
  resolved,
  isExample,
  theme,
}: {
  savedCount: number;
  onSaveTrip: () => void;
  onOpenPast: () => void;
  eventName: string;
  /** Where a real trip is — absent until the organiser's typed destination
   *  has actually geocoded. */
  destination?: string;
  country?: string;
  days: Day[];
  resolved: Record<string, Verdict>;
  isExample: boolean;
  theme: Theme;
}) {
  /* Visas, currency and emergency numbers here are written for the example's
     US trip — showing them on someone's trip to anywhere else would be
     actively wrong, so they only appear on the example. */
  const entries = isExample ? INFO : [];
  const emergencyNumber = !isExample ? emergencyNumberFor(country) : undefined;

  return (
    <div className="trip-page__stack trip-page__stack--tight trip-page__tab-panel">
      {!isExample && destination && (
        <div className="info-card" style={{ background: theme.card, borderColor: theme.line }}>
          <div className="wf-card__eyebrow" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
            Emergency
          </div>
          <div className="info-card__value" style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
            {emergencyNumber ?? "Check locally"}
          </div>
          <div className="info-card__note" style={{ color: theme.body }}>
            {emergencyNumber
              ? `The standard emergency number in ${country}.`
              : `We don't have a listed emergency number for ${destination} — check on arrival (a hotel or the airport will know) and keep it with the group.`}
          </div>
        </div>
      )}

      {!isExample && destination && (
        <div className="info-card" style={{ background: theme.card, borderColor: theme.line }}>
          <div className="wf-card__eyebrow" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
            Before you go
          </div>
          <div className="info-card__value" style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
            Travel advice
          </div>
          <div className="info-card__note" style={{ color: theme.body }}>
            Smartraveller's official Australian Government advice for {destination} — entry and
            visa requirements, safety notices, vaccinations.
          </div>
          <div className="info-card__actions">
            <a
              className="trip-page__reset info-card__btn"
              href={travelAdviceUrl(destination)}
              target="_blank"
              rel="noreferrer noopener"
              style={{ color: theme.bg, background: theme.ink, textDecoration: "none" }}
            >
              Check Smartraveller ↗
            </a>
          </div>
        </div>
      )}

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
