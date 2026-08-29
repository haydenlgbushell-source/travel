import { useEffect, useState } from "react";

/** The width at which the app stops being a phone column and becomes a
 *  two-pane desktop layout. Kept here rather than only in CSS because the
 *  trip page changes what it *renders* at this size, not just how it looks:
 *  the bottom tab bar becomes a sidebar with room for every tab, so Money
 *  and People stop being hidden behind the menu. */
export const DESKTOP_QUERY = "(min-width: 1040px)";

export function useIsDesktop(): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setMatches(mq.matches);
    /* Read once on mount too — the window can be resized between the
       initial state above and this subscription. */
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return matches;
}
