import type { Theme } from "../../theme";
import { ItemCard, type Verdict } from "./ItemCard";
import { PIN_POS, type Day } from "./trip-data";

const SKELETONS = ["132px", "196px", "150px"];
const CONFLICT_BG = "oklch(0.96 0.04 60)";
const CONFLICT_BORDER = "oklch(0.88 0.07 60)";
const CONFLICT_INK = "oklch(0.45 0.12 60)";

export function PlanTab({
  day,
  dayIndex,
  loading,
  resolved,
  canApprove,
  onResolve,
  theme,
}: {
  day: Day;
  dayIndex: number;
  loading: boolean;
  resolved: Record<string, Verdict>;
  canApprove: boolean;
  onResolve: (key: string, verdict: Verdict) => void;
  theme: Theme;
}) {
  const chips = [
    { label: "Planned", value: `${day.items.length}` },
    { label: "First move", value: day.items[0].time },
    { label: "Each", value: day.cost },
    { label: "On foot", value: day.walk },
  ];

  return (
    <div className="trip-page__stack">
      <div className="day-head">
        <div>
          <div
            className="day-head__date"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            {day.fullDate}
          </div>
          <div
            className="day-head__label"
            style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
          >
            {day.label}
          </div>
        </div>
        <span
          className="day-head__weather"
          style={{ fontFamily: theme.fontMono, color: theme.body }}
        >
          {day.weather}
        </span>
      </div>

      <div className="day-chips">
        {chips.map((chip) => (
          <span
            key={chip.label}
            className="day-chip"
            style={{ background: theme.card, borderColor: theme.line }}
          >
            <span
              className="day-chip__label"
              style={{ fontFamily: theme.fontMono, color: theme.meta }}
            >
              {chip.label}
            </span>
            <span
              className="day-chip__value"
              style={{ fontFamily: theme.fontMono, color: theme.ink }}
            >
              {chip.value}
            </span>
          </span>
        ))}
      </div>

      {day.conflict && (
        <div
          className="conflict"
          style={{ background: CONFLICT_BG, borderColor: CONFLICT_BORDER }}
        >
          <span
            className="conflict__label"
            style={{ fontFamily: theme.fontMono, color: CONFLICT_INK }}
          >
            Check this day
          </span>
          <span className="conflict__text">{day.conflict}</span>
        </div>
      )}

      {loading ? (
        <div className="skeletons">
          {SKELETONS.map((height, i) => (
            <div key={i} className="skeleton" style={{ height }} />
          ))}
        </div>
      ) : (
        <div className="items">
          {day.items.map((item, i) => {
            const key = `${dayIndex}-${i}`;
            return (
              <ItemCard
                key={key}
                item={item}
                index={i}
                verdict={resolved[key]}
                canApprove={canApprove}
                onResolve={(verdict) => onResolve(key, verdict)}
                theme={theme}
              />
            );
          })}
        </div>
      )}

      <button
        type="button"
        className="trip-page__reset day-map"
        style={{ background: theme.card, borderColor: theme.line }}
      >
        <div className="day-map__canvas" style={{ background: theme.photoFill }}>
          {day.items.slice(0, 5).map((item, i) => (
            <span
              key={i}
              className="day-map__pin"
              style={{
                left: PIN_POS[i][0],
                top: PIN_POS[i][1],
                fontFamily: theme.fontMono,
                background: item.accent,
                color: theme.btnInk,
                animationDelay: `${80 + i * 70}ms`,
              }}
            >
              {i + 1}
            </span>
          ))}
        </div>
        <div className="day-map__foot">
          <span
            className="day-map__area"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            Day map · {day.mapArea}
          </span>
          <span
            className="day-map__open"
            style={{ fontFamily: theme.fontMono, color: theme.accent }}
          >
            Open route ↗
          </span>
        </div>
      </button>
    </div>
  );
}
