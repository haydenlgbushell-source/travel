import { useEffect, useState } from "react";
import { Wordmark, type Theme } from "../../theme";
import {
  asHex,
  brandTheme,
  isHex,
  loadAgencyBranding,
  saveAgencyBranding,
  type AgencyBranding,
} from "./branding";

/** Suggestions, not a palette — an agency with a brand book types their own
 *  hex in. These exist so the picker opens somewhere sensible rather than on
 *  black. */
const HEAD_PRESETS = ["#14171A", "#1B3A4B", "#243B2E", "#3B2432", "#4A3B22"];
const ACCENT_PRESETS = ["#5B54B8", "#0F7B6C", "#B4522E", "#1F6FB2", "#8A5A2B"];

function ColourField({
  label,
  hint,
  value,
  fallback,
  onChange,
  presets,
}: {
  label: string;
  hint: string;
  value: string;
  /** What the trip's own style uses when the agency hasn't chosen. Already
   *  normalised to hex by the caller — the built-in styles store their
   *  accents as oklch(), which a colour input silently renders as black. */
  fallback: string;
  onChange: (value: string) => void;
  presets: string[];
}) {
  const valid = value.trim() === "" || isHex(value);
  return (
    <div className="brand__field">
      <span className="brand__label">{label}</span>
      <div className="brand__colour-row">
        <input
          type="color"
          className="brand__swatch-input"
          aria-label={`${label} colour picker`}
          value={isHex(value) ? value : fallback}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
        />
        <input
          className="brand__input brand__input--hex"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fallback}
          spellCheck={false}
          aria-label={`${label} hex value`}
        />
        {value.trim() !== "" && (
          <button
            type="button"
            className="brand__reset-link"
            onClick={() => onChange("")}
          >
            Reset
          </button>
        )}
      </div>
      <div className="brand__presets">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className="brand__preset"
            style={{ background: preset }}
            aria-label={`Use ${preset}`}
            onClick={() => onChange(preset)}
          />
        ))}
      </div>
      <span className={`brand__hint${valid ? "" : " brand__hint--warn"}`}>
        {valid ? hint : "That needs to be a hex colour, like #1B3A4B."}
      </span>
    </div>
  );
}

/** Where an agency puts its own logo and colours on the trips it builds.
 *  Owner-only: an Agent can build client trips but not restyle the agency. */
export function BrandPanel({
  agencyId,
  agencyName,
  isOwner,
  baseTheme,
  onSaved,
}: {
  agencyId: string;
  agencyName: string;
  isOwner: boolean;
  /** The trip style the branding sits on top of — every token the agency
   *  doesn't choose comes from here. */
  baseTheme: Theme;
  /** So the page around this can repaint itself the moment it's saved. */
  onSaved: (branding: AgencyBranding) => void;
}) {
  const [draft, setDraft] = useState<AgencyBranding>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ text: string; tone: "ok" | "error" }>();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadAgencyBranding(agencyId).then((branding) => {
      if (cancelled) return;
      setDraft(branding ?? {});
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [agencyId]);

  /* The preview is the real thing: the same brandTheme the trip page runs,
     so what an agency sees here is what their client gets — including the
     ink colours derived from their choices, which is the part they can't
     picture from a hex code. */
  const preview = brandTheme(baseTheme, draft);
  const set = <K extends keyof AgencyBranding>(key: K, value: AgencyBranding[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const badLogo =
    (draft.logoUrl ?? "").trim() !== "" && !/^https:\/\//i.test((draft.logoUrl ?? "").trim());
  const badColour =
    ((draft.accent ?? "").trim() !== "" && !isHex(draft.accent)) ||
    ((draft.headBg ?? "").trim() !== "" && !isHex(draft.headBg));

  async function save() {
    setSaving(true);
    setStatus(undefined);
    try {
      await saveAgencyBranding(agencyId, draft);
      onSaved(draft);
      setStatus({ text: "Saved — every client trip you own now carries it.", tone: "ok" });
    } catch {
      setStatus({
        text: "Couldn't save that. If nothing here has ever saved, the branding migration may not have been run on the database yet.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="brand">
        <div className="brand__panel brand__panel--empty">Loading your brand…</div>
      </div>
    );
  }

  return (
    <div className="brand">
      <div className="brand__panel">
        <div className="brand__head">
          <span className="brand__title">Your brand</span>
          <span className="brand__hint">
            {isOwner
              ? "Applied to every client trip this agency owns — on their phones too."
              : "Only the agency's owner can change this."}
          </span>
        </div>

        <fieldset className="brand__fields" disabled={!isOwner || saving}>
          <legend className="brand__visually-hidden">Brand settings</legend>

          <div className="brand__field">
            <span className="brand__label">Name</span>
            <input
              className="brand__input"
              value={draft.wordmark ?? ""}
              onChange={(e) => set("wordmark", e.target.value)}
              placeholder={agencyName}
            />
            <span className="brand__hint">
              Shown where the app's own name would be. Leave it blank to use
              "{agencyName}".
            </span>
          </div>

          <div className="brand__field">
            <span className="brand__label">Logo</span>
            <input
              className="brand__input"
              type="url"
              inputMode="url"
              value={draft.logoUrl ?? ""}
              onChange={(e) => set("logoUrl", e.target.value)}
              placeholder="https://…/logo.svg"
              spellCheck={false}
            />
            <span className={`brand__hint${badLogo ? " brand__hint--warn" : ""}`}>
              {badLogo
                ? "The address has to start with https:// — the browser won't load a logo over anything else."
                : "A wide, transparent PNG or SVG works best. It replaces the name above; if it won't load, the name comes back."}
            </span>
          </div>

          <ColourField
            label="Header"
            hint="The bar across the top of every screen. Text on it is set to whichever of black or white reads better."
            value={draft.headBg ?? ""}
            fallback={asHex(baseTheme.headBg) ?? "#14171A"}
            presets={HEAD_PRESETS}
            onChange={(v) => set("headBg", v)}
          />

          <ColourField
            label="Accent"
            hint="Buttons, links and the marker on the open tab."
            value={draft.accent ?? ""}
            fallback={asHex(baseTheme.accent) ?? "#5B54B8"}
            presets={ACCENT_PRESETS}
            onChange={(v) => set("accent", v)}
          />
        </fieldset>

        {isOwner && (
          <div className="brand__actions">
            <button
              type="button"
              className="brand__btn brand__btn--primary"
              disabled={saving || badColour || badLogo}
              onClick={() => void save()}
            >
              {saving ? "Saving…" : "Save brand"}
            </button>
            <button
              type="button"
              className="brand__btn brand__btn--ghost"
              disabled={saving}
              onClick={() => setDraft({})}
            >
              Clear all
            </button>
            {status && (
              <span
                className={`brand__hint${status.tone === "error" ? " brand__hint--warn" : ""}`}
              >
                {status.text}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Not a mockup — the same tokens the trip page reads, so the ink
          colours derived from their choices show up here first. */}
      <div className="brand__panel">
        <div className="brand__head">
          <span className="brand__title">What your client sees</span>
        </div>
        <div
          className="brand__preview"
          style={{ background: preview.bg, borderColor: preview.line }}
        >
          <div
            className="brand__preview-head"
            style={{ background: preview.headBg, color: preview.headInk }}
          >
            <span
              className="brand__preview-mark"
              style={{
                fontFamily: preview.fontDisplay,
                letterSpacing: preview.wordTrack,
              }}
            >
              <Wordmark theme={preview} />
            </span>
            <span
              className="brand__preview-dates"
              style={{ fontFamily: preview.fontMono, color: preview.headMeta }}
            >
              3 – 17 April 2027
            </span>
            <span className="brand__preview-name" style={{ fontFamily: preview.fontDisplay }}>
              The Bennett family, Japan
            </span>
          </div>
          <div className="brand__preview-body">
            <div
              className="brand__preview-card"
              style={{ background: preview.card, borderColor: preview.line }}
            >
              <span
                className="brand__preview-time"
                style={{ fontFamily: preview.fontMono, color: preview.meta }}
              >
                09:30
              </span>
              <span className="brand__preview-item" style={{ color: preview.ink }}>
                Fushimi Inari, before the crowds
              </span>
            </div>
            <div className="brand__preview-row">
              <button
                type="button"
                className="brand__preview-btn"
                style={{ background: preview.accent, color: preview.btnInk }}
              >
                Add to this day
              </button>
              <span
                className="brand__preview-link"
                style={{ fontFamily: preview.fontMono, color: preview.accentInk }}
              >
                Decisions
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
