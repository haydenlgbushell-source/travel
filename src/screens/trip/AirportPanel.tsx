import type { Theme } from "../../theme";
import type { Verdict } from "./ItemCard";
import { EMERGENCY_NUMBER, STAY, type Day } from "./trip-data";

const REF_INK = "oklch(0.8 0.11 60)";

/** Everything needed at a gate with no signal: times, places and references,
 *  on one dark card that survives being screenshotted. */
export function AirportPanel({
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
    <div className="airport" style={{ background: theme.headBg, color: theme.headInk }}>
      <div className="airport__head">
        <span className="airport__title" style={{ fontFamily: theme.fontDisplay }}>
          Airport mode
        </span>
        <span
          className="airport__sub"
          style={{ fontFamily: theme.fontMono, color: theme.headMeta }}
        >
          Saved offline · {day.label}
        </span>
      </div>

      <div className="airport__rows">
        {live.map((item) => {
          const ref = item.booking?.find((b) => b.label === "Ref")?.value ?? "—";
          return (
            <div key={item.id} className="airport__row">
              <span className="airport__time" style={{ fontFamily: theme.fontMono }}>
                {item.time}
              </span>
              <div className="airport__item">
                <span className="airport__item-title">{item.title}</span>
                <span className="airport__place" style={{ fontFamily: theme.fontMono }}>
                  {item.place}
                </span>
              </div>
              <span
                className="airport__ref"
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
        <div className="airport__contacts" style={{ fontFamily: theme.fontMono }}>
          <a href={`tel:${EMERGENCY_NUMBER}`} className="airport__contact-link">
            Emergency {EMERGENCY_NUMBER}
          </a>
          <a href={`tel:${STAY.phone.replace(/[^+\d]/g, "")}`} className="airport__contact-link">
            {STAY.name.split(",")[0]} {STAY.phone}
          </a>
        </div>
      )}
    </div>
  );
}
