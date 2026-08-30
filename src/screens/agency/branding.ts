import { supabase } from "../../lib/supabase";
import type { Theme } from "../../theme";

/** What an agency chooses for itself. Deliberately four fields rather than
 *  the thirty a Theme carries: an agency picks a logo, a name, and two
 *  colours, and `brandTheme` below derives everything else. Asking a travel
 *  agent to specify `headMeta` would be absurd, and letting them would let
 *  them build something unreadable. */
export interface AgencyBranding {
  /** A picture to use in place of the wordmark. */
  logoUrl?: string;
  /** The name shown when there's no logo — or as the logo's alt text. */
  wordmark?: string;
  /** Buttons, links, the active-tab mark. */
  accent?: string;
  /** The dark bar across the top of every screen. */
  headBg?: string;
}

interface BrandingRow {
  logo_url: string | null;
  wordmark: string | null;
  accent: string | null;
  head_bg: string | null;
}

function fromRow(row: BrandingRow | undefined): AgencyBranding | undefined {
  if (!row) return undefined;
  return {
    logoUrl: row.logo_url ?? undefined,
    wordmark: row.wordmark ?? undefined,
    accent: row.accent ?? undefined,
    headBg: row.head_bg ?? undefined,
  };
}

/** Both loaders swallow every failure into `undefined`, which is the same
 *  thing they return for an agency that simply hasn't set any branding.
 *  Branding decorates a screen rather than carrying any of its meaning, so
 *  a failed read should cost you a logo, never the trip. The functions
 *  themselves filter rather than raise, so "not yours to see" and "not set"
 *  are already the same answer server-side. */
export async function loadAgencyBranding(
  agencyId: string,
): Promise<AgencyBranding | undefined> {
  try {
    const { data, error } = await supabase.rpc("agency_branding_get", {
      p_agency_id: agencyId,
    });
    if (error) return undefined;
    return fromRow((data as BrandingRow[])?.[0]);
  } catch {
    return undefined;
  }
}

/** The client-facing read: anyone who can open the trip can see whose brand
 *  it carries, including a guest on an access code who has no agency
 *  relationship of their own. */
export async function loadTripBranding(
  tripId: string,
): Promise<AgencyBranding | undefined> {
  try {
    const { data, error } = await supabase.rpc("trip_branding", { p_trip_id: tripId });
    if (error) return undefined;
    return fromRow((data as BrandingRow[])?.[0]);
  } catch {
    return undefined;
  }
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

export type UploadLogoError = "too-large" | "wrong-type";

/** Owner-only, enforced by storage RLS on the `agency-logos` bucket (the
 *  object path's first segment has to be this agency's id, and only that
 *  agency's owner can write under it — see the agency_logo_storage
 *  migration). Each upload gets its own filename rather than overwriting a
 *  fixed one, so there's no stale-cache window where the old logo still
 *  shows at the same URL. */
export async function uploadAgencyLogo(
  agencyId: string,
  file: File,
): Promise<{ url: string } | { error: UploadLogoError }> {
  if (file.size > MAX_LOGO_BYTES) return { error: "too-large" };
  const ext = LOGO_MIME_EXT[file.type];
  if (!ext) return { error: "wrong-type" };

  const path = `${agencyId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("agency-logos")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw error;

  const { data } = supabase.storage.from("agency-logos").getPublicUrl(path);
  return { url: data.publicUrl };
}

/** Owner-only, enforced in the function rather than here. Throws, unlike the
 *  loaders — a save that silently did nothing would be worse than an error. */
export async function saveAgencyBranding(
  agencyId: string,
  branding: AgencyBranding,
): Promise<void> {
  const { error } = await supabase.rpc("agency_branding_set", {
    p_agency_id: agencyId,
    p_logo_url: branding.logoUrl ?? null,
    p_wordmark: branding.wordmark ?? null,
    p_accent: branding.accent ?? null,
    p_head_bg: branding.headBg ?? null,
  });
  if (error) throw error;
}

/* ---------- colour ---------- */

export function isHex(value: string | undefined): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value.trim());
}

/** The four built-in styles write their colours as `oklch(L C H)`, which
 *  `<input type="color">` cannot take — handed one it silently shows black,
 *  so the picker opened on black rather than on the colour actually in use.
 *  This converts, via OKLab to linear sRGB to gamma-encoded sRGB, so the
 *  picker starts where the agency's eye expects. */
export function oklchToHex(value: string): string | undefined {
  const m = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/i.exec(value.trim());
  if (!m) return undefined;
  const [L, C, hDeg] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const ss = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const lin = [
    +4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss,
  ];
  const gamma = (u: number) =>
    u <= 0.0031308 ? 12.92 * u : 1.055 * Math.abs(u) ** (1 / 2.4) - 0.055;
  return toHex(lin.map((u) => gamma(u) * 255) as [number, number, number]);
}

/** Whatever a theme token holds, as something a colour input can open on. */
export function asHex(value: string): string | undefined {
  if (isHex(value)) return value.trim().toUpperCase();
  return oklchToHex(value)?.toUpperCase();
}

function toRgb(hex: string): [number, number, number] {
  const h = hex.trim().slice(1);
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  const part = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** WCAG relative luminance — the same measure the contrast ratio is built
 *  on, so "is this colour light or dark" agrees with "is text readable on
 *  it". A naive average of the channels does not: pure blue and pure yellow
 *  average the same and are nothing alike to read against. */
export function luminance(hex: string): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = toRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio, 1–21. Used to decide between light and dark text rather
 *  than to grade the result — either way one of the two wins. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const NEAR_BLACK = "#14171a";
const NEAR_WHITE = "#ffffff";

/** Whichever of near-black and white is easier to read on this background.
 *  An agency picking a pale gold header must not end up with white text on
 *  it, which is exactly what a fixed `headInk` would have given them. */
export function readableInk(background: string): string {
  return contrast(background, NEAR_WHITE) >= contrast(background, NEAR_BLACK)
    ? NEAR_WHITE
    : NEAR_BLACK;
}

/** Blend two colours. Used for the quieter tones — meta text, the avatar
 *  circles — which sit between the ink and its background. */
export function mix(from: string, to: string, amount: number): string {
  const [r1, g1, b1] = toRgb(from);
  const [r2, g2, b2] = toRgb(to);
  const t = Math.max(0, Math.min(1, amount));
  return toHex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]);
}

/** The quieter of two lines of text on the same background — mixed toward
 *  that background until it reads as secondary, but no further than the
 *  contrast floor allows.
 *
 *  A fixed blend can't do this. Against a near-black or near-white header
 *  there is plenty of range and 45% looks right; against a mid-tone one —
 *  a teal, a mid green — the ink and the background start close together,
 *  and the same 45% lands at 2.7:1, which is unreadable. So it steps back
 *  toward the ink until it clears 3:1, giving up contrast for hierarchy
 *  only while there is contrast to spare. */
function readableMuted(ink: string, background: string): string {
  for (let amount = 0.45; amount > 0; amount -= 0.05) {
    const candidate = mix(ink, background, amount);
    if (contrast(candidate, background) >= 3) return candidate;
  }
  return ink;
}

/** An accent bright enough to fill a button is often too pale to read as
 *  text on paper. This darkens it until it clears 4.5:1 against the card,
 *  so the same choice can do both jobs. */
function readableAccentInk(accent: string, on: string): string {
  let ink = accent;
  for (let i = 0; i < 12 && contrast(ink, on) < 4.5; i++) {
    ink = mix(ink, NEAR_BLACK, 0.12);
  }
  return ink;
}

/** Folds an agency's four choices into a full Theme, deriving every token
 *  they didn't pick. Anything unset — or set to something that isn't a hex
 *  colour — falls through to the trip's own style untouched, so a partly
 *  filled-in brand is still a coherent screen rather than a half-applied
 *  one. */
export function brandTheme(theme: Theme, branding: AgencyBranding | undefined): Theme {
  if (!branding) return theme;
  let next: Theme = { ...theme };

  if (branding.wordmark?.trim()) next.wordmark = branding.wordmark.trim();
  if (branding.logoUrl?.trim()) next.logoUrl = branding.logoUrl.trim();

  if (isHex(branding.accent)) {
    const accent = branding.accent.trim();
    next = {
      ...next,
      accent,
      /* Text *on* the accent, and the accent used *as* text — two different
         contrast problems, so two different answers. */
      btnInk: readableInk(accent),
      accentInk: readableAccentInk(accent, asHex(next.card) ?? NEAR_WHITE),
    };
  }

  if (isHex(branding.headBg)) {
    const headBg = branding.headBg.trim();
    const headInk = readableInk(headBg);
    next = {
      ...next,
      headBg,
      headInk,
      /* The secondary line in the header: legible, but clearly the quieter
         of the two. */
      headMeta: readableMuted(headInk, headBg),
      avatarBg: mix(headBg, headInk, 0.16),
    };
  }

  return next;
}
