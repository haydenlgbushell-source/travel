import type { Theme } from "../../theme";
import { INFO } from "./trip-data";

export function InfoTab({ theme }: { theme: Theme }) {
  return (
    <div className="trip-page__stack trip-page__stack--tight trip-page__tab-panel">
      {INFO.map((entry) => (
        <div
          key={entry.label}
          className="info-card"
          style={{ background: theme.card, borderColor: theme.line }}
        >
          <div
            className="wf-card__eyebrow"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            {entry.label}
          </div>
          <div
            className="info-card__value"
            style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
          >
            {entry.value}
          </div>
          <div className="info-card__note" style={{ color: theme.body }}>
            {entry.note}
          </div>
        </div>
      ))}
    </div>
  );
}
