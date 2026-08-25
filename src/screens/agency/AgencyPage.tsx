import { useEffect, useState } from "react";
import { ThemeProvider, type Theme } from "../../theme";
import type { EventDetails } from "../trip-setup/event-data";
import { loadAgencyTrips, type Agency } from "./agency-data";
import "../trip/trip-page.css";

export function AgencyPage({
  agency,
  onOpenTrip,
  onCreateClientTrip,
  onBack,
  theme,
}: {
  /** Only ever handed to this page once the caller has confirmed the
   *  account has agency access — this page has no path of its own to get
   *  or grant it, so it never fetches or creates one itself. */
  agency: Agency;
  onOpenTrip: (id: string) => void;
  /** Sends the agent into the normal "new trip" flow, tagged so the trip
   *  that comes out of it belongs to this agency rather than being
   *  personal. */
  onCreateClientTrip: (agencyId: string) => void;
  onBack: () => void;
  theme: Theme;
}) {
  const [trips, setTrips] = useState<EventDetails[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    loadAgencyTrips(agency.id)
      .then((t) => {
        if (!cancelled) setTrips(t);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your agency's trips.");
      });
    return () => {
      cancelled = true;
    };
  }, [agency.id]);

  return (
    <ThemeProvider theme={theme} className="trip-page" style={{ background: theme.bg, color: theme.ink }}>
      <div className="trip-page__head" style={{ background: theme.headBg, color: theme.headInk }}>
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
            <div className="trip-page__dates" style={{ fontFamily: theme.fontMono, color: theme.headMeta }}>
              {trips
                ? `${trips.length} client ${trips.length === 1 ? "trip" : "trips"}`
                : "Loading…"}
            </div>
            <div className="trip-page__name" style={{ fontFamily: theme.fontDisplay }}>
              {agency.name}
            </div>
          </div>
        </div>
      </div>

      <div className="trip-page__body">
        <div className="trip-page__stack">
          {error && (
            <div className="empty-day" style={{ borderColor: theme.line, color: theme.body }}>
              <span className="empty-day__note">{error}</span>
            </div>
          )}

          {trips?.length === 0 && (
            <div className="empty-day" style={{ borderColor: theme.line, color: theme.body }}>
              <span className="empty-day__title" style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
                No client trips yet
              </span>
              <span className="empty-day__note">
                Build one the same way you'd build your own — it'll show up here, tagged as this
                agency's rather than personal.
              </span>
            </div>
          )}

          {trips?.map((trip) => (
            <div key={trip.id} className="trip-card" style={{ background: theme.card, borderColor: theme.line }}>
              <button
                type="button"
                className="trip-page__reset trip-card__open"
                onClick={() => onOpenTrip(trip.id)}
              >
                <span className="past-card__dates" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
                  {trip.dates}
                </span>
                <span className="past-card__name" style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
                  {trip.name}
                </span>
                {trip.destination && (
                  <span className="past-card__counts" style={{ fontFamily: theme.fontMono, color: theme.body }}>
                    {trip.destination}
                  </span>
                )}
              </button>
            </div>
          ))}

          <button
            type="button"
            className="trip-page__reset trip-page__add trips__new"
            onClick={() => onCreateClientTrip(agency.id)}
            style={{ color: theme.bg, background: theme.ink, borderColor: theme.ink }}
          >
            Build a client trip
          </button>

          <span
            className="add-sheet__foot"
            style={{ fontFamily: theme.fontMono, color: theme.meta, textAlign: "center" }}
          >
            Open a client trip's People tab to generate an access code they can use with no
            account of their own.
          </span>
        </div>
      </div>
    </ThemeProvider>
  );
}
