export type HomeScreenState = "already-installed" | "iphone" | "other";

/** Whether this browser is already running as the installed app, an iPhone
 *  that could install it via Safari's Share sheet, or neither — so the
 *  intro guide's "add it to your Home Screen" step can say the right thing
 *  instead of reciting iOS instructions to someone already using the
 *  installed app, or to someone on Android, which has no Safari Share
 *  sheet at all.
 *
 *  Takes its inputs rather than reading `window` itself, so the branching
 *  is testable without a browser. `iosStandaloneFlag` is Safari's own
 *  non-standard `navigator.standalone`; `standaloneMedia` is the portable
 *  `display-mode: standalone` media query every other installed PWA sets. */
export function homeScreenState(input: {
  userAgent: string;
  iosStandaloneFlag?: boolean;
  standaloneMedia: boolean;
}): HomeScreenState {
  if (input.iosStandaloneFlag || input.standaloneMedia) return "already-installed";
  return /iphone|ipad|ipod/i.test(input.userAgent) ? "iphone" : "other";
}

export function currentHomeScreenState(): HomeScreenState {
  if (typeof window === "undefined" || !window.navigator) return "other";
  return homeScreenState({
    userAgent: window.navigator.userAgent,
    iosStandaloneFlag: (window.navigator as unknown as { standalone?: boolean }).standalone,
    standaloneMedia: window.matchMedia?.("(display-mode: standalone)").matches ?? false,
  });
}
