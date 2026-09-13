import { useState, type CSSProperties, type ReactNode } from "react";
import type { Theme } from "../../theme";
import { mapChoices, type TripItem } from "./trip-data";
import { Sheet } from "./Sheet";

/** Wherever the app used to be a plain link straight to Google Maps, this
 *  is a button that opens a small sheet of the same handful of providers
 *  instead — Apple Maps, Google Maps, Waze — so which app actually opens
 *  is the person's choice, not whichever one the link happened to name. */
export function MapsMenuButton({
  item,
  theme,
  className,
  style,
  ariaLabel,
  children,
}: {
  item: TripItem;
  theme: Theme;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className ? `trip-page__reset ${className}` : "trip-page__reset"}
        style={style}
        aria-label={ariaLabel}
        onClick={(e) => {
          /* Every one of these sits inside a larger clickable card or row —
             without this, choosing a map app would also open the item. */
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {children}
      </button>
      {open && (
        <Sheet title="Open in Maps" onClose={() => setOpen(false)} theme={theme} className="maps-sheet">
          {mapChoices(item).map((choice) => (
            <a
              key={choice.label}
              className="trip-page__reset maps-sheet__item"
              href={choice.url}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => setOpen(false)}
              style={{ background: theme.card, borderColor: theme.line, color: theme.ink, fontFamily: theme.fontSans }}
            >
              {choice.label}
            </a>
          ))}
        </Sheet>
      )}
    </>
  );
}
