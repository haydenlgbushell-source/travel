import type { Theme } from "./types";

/** The brand in the corner of every screen: an agency's logo where there is
 *  one, the style's wordmark where there isn't. A logo that fails to load
 *  falls back to the text rather than leaving a broken-image icon in the
 *  header — the URL is typed by hand and points at a host we don't control. */
export function Wordmark({ theme, prefix }: { theme: Theme; prefix?: string }) {
  if (theme.logoUrl) {
    return (
      <>
        {prefix}
        <img
          className="wf-logo"
          src={theme.logoUrl}
          alt={theme.wordmark}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.insertAdjacentText("afterend", theme.wordmark);
          }}
        />
      </>
    );
  }
  return (
    <>
      {prefix}
      {theme.wordmark}
    </>
  );
}
