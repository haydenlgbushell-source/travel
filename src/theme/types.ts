export interface Theme {
  key: string;
  name: string;
  blurb: string;

  /** Copy tokens — a theme also sets the tone of small labels, not just colour. */
  wordmark: string;
  /** A picture to show instead of the wordmark. Only ever set by an agency's
   *  own branding — the four built-in styles are wordmark-only. */
  logoUrl?: string;
  typeNote: string;
  strapline: string;
  /** Shown while the trip is running. */
  countdown: string;
  /** Shown before it starts. `{n}` is the number of days, `{s}` the plural
   *  "s" — "In {n} day{s}" reads correctly at 1 and at 5. */
  countdownAway: string;
  /** Shown once it's over. */
  countdownDone: string;
  dayTitle: string;
  tag: string;
  bookingLabel: string;
  itemNote: string;
  cta: string;
  secondary: string;

  /** Type */
  fontDisplay: string;
  fontSans: string;
  fontMono: string;
  wordTrack: string;

  /** Colour */
  bg: string;
  card: string;
  strip: string;
  line: string;
  ink: string;
  body: string;
  meta: string;

  headBg: string;
  headInk: string;
  headMeta: string;
  avatarBg: string;

  accent: string;
  accentInk: string;
  btnInk: string;

  tagBg: string;
  tagInk: string;
  okInk: string;

  warnBg: string;
  warnInk: string;
  star: string;

  photoFill: string;

  /** Radii */
  frameRadius: string;
  cardRadius: string;
  pillRadius: string;
  chipRadius: string;

  /** Card swatches shown in the style picker. */
  swatches: [string, string, string];
}
