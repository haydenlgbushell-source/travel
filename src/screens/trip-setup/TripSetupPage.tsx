import { useState } from "react";
import { THEMES, DEFAULT_THEME_KEY, getTheme } from "../../theme";
import { StyleCard } from "./StyleCard";
import { PhonePreview } from "./PhonePreview";
import "./trip-setup.css";

const SCOPE_RULES = [
  {
    label: "Changes",
    detail:
      "Colours, fonts, corner radius and the wording of small labels — countdowns, tags, button text.",
  },
  {
    label: "Stays the same",
    detail:
      "Every screen, every field, all bookings, ratings, money and permissions. A style is a skin, not a different product.",
  },
  {
    label: "Who sees it",
    detail:
      "Everyone on the trip, on desktop and on their phones. Nobody can override it for themselves.",
  },
];

export function TripSetupPage() {
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);
  const [editorsCanStyle, setEditorsCanStyle] = useState(false);
  const selected = getTheme(themeKey);

  return (
    <div className="trip-setup">
      <div className="trip-setup__main">
        <header className="trip-setup__header">
          <div className="trip-setup__header-left">
            <span className="trip-setup__brand">Meridian</span>
            <span className="wf-mono trip-setup__step">New trip · step 3 of 3</span>
          </div>
          <div className="trip-setup__header-right">
            <span className="wf-mono trip-setup__organiser">Organiser only</span>
            <span className="trip-setup__avatar">AN</span>
          </div>
        </header>

        <div className="trip-setup__content">
          <div className="trip-setup__intro">
            <h1 className="trip-setup__title">Pick a style for Lisbon</h1>
            <p className="trip-setup__lede">
              Style changes the palette, the type and the tone of labels across every
              screen the group sees. Nothing about the plan, the bookings or the money
              changes. You can switch it later from trip settings.
            </p>
          </div>

          <section className="trip-setup__section">
            <div className="trip-setup__section-head">
              <span className="wf-mono trip-setup__eyebrow">Trip style</span>
              <span className="wf-mono trip-setup__selected-name">
                {selected.name} selected
              </span>
            </div>

            <div className="style-grid">
              {THEMES.map((t) => (
                <StyleCard
                  key={t.key}
                  theme={t}
                  selected={t.key === themeKey}
                  onSelect={() => setThemeKey(t.key)}
                />
              ))}
            </div>
          </section>

          <section className="trip-setup__section">
            <span className="wf-mono trip-setup__eyebrow">How it applies</span>
            <div className="scope-panel">
              {SCOPE_RULES.map((rule) => (
                <div key={rule.label} className="scope-panel__row">
                  <span className="wf-mono scope-panel__label">{rule.label}</span>
                  <span className="scope-panel__detail">{rule.detail}</span>
                </div>
              ))}
              <label className="scope-panel__toggle" onClick={() => setEditorsCanStyle((v) => !v)}>
                <span
                  className="scope-panel__checkbox"
                  style={{
                    borderColor: editorsCanStyle ? "#14171A" : "#C9CAC3",
                    background: editorsCanStyle ? "#14171A" : "transparent",
                  }}
                >
                  {editorsCanStyle ? "✓" : ""}
                </span>
                <span className="scope-panel__toggle-label">
                  Let editors change the style too
                </span>
              </label>
            </div>
          </section>

          <div className="trip-setup__actions">
            <button type="button" className="trip-setup__btn trip-setup__btn--primary">
              Create trip and invite
            </button>
            <button type="button" className="trip-setup__btn trip-setup__btn--secondary">
              Back to dates
            </button>
            <span className="wf-mono trip-setup__actions-note">
              Everyone joins as a contributor
            </span>
          </div>
        </div>
      </div>

      <aside className="trip-setup__preview">
        <div className="trip-setup__preview-head">
          <span className="wf-mono trip-setup__preview-label">Live preview</span>
          <span className="wf-mono trip-setup__preview-label">What the group sees</span>
        </div>
        <PhonePreview theme={selected} />
      </aside>
    </div>
  );
}
