import type { Theme } from "../../theme";

export function StyleCard({
  theme,
  selected,
  onSelect,
  eventName,
}: {
  theme: Theme;
  selected: boolean;
  onSelect: () => void;
  eventName: string;
}) {
  return (
    <button
      type="button"
      className="style-card"
      onClick={onSelect}
      style={{
        borderColor: selected ? "#14171A" : "#E4E4DD",
        boxShadow: selected ? "0 10px 26px -18px rgba(20,23,26,.45)" : "none",
      }}
    >
      <div className="style-card__head">
        <div className="style-card__head-text">
          <span className="style-card__name">{theme.name}</span>
          <span className="wf-mono style-card__type-note">{theme.typeNote}</span>
        </div>
        <span
          className="style-card__dot"
          style={{
            borderColor: selected ? "#14171A" : "#C9CAC3",
            background: selected ? "#14171A" : "transparent",
          }}
        >
          {selected ? "✓" : ""}
        </span>
      </div>

      <div className="style-card__mini" style={{ borderRadius: 12 }}>
        <div className="style-card__mini-head" style={{ background: theme.headBg }}>
          <div>
            <div
              className="wf-mono style-card__mini-meta"
              style={{ fontFamily: theme.fontMono, color: theme.headMeta }}
            >
              {theme.countdown}
            </div>
            <div
              className="style-card__mini-city"
              style={{ fontFamily: theme.fontDisplay, color: theme.headInk }}
            >
              {eventName}
            </div>
          </div>
          <span
            className="wf-mono style-card__mini-wordmark"
            style={{ fontFamily: theme.fontMono, color: theme.headMeta }}
          >
            {theme.wordmark}
          </span>
        </div>

        <div className="style-card__mini-body" style={{ background: theme.bg }}>
          <div
            className="style-card__mini-item"
            style={{
              background: theme.card,
              borderColor: theme.line,
              borderRadius: theme.cardRadius,
            }}
          >
            <div className="style-card__mini-item-row">
              <span
                className="wf-mono"
                style={{ fontFamily: theme.fontMono, color: theme.ink, fontSize: 10.5 }}
              >
                19:30
              </span>
              <span
                className="style-card__mini-item-name"
                style={{ fontFamily: theme.fontSans, color: theme.ink }}
              >
                Lou Malnati's Pizzeria
              </span>
              <span
                className="wf-mono wf-pill-tag"
                style={{
                  fontFamily: theme.fontMono,
                  color: theme.tagInk,
                  background: theme.tagBg,
                  borderRadius: theme.pillRadius,
                  fontSize: 8,
                }}
              >
                {theme.tag}
              </span>
            </div>
            <span
              className="wf-mono style-card__mini-booking"
              style={{ fontFamily: theme.fontMono, color: theme.accentInk }}
            >
              {theme.bookingLabel} · party 5
            </span>
          </div>

          <div className="style-card__mini-actions">
            <span
              className="style-card__mini-cta"
              style={{
                fontFamily: theme.fontSans,
                color: theme.btnInk,
                background: theme.accent,
                borderRadius: theme.pillRadius,
              }}
            >
              {theme.cta}
            </span>
            {theme.swatches.map((color, i) => (
              <span key={i} className="style-card__swatch" style={{ background: color }} />
            ))}
          </div>
        </div>
      </div>

      <span className="style-card__blurb">{theme.blurb}</span>
    </button>
  );
}
