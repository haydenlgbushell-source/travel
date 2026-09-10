import type { Theme } from "../../theme";
import type { Verdict } from "./ItemCard";
import { EMERGENCY_NUMBER, STAY, type Day } from "./trip-data";

const REF_INK = "oklch(0.8 0.11 60)";

/** Everything needed where there's no signal — a gate, or the hours of
 *  outback between Cobar and Broken Hill: times, places and references
 *  on one dark card that survives being screenshotted. */
export function OfflinePanel({
  day,
  resolved,
  isExample,
  theme,
}: {
  day: Day;
  /** Same filter the calendar export, the archive and the money totals apply.
   *  Without it this screen — the one you open at a gate — listed the
   *  restaurant the group turned down alongside the flight they're catching. */
  resolved: Record<string, Verdict>;
  isExample: boolean;
  theme: Theme;
}) {
  const live = day.items.filter((item) => {
    const verdict = resolved[item.id];
    if (verdict === "declined") return false;
    return !item.suggested || verdict === "approved";
  });
  return (
    <div className="offline" style={{ background: theme.headBg, color: theme.headInk }}>
      <div className="offline__head">
        <span className="offline__title" style={{ fontFamily: theme.fontDisplay }}>
          Offline mode
        </span>
        <span
          className="offline__sub"
          style={{ fontFamily: theme.fontMono, color: theme.headMeta }}
        >
          Saved for no signal · {day.label}
        </span>
      </div>

      <div className="offline__rows">
        {live.map((item) => {
          const ref = item.booking?.find((b) => b.label === "Ref")?.value ?? "—";
          return (
            <div key={item.id} className="offline__row">
              <span className="offline__time" style={{ fontFamily: theme.fontMono }}>
                {item.time}
              </span>
              <div className="offline__item">
                <span className="offline__item-title">{item.title}</span>
                <span className="offline__place" style={{ fontFamily: theme.fontMono }}>
                  {item.place}
                </span>
              </div>
              <span
                className="offline__ref"
                style={{ fontFamily: theme.fontMono, color: REF_INK }}
              >
                {ref}
              </span>
            </div>
          );
        })}
      </div>

      {/* The emergency number and hotel line belong to the example's US
          trip — the wrong emergency number is worse than none at all. */}
      {isExample && (
        <div className="offline__contacts" style={{ fontFamily: theme.fontMono }}>
          <a href={`tel:${EMERGENCY_NUMBER}`} className="offline__contact-link">
            Emergency {EMERGENCY_NUMBER}
          </a>
          <a href={`tel:${STAY.phone.replace(/[^+\d]/g, "")}`} className="offline__contact-link">
            {STAY.name.split(",")[0]} {STAY.phone}
          </a>
        </div>
      )}
    </div>
  );
}
