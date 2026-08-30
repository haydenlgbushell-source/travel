import { useCallback, useEffect, useRef, useState } from "react";
import type { Theme } from "../../theme";
import { ACCENT, AMBER, GREEN, type ItemKind } from "../trip/trip-data";
import {
  deleteAgencyActivity,
  deleteAgencyTemplate,
  loadAgencyActivities,
  loadAgencyTemplates,
  saveAgencyActivity,
  saveAgencyTemplate,
  type AgencyActivity,
  type AgencyActivityTemplate,
} from "./activity-data";
import "./library.css";

/** Travel legs are trip-specific — a journey has two ends and a flight
 *  number, neither of which generalises to a reusable library entry. */
const LIBRARY_KINDS: ItemKind[] = ["Eat", "Stay", "Do"];

const KIND_COLOR: Record<ItemKind, string> = { Eat: AMBER, Stay: ACCENT, Do: GREEN, Travel: ACCENT };

function KindBadge({ kind }: { kind: ItemKind }) {
  const color = KIND_COLOR[kind];
  return (
    <span
      className="library__badge"
      style={{ background: `color-mix(in oklch, ${color} 16%, white)`, color }}
    >
      <span className="library__badge-dot" style={{ background: color }} />
      {kind}
    </span>
  );
}

const EMPTY_ACTIVITY_DRAFT = {
  country: "",
  city: "",
  kind: "Do" as ItemKind,
  title: "",
  place: "",
  note: "",
  costEach: "",
  photoUrl: "",
};

type ActivityDraft = typeof EMPTY_ACTIVITY_DRAFT;

const EMPTY_TEMPLATE_DRAFT = { country: "", city: "", name: "", activityIds: [] as string[] };
type TemplateDraft = typeof EMPTY_TEMPLATE_DRAFT;

type View = "activities" | "templates";

/** Groups a flat list by country then city, in whatever order the caller's
 *  own sort already produced — used for both activities and templates so
 *  the two views read as the same shape of place. */
function groupByPlace<T extends { country: string; city: string }>(
  items: T[],
): Map<string, Map<string, T[]>> {
  const byCountry = new Map<string, Map<string, T[]>>();
  for (const item of items) {
    const cities = byCountry.get(item.country) ?? new Map<string, T[]>();
    cities.set(item.city, [...(cities.get(item.city) ?? []), item]);
    byCountry.set(item.country, cities);
  }
  return byCountry;
}

export function ActivityLibraryPanel({
  agencyId,
  theme,
}: {
  agencyId: string;
  theme: Theme;
}) {
  const [view, setView] = useState<View>("activities");
  const [activities, setActivities] = useState<AgencyActivity[]>();
  const [templates, setTemplates] = useState<AgencyActivityTemplate[]>();
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");

  const [addingActivity, setAddingActivity] = useState(false);
  const [activityDraft, setActivityDraft] = useState<ActivityDraft>(EMPTY_ACTIVITY_DRAFT);
  const [savingActivity, setSavingActivity] = useState(false);

  const [addingTemplate, setAddingTemplate] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft>(EMPTY_TEMPLATE_DRAFT);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [busyId, setBusyId] = useState<string>();

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const [a, t] = await Promise.all([loadAgencyActivities(agencyId), loadAgencyTemplates(agencyId)]);
      if (alive.current) {
        setActivities(a);
        setTemplates(t);
        setError(undefined);
      }
    } catch {
      if (alive.current) {
        setActivities((prev) => prev ?? []);
        setTemplates((prev) => prev ?? []);
        setError("Couldn't load the activity library.");
      }
    }
  }, [agencyId]);

  useEffect(() => {
    void load();
  }, [load]);

  /* Typing "Japan" once and having it suggest itself next time keeps a
     library from splintering into "Japan" / "japan" / "JP" as more people
     add to it. */
  const knownCountries = [...new Set((activities ?? []).map((a) => a.country))].sort();
  const knownCities = [...new Set((activities ?? []).map((a) => a.city))].sort();

  async function addActivity() {
    if (!activityDraft.title.trim() || !activityDraft.country.trim() || !activityDraft.city.trim()) return;
    setSavingActivity(true);
    try {
      await saveAgencyActivity({
        agencyId,
        country: activityDraft.country,
        city: activityDraft.city,
        kind: activityDraft.kind,
        title: activityDraft.title,
        place: activityDraft.place || undefined,
        note: activityDraft.note || undefined,
        costEach: activityDraft.costEach.trim() ? Number(activityDraft.costEach) : undefined,
        photoUrl: activityDraft.photoUrl || undefined,
      });
      setActivityDraft(EMPTY_ACTIVITY_DRAFT);
      setAddingActivity(false);
      await load();
    } catch {
      if (alive.current) setError("Couldn't save that activity — check your connection and try again.");
    } finally {
      if (alive.current) setSavingActivity(false);
    }
  }

  async function removeActivity(id: string) {
    setBusyId(id);
    try {
      await deleteAgencyActivity(id);
      await load();
    } catch {
      if (alive.current) setError("Couldn't remove that — check your connection and try again.");
    } finally {
      if (alive.current) setBusyId(undefined);
    }
  }

  async function addTemplate() {
    if (!templateDraft.name.trim() || !templateDraft.country.trim() || !templateDraft.city.trim()) return;
    if (templateDraft.activityIds.length === 0) return;
    setSavingTemplate(true);
    try {
      await saveAgencyTemplate({
        agencyId,
        country: templateDraft.country,
        city: templateDraft.city,
        name: templateDraft.name,
        activityIds: templateDraft.activityIds,
      });
      setTemplateDraft(EMPTY_TEMPLATE_DRAFT);
      setAddingTemplate(false);
      await load();
    } catch {
      if (alive.current) setError("Couldn't save that template — check your connection and try again.");
    } finally {
      if (alive.current) setSavingTemplate(false);
    }
  }

  async function removeTemplate(id: string) {
    setBusyId(id);
    try {
      await deleteAgencyTemplate(id);
      await load();
    } catch {
      if (alive.current) setError("Couldn't remove that — check your connection and try again.");
    } finally {
      if (alive.current) setBusyId(undefined);
    }
  }

  const q = query.trim().toLowerCase();
  const visibleActivities = (activities ?? []).filter((a) => {
    if (!q) return true;
    return (
      a.title.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q) ||
      (a.place ?? "").toLowerCase().includes(q)
    );
  });
  const visibleTemplates = (templates ?? []).filter((t) => {
    if (!q) return true;
    return t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q) || t.country.toLowerCase().includes(q);
  });

  const activitiesByPlace = groupByPlace(visibleActivities);
  const templatesByPlace = groupByPlace(visibleTemplates);
  const activityById = new Map((activities ?? []).map((a) => [a.id, a]));

  /* Only activities already saved for the template's own country/city are
     offered — a template is a shortcut for one place, not a cross-country
     grab bag. */
  const eligibleForTemplate = (activities ?? []).filter(
    (a) =>
      a.country.trim().toLowerCase() === templateDraft.country.trim().toLowerCase() &&
      a.city.trim().toLowerCase() === templateDraft.city.trim().toLowerCase(),
  );

  function toggleTemplateActivity(id: string) {
    setTemplateDraft((d) => ({
      ...d,
      activityIds: d.activityIds.includes(id)
        ? d.activityIds.filter((x) => x !== id)
        : [...d.activityIds, id],
    }));
  }

  return (
    <div className="library">
      {error && (
        <div className="library__notice">
          <span>{error}</span>
          <button type="button" className="library__btn--text" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}

      <div className="library__toolbar">
        <div className="library__switch" role="tablist" aria-label="Library view">
          <button
            type="button"
            role="tab"
            aria-selected={view === "activities"}
            className={`library__switch-btn${view === "activities" ? " library__switch-btn--on" : ""}`}
            onClick={() => setView("activities")}
          >
            Activities
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "templates"}
            className={`library__switch-btn${view === "templates" ? " library__switch-btn--on" : ""}`}
            onClick={() => setView("templates")}
          >
            Templates
          </button>
        </div>

        <input
          className="library__search"
          placeholder={view === "activities" ? "Search saved activities" : "Search templates"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {view === "activities" ? (
          <button
            type="button"
            className="library__add-btn"
            onClick={() => setAddingActivity((v) => !v)}
          >
            {addingActivity ? "Close" : "+ Save an activity"}
          </button>
        ) : (
          <button
            type="button"
            className="library__add-btn"
            onClick={() => setAddingTemplate((v) => !v)}
          >
            {addingTemplate ? "Close" : "+ Create template"}
          </button>
        )}
      </div>

      {view === "activities" && addingActivity && (
        <div className="library__form">
          <span className="library__form-title">Save an activity</span>

          <div className="library__kind-picker">
            {LIBRARY_KINDS.map((k) => {
              const on = activityDraft.kind === k;
              const color = KIND_COLOR[k];
              return (
                <button
                  key={k}
                  type="button"
                  className="library__kind-btn"
                  onClick={() => setActivityDraft((d) => ({ ...d, kind: k }))}
                  style={
                    on
                      ? { background: `color-mix(in oklch, ${color} 16%, white)`, borderColor: color, color }
                      : undefined
                  }
                >
                  <span className="library__kind-dot" style={{ background: color }} />
                  {k}
                </button>
              );
            })}
          </div>

          <div className="library__field">
            <span className="library__label">Title</span>
            <input
              className="library__input"
              placeholder="Fushimi Inari at dawn"
              value={activityDraft.title}
              onChange={(e) => setActivityDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </div>

          <div className="library__form-row">
            <div className="library__field">
              <span className="library__label">Country</span>
              <input
                className="library__input"
                list="library-countries"
                placeholder="Japan"
                value={activityDraft.country}
                onChange={(e) => setActivityDraft((d) => ({ ...d, country: e.target.value }))}
              />
            </div>
            <div className="library__field">
              <span className="library__label">City</span>
              <input
                className="library__input"
                list="library-cities"
                placeholder="Kyoto"
                value={activityDraft.city}
                onChange={(e) => setActivityDraft((d) => ({ ...d, city: e.target.value }))}
              />
            </div>
          </div>
          <datalist id="library-countries">
            {knownCountries.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <datalist id="library-cities">
            {knownCities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <div className="library__field">
            <span className="library__label">Place or address</span>
            <input
              className="library__input"
              placeholder="Optional"
              value={activityDraft.place}
              onChange={(e) => setActivityDraft((d) => ({ ...d, place: e.target.value }))}
            />
          </div>

          <div className="library__field">
            <span className="library__label">Notes for whoever adds this to a trip</span>
            <textarea
              className="library__input"
              rows={2}
              placeholder="Optional"
              value={activityDraft.note}
              onChange={(e) => setActivityDraft((d) => ({ ...d, note: e.target.value }))}
            />
          </div>

          <div className="library__form-row">
            <div className="library__field">
              <span className="library__label">Cost each</span>
              <input
                className="library__input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Optional"
                value={activityDraft.costEach}
                onChange={(e) => setActivityDraft((d) => ({ ...d, costEach: e.target.value }))}
              />
            </div>
            <div className="library__field">
              <span className="library__label">Photo URL</span>
              <input
                className="library__input"
                type="url"
                placeholder="Optional"
                value={activityDraft.photoUrl}
                onChange={(e) => setActivityDraft((d) => ({ ...d, photoUrl: e.target.value }))}
              />
            </div>
          </div>

          <div className="library__form-actions">
            <button
              type="button"
              className="library__btn library__btn--primary"
              disabled={
                savingActivity ||
                !activityDraft.title.trim() ||
                !activityDraft.country.trim() ||
                !activityDraft.city.trim()
              }
              onClick={() => void addActivity()}
            >
              {savingActivity ? "Saving…" : "Save to library"}
            </button>
            <button
              type="button"
              className="library__btn--text"
              onClick={() => {
                setAddingActivity(false);
                setActivityDraft(EMPTY_ACTIVITY_DRAFT);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {view === "templates" && addingTemplate && (
        <div className="library__form">
          <span className="library__form-title">Create a template</span>

          <div className="library__field">
            <span className="library__label">Template name</span>
            <input
              className="library__input"
              placeholder="Kyoto Highlights"
              value={templateDraft.name}
              onChange={(e) => setTemplateDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </div>

          <div className="library__form-row">
            <div className="library__field">
              <span className="library__label">Country</span>
              <input
                className="library__input"
                list="library-countries"
                placeholder="Japan"
                value={templateDraft.country}
                onChange={(e) =>
                  setTemplateDraft((d) => ({ ...d, country: e.target.value, activityIds: [] }))
                }
              />
            </div>
            <div className="library__field">
              <span className="library__label">City</span>
              <input
                className="library__input"
                list="library-cities"
                placeholder="Kyoto"
                value={templateDraft.city}
                onChange={(e) =>
                  setTemplateDraft((d) => ({ ...d, city: e.target.value, activityIds: [] }))
                }
              />
            </div>
          </div>
          <datalist id="library-countries">
            {knownCountries.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <datalist id="library-cities">
            {knownCities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          {templateDraft.country.trim() && templateDraft.city.trim() && (
            <div className="library__field">
              <span className="library__label">
                Include ({templateDraft.activityIds.length} selected)
              </span>
              {eligibleForTemplate.length === 0 ? (
                <span
                  style={{ fontFamily: theme.fontMono, fontSize: "12px", color: theme.meta }}
                >
                  No saved activities for {templateDraft.city} yet — save some in the Activities
                  tab first.
                </span>
              ) : (
                <div className="library__check-grid">
                  {eligibleForTemplate.map((a) => (
                    <label key={a.id} className="library__check">
                      <input
                        type="checkbox"
                        checked={templateDraft.activityIds.includes(a.id)}
                        onChange={() => toggleTemplateActivity(a.id)}
                      />
                      <span>
                        <span className="library__check-title">{a.title}</span>
                        <span className="library__check-meta">{a.kind}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="library__form-actions">
            <button
              type="button"
              className="library__btn library__btn--primary"
              disabled={
                savingTemplate ||
                !templateDraft.name.trim() ||
                !templateDraft.country.trim() ||
                !templateDraft.city.trim() ||
                templateDraft.activityIds.length === 0
              }
              onClick={() => void addTemplate()}
            >
              {savingTemplate ? "Saving…" : "Save template"}
            </button>
            <button
              type="button"
              className="library__btn--text"
              onClick={() => {
                setAddingTemplate(false);
                setTemplateDraft(EMPTY_TEMPLATE_DRAFT);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {view === "activities" && !error && activities && visibleActivities.length === 0 && (
        <div className="library__empty">
          <span className="library__empty-title">
            {activities.length === 0 ? "Nothing saved yet" : "Nothing matches"}
          </span>
          <span className="library__empty-note">
            {activities.length === 0
              ? "Save a place once and it's there to drop into any future client trip to the same city."
              : "Try a different search."}
          </span>
        </div>
      )}

      {view === "activities" &&
        [...activitiesByPlace.entries()].map(([country, cities]) => {
          const count = [...cities.values()].reduce((n, list) => n + list.length, 0);
          return (
            <div key={country} className="library__group">
              <div className="library__country">
                <span className="library__country-name">{country}</span>
                <span className="library__country-count">
                  {count} {count === 1 ? "activity" : "activities"}
                </span>
              </div>
              {[...cities.entries()].map(([city, items]) => (
                <div key={city} className="library__city">
                  <span className="library__city-name">{city}</span>
                  <div className="library__cards">
                    {items.map((a) => (
                      <div key={a.id} className="library__card">
                        <div className="library__card-top">
                          {a.photoUrl && <img className="library__thumb" src={a.photoUrl} alt="" />}
                          <div className="library__card-body">
                            <span className="library__card-title">{a.title}</span>
                            {(a.place || a.costEach !== undefined) && (
                              <span className="library__card-meta">
                                {[a.place, a.costEach !== undefined ? `€${a.costEach} each` : undefined]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            )}
                          </div>
                          <KindBadge kind={a.kind} />
                        </div>
                        {a.note && <span className="library__card-meta">{a.note}</span>}
                        <div className="library__card-actions">
                          <button
                            type="button"
                            className="library__card-action library__card-action--danger"
                            disabled={busyId === a.id}
                            onClick={() => void removeActivity(a.id)}
                          >
                            {busyId === a.id ? "Removing…" : "Remove"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

      {view === "templates" && !error && templates && visibleTemplates.length === 0 && (
        <div className="library__empty">
          <span className="library__empty-title">
            {templates.length === 0 ? "No templates yet" : "Nothing matches"}
          </span>
          <span className="library__empty-note">
            {templates.length === 0
              ? "Bundle a city's saved activities into a template once, then apply the whole thing to a trip in one go."
              : "Try a different search."}
          </span>
        </div>
      )}

      {view === "templates" &&
        [...templatesByPlace.entries()].map(([country, cities]) => (
          <div key={country} className="library__group">
            <div className="library__country">
              <span className="library__country-name">{country}</span>
            </div>
            {[...cities.entries()].map(([city, items]) => (
              <div key={city} className="library__city">
                <span className="library__city-name">{city}</span>
                <div className="library__cards">
                  {items.map((t) => {
                    const included = t.activityIds
                      .map((id) => activityById.get(id))
                      .filter((a): a is AgencyActivity => a !== undefined);
                    return (
                      <div key={t.id} className="library__card">
                        <div className="library__card-top">
                          <div className="library__card-body">
                            <span className="library__card-title">{t.name}</span>
                            <span className="library__card-meta">
                              {included.length} {included.length === 1 ? "activity" : "activities"}
                            </span>
                          </div>
                        </div>
                        {included.length > 0 && (
                          <div className="library__card-chips">
                            {included.map((a) => (
                              <span key={a.id} className="library__card-chip">
                                {a.title}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="library__card-actions">
                          <button
                            type="button"
                            className="library__card-action library__card-action--danger"
                            disabled={busyId === t.id}
                            onClick={() => void removeTemplate(t.id)}
                          >
                            {busyId === t.id ? "Removing…" : "Remove"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
