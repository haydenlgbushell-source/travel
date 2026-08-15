import { ThemeProvider, type Theme } from "../../theme";
import { PlacesList } from "./PlacesList";
import type { SharedList } from "./trip-data";
import "./trip-page.css";

/** What somebody sees when they open a shared link. Read-only, and no
 *  account — the list arrived inside the URL. */
export function SharedListScreen({
  list,
  onDismiss,
  theme,
}: {
  list: SharedList;
  onDismiss: () => void;
  theme: Theme;
}) {
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
        <div className="trip-page__head-row">
          <span
            className="trip-page__wordmark"
            style={{ fontFamily: theme.fontDisplay, letterSpacing: theme.wordTrack }}
          >
            {theme.wordmark}
          </span>
          <span
            className="trip-page__countdown"
            style={{ fontFamily: theme.fontMono, color: theme.headMeta }}
          >
            Shared with you
          </span>
        </div>
        <div className="trip-page__head-main">
          <div>
            <div
              className="trip-page__dates"
              style={{ fontFamily: theme.fontMono, color: theme.headMeta }}
            >
              {list.dates}
              {list.from ? ` · from ${list.from}` : ""}
            </div>
            <div className="trip-page__name" style={{ fontFamily: theme.fontDisplay }}>
              {list.name}
            </div>
          </div>
        </div>
      </div>

      <div className="trip-page__body">
        <div className="trip-page__stack">
          <PlacesList places={list.places} theme={theme} />
        </div>
      </div>

      <div
        className="trip-page__bar"
        style={{ background: theme.bg, borderTopColor: "#E1E1DA" }}
      >
        <button
          type="button"
          className="trip-page__reset trip-page__add"
          onClick={onDismiss}
          style={{ color: theme.bg, background: theme.ink, borderColor: theme.ink }}
        >
          Plan your own trip
        </button>
      </div>
    </ThemeProvider>
  );
}
