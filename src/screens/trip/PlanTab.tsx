import type { Theme } from "../../theme";
import { ItemCard, type Verdict } from "./ItemCard";
import { dayTotal, money, type Day } from "./trip-data";

const SKELETONS = ["132px", "196px", "150px"];
const CONFLICT_BG = "oklch(0.96 0.04 60)";
const CONFLICT_BORDER = "oklch(0.88 0.07 60)";
const CONFLICT_INK = "oklch(0.45 0.12 60)";

/** Pins are laid out on a fixed spiral of positions so a day of any length
 *  gets one per item, rather than the first five only. */
function pinPosition(i: number): { left: string; top: string } {
  const golden = 137.508 * i * (Math.PI / 180);
  const radius = 0.11 + 0.34 * Math.sqrt(i / 8);
  return {
    left: `${(0.5 + radius * Math.cos(golden)) * 100}%`,
    top: `${(0.5 + radius * 0.82 * Math.sin(golden)) * 100}%`,
  };
}

export function PlanTab({
  day,
  loading,
  resolved,
  canApprove,
  onResolve,
  onEdit,
  onAdd,
  highlightId,
  currency,
  theme,
}: {
  day: Day;
  loading: boolean;
  resolved: Record<string, Verdict>;
  canApprove: boolean;
  onResolve: (id: string, verdict: Verdict | undefined) => void;
  onEdit: (id: string) => void;
  onAdd: () => void;
  highlightId?: string;
  currency: string;
  theme: Theme;
}) {
  const live = day.items.filter((item) => resolved[item.id] !== "declined");
  /* Card numbers and map pins both count live items, so a declined item in
     the middle of the day does not leave a gap in the numbering. */
  const pinOf = new Map(live.map((item, i) => [item.id, i]));
  const chips = [
    { label: "Planned", value: `${live.length}` },
    { label: "First move", value: live[0]?.time ?? "—" },
    { label: "Each", value: money(dayTotal(day, resolved), currency) },
    { label: "On foot", value: day.walk },
  ];
  const notes = [day.conflict, ...(day.flags ?? [])].filter(Boolean) as string[];

  return (
    <div className="trip-page__stack">
      <div className="day-head">
        <div>
          <div className="day-head__date" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
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

      {notes.map((note) => (
        <div
          key={note}
          className="conflict"
          style={{ background: CONFLICT_BG, borderColor: CONFLICT_BORDER }}
        >
          <span
            className="conflict__label"
            style={{ fontFamily: theme.fontMono, color: CONFLICT_INK }}
          >
            Check this day
          </span>
          <span className="conflict__text">{note}</span>
        </div>
      ))}

      {loading ? (
        <div className="skeletons">
          {SKELETONS.map((height, i) => (
            <div key={i} className="skeleton" style={{ height }} />
          ))}
        </div>
      ) : day.items.length === 0 ? (
        <div className="empty-day" style={{ borderColor: theme.line, color: theme.body }}>
          <span
            className="empty-day__title"
            style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
          >
            Nothing planned yet
          </span>
          <span className="empty-day__note">
            A free day is a fine thing. Add the first plan when someone has an idea.
          </span>
          <button
            type="button"
            className="trip-page__reset add-sheet__more"
            onClick={onAdd}
            style={{ fontFamily: theme.fontMono, color: theme.accent }}
          >
            Add something +
          </button>
        </div>
      ) : (
        <div className="items">
          {day.items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              index={pinOf.get(item.id) ?? 0}
              verdict={resolved[item.id]}
              canApprove={canApprove}
              onResolve={(verdict) => onResolve(item.id, verdict)}
              onEdit={canApprove ? () => onEdit(item.id) : undefined}
              highlighted={item.id === highlightId}
              theme={theme}
            />
          ))}
        </div>
      )}

      {live.length > 0 && (
        <button
          type="button"
          className="trip-page__reset day-map"
          style={{ background: theme.card, borderColor: theme.line }}
        >
          <div className="day-map__canvas" style={{ background: theme.photoFill }}>
            {live.map((item, i) => (
              <span
                key={item.id}
                className="day-map__pin"
                style={{
                  ...pinPosition(i),
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
      )}
    </div>
  );
}
