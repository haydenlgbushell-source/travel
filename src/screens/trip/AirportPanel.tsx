import type { Theme } from "../../theme";
import { EMERGENCY_NUMBER, STAY, type Day } from "./trip-data";

const REF_INK = "oklch(0.8 0.11 60)";

/** Everything needed at a gate with no signal: times, places and references,
 *  on one dark card that survives being screenshotted. */
export function AirportPanel({ day, theme }: { day: Day; theme: Theme }) {
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
        {day.items.map((item, i) => {
          const ref = item.booking?.find((b) => b.label === "Ref")?.value ?? "—";
          return (
            <div key={i} className="airport__row">
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

      <div className="airport__contacts" style={{ fontFamily: theme.fontMono }}>
        <span>Emergency {EMERGENCY_NUMBER}</span>
        <span>
          {STAY.name.split(",")[0]} {STAY.phone}
        </span>
      </div>
    </div>
  );
}
