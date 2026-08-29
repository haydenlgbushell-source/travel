import { useState } from "react";
import { ThemeProvider, type Theme } from "../../theme";
import { PlacesList } from "./PlacesList";
import { ShareSheet } from "./ShareSheet";
import type { PastTrip } from "./trip-data";
import "./trip-page.css";

export function PastTripScreen({
  trip,
  onBack,
  onForget,
  theme,
}: {
  trip: PastTrip;
  onBack: () => void;
  onForget: () => void;
  theme: Theme;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmForget, setConfirmForget] = useState(false);

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
            ← Past trips
          </button>
          <span
            className="trip-page__countdown"
            style={{ fontFamily: theme.fontMono, color: theme.headMeta }}
          >
            {trip.places.length} places
          </span>
        </div>
        <div className="trip-page__head-main">
          <div>
            <div
              className="trip-page__dates"
              style={{ fontFamily: theme.fontMono, color: theme.headMeta }}
            >
              {trip.dates}
            </div>
            <div className="trip-page__name" style={{ fontFamily: theme.fontDisplay }}>
              {trip.name}
            </div>
          </div>
        </div>
      </div>

      <div className="trip-page__body">
        <div className="trip-page__stack">
          <PlacesList places={trip.places} theme={theme} />

          <button
            type="button"
            className="trip-page__reset add-sheet__delete"
            onClick={() => (confirmForget ? onForget() : setConfirmForget(true))}
            style={{ fontFamily: theme.fontMono, color: "oklch(0.5 0.13 30)" }}
          >
            {confirmForget ? "Tap again to forget this trip" : "Forget this trip"}
          </button>
        </div>
      </div>

      <div
        className="trip-page__bar"
        style={{ background: theme.bg, borderTopColor: "#E1E1DA" }}
      >
        <button
          type="button"
          className="trip-page__reset trip-page__add"
          onClick={() => setShareOpen(true)}
          style={{ color: theme.bg, background: theme.ink, borderColor: theme.ink }}
        >
          Share these places
        </button>
      </div>

      {shareOpen && (
        <ShareSheet trip={trip} onClose={() => setShareOpen(false)} theme={theme} />
      )}
    </ThemeProvider>
  );
}
