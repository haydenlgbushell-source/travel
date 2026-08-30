import { useEffect, useState } from "react";
import type { Theme } from "../../theme";
import { Sheet } from "./Sheet";
import { loadAgencyActivities, type AgencyActivity } from "../agency/activity-data";

/** Reached from a day's "Add to this day" bar, only for a trip the current
 *  account's own agency owns — browses that agency's saved activity library
 *  and hands one back for `ItemSheet` to pre-fill, same as any other add. */
export function ActivityPickerSheet({
  agencyId,
  onPick,
  onClose,
  theme,
}: {
  agencyId: string;
  onPick: (activity: AgencyActivity) => void;
  onClose: () => void;
  theme: Theme;
}) {
  const [activities, setActivities] = useState<AgencyActivity[]>();
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadAgencyActivities(agencyId)
      .then((list) => {
        if (!cancelled) setActivities(list);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your agency's library.");
      });
    return () => {
      cancelled = true;
    };
  }, [agencyId]);

  const q = query.trim().toLowerCase();
  const visible = (activities ?? []).filter((a) => {
    if (!q) return true;
    return (
      a.title.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
    );
  });

  const byCountry = new Map<string, Map<string, AgencyActivity[]>>();
  for (const a of visible) {
    const cities = byCountry.get(a.country) ?? new Map<string, AgencyActivity[]>();
    cities.set(a.city, [...(cities.get(a.city) ?? []), a]);
    byCountry.set(a.country, cities);
  }

  const fieldStyle = {
    background: theme.card,
    borderColor: theme.line,
    color: theme.ink,
    fontFamily: theme.fontSans,
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: theme.pillRadius,
    padding: "8px 11px",
    fontSize: "14px",
    width: "100%",
  } as const;

  return (
    <Sheet title="From your library" onClose={onClose} theme={theme}>
      <div className="add-sheet__field">
        <input
          style={fieldStyle}
          placeholder="Search by name, city or country"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {error && (
        <span className="add-sheet__hint" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
          {error}
        </span>
      )}

      {!error && activities && visible.length === 0 && (
        <span className="add-sheet__hint" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
          {activities.length === 0
            ? "Nothing saved yet — add some from the agency Library tab."
            : "Nothing matches that search."}
        </span>
      )}

      {[...byCountry.entries()].map(([country, cities]) => (
        <div key={country} className="add-sheet__section">
          <span className="wf-card__eyebrow" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
            {country}
          </span>
          {[...cities.entries()].map(([city, items]) => (
            <div key={city} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span
                style={{ fontFamily: theme.fontMono, color: theme.meta, fontSize: "11px" }}
              >
                {city}
              </span>
              {items.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="trip-page__reset add-sheet__slot"
                  onClick={() => onPick(a)}
                  style={{
                    background: theme.card,
                    borderColor: theme.line,
                    color: theme.ink,
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <span className="add-sheet__slot-time" style={{ fontFamily: theme.fontDisplay }}>
                    {a.title}
                  </span>
                  <span className="add-sheet__slot-caption" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
                    {a.kind}
                    {a.place ? ` · ${a.place}` : ""}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </Sheet>
  );
}
