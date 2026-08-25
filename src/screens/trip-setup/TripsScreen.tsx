import { useState } from "react";
import { ThemeProvider, type Theme } from "../../theme";
import type { EventDetails } from "./event-data";
import "../trip/trip-page.css";

export function TripsScreen({
  trips,
  currentId,
  onOpen,
  onCreate,
  onEdit,
  onDelete,
  onBack,
  onOpenAdmin,
  onOpenAgency,
  theme,
}: {
  trips: EventDetails[];
  currentId?: string;
  onOpen: (id: string) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onBack?: () => void;
  /** Only passed for the one account this product's creator uses — there's
   *  no in-app way to become that account, so its absence is the gate. */
  onOpenAdmin?: () => void;
  /** Open to any signed-in account — the agency itself is auto-provisioned
   *  the first time this is opened, so there's nothing to gate here. */
  onOpenAgency: () => void;
  theme: Theme;
}) {
  /* Deleting a trip takes its whole plan with it and there's no undo, so it
     asks once rather than firing on a mis-tap. */
  const [confirmingId, setConfirmingId] = useState<string>();

  return (
    <ThemeProvider
      theme={theme}
      className="trip-page"
      style={{ background: theme.bg, color: theme.ink }}
    >
      <div
        className="trip-page__head"
        style={{ background: theme.headBg, color: theme.headInk }}
      >
        <div
          className="trip-page__head-row"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <button
            type="button"
            className="trip-page__reset trip-page__wordmark"
            onClick={onBack}
            style={{
              fontFamily: theme.fontDisplay,
              letterSpacing: theme.wordTrack,
              cursor: onBack ? "pointer" : "default",
            }}
          >
            {onBack ? `← ${theme.wordmark}` : theme.wordmark}
          </button>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              className="trip-page__reset"
              onClick={onOpenAgency}
              style={{ fontFamily: theme.fontMono, color: theme.headMeta, fontSize: "12px" }}
            >
              Agency
            </button>
            {onOpenAdmin && (
              <button
                type="button"
                className="trip-page__reset"
                onClick={onOpenAdmin}
                style={{ fontFamily: theme.fontMono, color: theme.headMeta, fontSize: "12px" }}
              >
                Admin
              </button>
            )}
          </div>
        </div>
        <div className="trip-page__head-main">
          <div>
            <div
              className="trip-page__dates"
              style={{ fontFamily: theme.fontMono, color: theme.headMeta }}
            >
              {trips.length === 0
                ? "Nothing planned"
                : `${trips.length} ${trips.length === 1 ? "trip" : "trips"}`}
            </div>
            <div className="trip-page__name" style={{ fontFamily: theme.fontDisplay }}>
              Your trips
            </div>
          </div>
        </div>
      </div>

      <div className="trip-page__body">
        <div className="trip-page__stack">
          {trips.length === 0 ? (
            <div className="empty-day" style={{ borderColor: theme.line, color: theme.body }}>
              <span
                className="empty-day__title"
                style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
              >
                No trips yet
              </span>
              <span className="empty-day__note">
                Start one and you'll get a day for every date in the range, ready to fill in.
              </span>
            </div>
          ) : (
            trips.map((trip) => (
              <div
                key={trip.id}
                className="trip-card"
                style={{ background: theme.card, borderColor: theme.line }}
              >
                <button
                  type="button"
                  className="trip-page__reset trip-card__open"
                  onClick={() => onOpen(trip.id)}
                >
                  <span
                    className="past-card__dates"
                    style={{ fontFamily: theme.fontMono, color: theme.meta }}
                  >
                    {trip.dates}
                    {trip.id === currentId ? " · open" : ""}
                  </span>
                  <span
                    className="past-card__name"
                    style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
                  >
                    {trip.name}
                  </span>
                  {trip.destination && (
                    <span
                      className="past-card__counts"
                      style={{ fontFamily: theme.fontMono, color: theme.body }}
                    >
                      {trip.destination}
                    </span>
                  )}
                </button>

                {confirmingId === trip.id ? (
                  <div className="trip-card__actions">
                    <span className="trip-card__warn" style={{ color: theme.body }}>
                      Delete this trip and its plan?
                    </span>
                    <button
                      type="button"
                      className="trip-page__reset trip-card__action"
                      onClick={() => {
                        setConfirmingId(undefined);
                        onDelete(trip.id);
                      }}
                      style={{ fontFamily: theme.fontMono, color: "oklch(0.5 0.16 25)" }}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="trip-page__reset trip-card__action"
                      onClick={() => setConfirmingId(undefined)}
                      style={{ fontFamily: theme.fontMono, color: theme.body }}
                    >
                      Keep
                    </button>
                  </div>
                ) : (
                  <div className="trip-card__actions">
                    <button
                      type="button"
                      className="trip-page__reset trip-card__action"
                      onClick={() => onEdit(trip.id)}
                      style={{ fontFamily: theme.fontMono, color: theme.accent }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="trip-page__reset trip-card__action"
                      onClick={() => setConfirmingId(trip.id)}
                      style={{ fontFamily: theme.fontMono, color: theme.body }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}

          <button
            type="button"
            className="trip-page__reset trip-page__add trips__new"
            onClick={onCreate}
            style={{ color: theme.bg, background: theme.ink, borderColor: theme.ink }}
          >
            Start another trip
          </button>
        </div>
      </div>
    </ThemeProvider>
  );
}
