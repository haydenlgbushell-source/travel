export interface Theme {
  key: string;
  name: string;
  blurb: string;

  /** Copy tokens — a theme also sets the tone of small labels, not just colour. */
  wordmark: string;
  typeNote: string;
  strapline: string;
  countdown: string;
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
