import { useEffect, useState } from "react";
import type { Theme } from "../../theme";
import { Sheet } from "./Sheet";
import {
  loadAgencyActivities,
  loadAgencyTemplates,
  type AgencyActivity,
  type AgencyActivityTemplate,
} from "../agency/activity-data";
import { ACCENT, AMBER, GREEN, type ItemKind } from "./trip-data";
import "../agency/library.css";

const KIND_COLOR: Record<ItemKind, string> = { Eat: AMBER, Stay: ACCENT, Do: GREEN, Travel: ACCENT };

type View = "activities" | "templates";

/** Reached from a day's "Add to this day" bar, only for a trip the current
 *  account's own agency owns — browses that agency's saved activity library
 *  and either hands one activity back for `ItemSheet` to pre-fill, same as
 *  any other add, or applies a whole template's activities to the day at
 *  once. */
export function ActivityPickerSheet({
  agencyId,
  onPick,
  onApplyTemplate,
  onClose,
  theme,
}: {
  agencyId: string;
  onPick: (activity: AgencyActivity) => void;
  onApplyTemplate: (activities: AgencyActivity[]) => void;
  onClose: () => void;
  theme: Theme;
}) {
  const [view, setView] = useState<View>("activities");
  const [activities, setActivities] = useState<AgencyActivity[]>();
  const [templates, setTemplates] = useState<AgencyActivityTemplate[]>();
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadAgencyActivities(agencyId), loadAgencyTemplates(agencyId)])
      .then(([a, t]) => {
        if (!cancelled) {
          setActivities(a);
          setTemplates(t);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your agency's library.");
      });
    return () => {
      cancelled = true;
    };
  }, [agencyId]);

  const activityById = new Map((activities ?? []).map((a) => [a.id, a]));
  const q = query.trim().toLowerCase();

  const visibleActivities = (activities ?? []).filter((a) => {
    if (!q) return true;
    return (
      a.title.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || a.country.toLowerCase().includes(q)
    );
  });
  const visibleTemplates = (templates ?? []).filter((t) => {
    if (!q) return true;
    return t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q) || t.country.toLowerCase().includes(q);
  });

  function groupByPlace<T extends { country: string; city: string }>(items: T[]) {
    const byCountry = new Map<string, Map<string, T[]>>();
    for (const item of items) {
      const cities = byCountry.get(item.country) ?? new Map<string, T[]>();
      cities.set(item.city, [...(cities.get(item.city) ?? []), item]);
      byCountry.set(item.country, cities);
    }
    return byCountry;
  }

  const activitiesByPlace = groupByPlace(visibleActivities);
  const templatesByPlace = groupByPlace(visibleTemplates);

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
      <div className="add-sheet__field" style={{ display: "flex", gap: "8px" }}>
        <div className="library__switch">
          <button
            type="button"
            className={`library__switch-btn${view === "activities" ? " library__switch-btn--on" : ""}`}
            onClick={() => setView("activities")}
          >
            Activities
          </button>
          <button
            type="button"
            className={`library__switch-btn${view === "templates" ? " library__switch-btn--on" : ""}`}
            onClick={() => setView("templates")}
          >
            Templates
          </button>
        </div>
      </div>

      <div className="add-sheet__field">
        <input
          style={fieldStyle}
          placeholder={view === "activities" ? "Search by name, city or country" : "Search templates"}
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

      {view === "activities" && !error && activities && visibleActivities.length === 0 && (
        <span className="add-sheet__hint" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
          {activities.length === 0
            ? "Nothing saved yet — add some from the agency Library tab."
            : "Nothing matches that search."}
        </span>
      )}

      {view === "activities" &&
        [...activitiesByPlace.entries()].map(([country, cities]) => (
          <div key={country} className="add-sheet__section">
            <span className="wf-card__eyebrow" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
              {country}
            </span>
            {[...cities.entries()].map(([city, items]) => (
              <div key={city} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontFamily: theme.fontMono, color: theme.meta, fontSize: "11px" }}>{city}</span>
                {items.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="trip-page__reset add-sheet__slot"
                    onClick={() => onPick(a)}
                    style={{ background: theme.card, borderColor: theme.line, color: theme.ink, textAlign: "left", width: "100%" }}
                  >
                    <span className="add-sheet__slot-time" style={{ fontFamily: theme.fontDisplay }}>
                      {a.title}
                    </span>
                    <span
                      className="add-sheet__slot-caption"
                      style={{ fontFamily: theme.fontMono, color: KIND_COLOR[a.kind] }}
                    >
                      {a.kind}
                      {a.place ? ` · ${a.place}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ))}

      {view === "templates" && !error && templates && visibleTemplates.length === 0 && (
        <span className="add-sheet__hint" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
          {templates.length === 0
            ? "No templates yet — bundle some saved activities together from the agency Library tab."
            : "Nothing matches that search."}
        </span>
      )}

      {view === "templates" &&
        [...templatesByPlace.entries()].map(([country, cities]) => (
          <div key={country} className="add-sheet__section">
            <span className="wf-card__eyebrow" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
              {country}
            </span>
            {[...cities.entries()].map(([city, items]) => (
              <div key={city} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontFamily: theme.fontMono, color: theme.meta, fontSize: "11px" }}>{city}</span>
                {items.map((t) => {
                  const included = t.activityIds
                    .map((id) => activityById.get(id))
                    .filter((a): a is AgencyActivity => a !== undefined);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className="trip-page__reset add-sheet__slot"
                      disabled={included.length === 0}
                      onClick={() => onApplyTemplate(included)}
                      style={{ background: theme.card, borderColor: theme.line, color: theme.ink, textAlign: "left", width: "100%" }}
                    >
                      <span className="add-sheet__slot-time" style={{ fontFamily: theme.fontDisplay }}>
                        {t.name}
                      </span>
                      <span className="add-sheet__slot-caption" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
                        {included.length} {included.length === 1 ? "activity" : "activities"} · adds to today
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
    </Sheet>
  );
}
