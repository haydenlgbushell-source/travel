import { useCallback, useEffect, useRef, useState } from "react";
import type { Theme } from "../../theme";
import type { ItemKind } from "../trip/trip-data";
import {
  deleteAgencyActivity,
  loadAgencyActivities,
  saveAgencyActivity,
  type AgencyActivity,
} from "./activity-data";

/** Travel legs are trip-specific — a journey has two ends and a flight
 *  number, neither of which generalises to a reusable library entry. */
const LIBRARY_KINDS: ItemKind[] = ["Eat", "Stay", "Do"];

const EMPTY_DRAFT = {
  country: "",
  city: "",
  kind: "Do" as ItemKind,
  title: "",
  place: "",
  note: "",
  costEach: "",
  photoUrl: "",
};

type Draft = typeof EMPTY_DRAFT;

export function ActivityLibraryPanel({
  agencyId,
  theme,
}: {
  agencyId: string;
  theme: Theme;
}) {
  const [activities, setActivities] = useState<AgencyActivity[]>();
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
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
      const list = await loadAgencyActivities(agencyId);
      if (alive.current) {
        setActivities(list);
        setError(undefined);
      }
    } catch {
      if (alive.current) {
        setActivities((prev) => prev ?? []);
        setError("Couldn't load the activity library.");
      }
    }
  }, [agencyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addActivity() {
    if (!draft.title.trim() || !draft.country.trim() || !draft.city.trim()) return;
    setSaving(true);
    try {
      await saveAgencyActivity({
        agencyId,
        country: draft.country,
        city: draft.city,
        kind: draft.kind,
        title: draft.title,
        place: draft.place || undefined,
        note: draft.note || undefined,
        costEach: draft.costEach.trim() ? Number(draft.costEach) : undefined,
        photoUrl: draft.photoUrl || undefined,
      });
      setDraft(EMPTY_DRAFT);
      setAdding(false);
      await load();
    } catch {
      if (alive.current) setError("Couldn't save that activity — check your connection and try again.");
    } finally {
      if (alive.current) setSaving(false);
    }
  }

  async function remove(id: string) {
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

  const q = query.trim().toLowerCase();
  const visible = (activities ?? []).filter((a) => {
    if (!q) return true;
    return (
      a.title.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q) ||
      (a.place ?? "").toLowerCase().includes(q)
    );
  });

  /* Country, then city, then the activities in each — a long flat list
     stops reading as a library the moment an agency has more than a
     handful of places saved. */
  const byCountry = new Map<string, Map<string, AgencyActivity[]>>();
  for (const a of visible) {
    const cities = byCountry.get(a.country) ?? new Map<string, AgencyActivity[]>();
    const items = cities.get(a.city) ?? [];
    items.push(a);
    cities.set(a.city, items);
    byCountry.set(a.country, cities);
  }

  const labelStyle = { fontFamily: theme.fontMono, color: theme.meta, fontSize: "11px" };
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
    <>
      {error && (
        <div className="empty-day" style={{ borderColor: theme.line, color: theme.body }}>
          <span className="empty-day__note">{error}</span>
          <button
            type="button"
            className="trip-page__reset trip-card__action"
            onClick={() => void load()}
            style={{ fontFamily: theme.fontMono, color: theme.accent }}
          >
            Try again
          </button>
        </div>
      )}

      <input
        style={fieldStyle}
        placeholder="Search saved activities"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {adding ? (
        <div className="wf-card wf-card--pad" style={{ background: theme.card, borderColor: theme.line, gap: "10px" }}>
          <span style={labelStyle}>Save an activity</span>

          <div style={{ display: "flex", gap: "8px" }}>
            {LIBRARY_KINDS.map((k) => {
              const on = draft.kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  className="trip-page__reset"
                  onClick={() => setDraft((d) => ({ ...d, kind: k }))}
                  style={{
                    fontFamily: theme.fontMono,
                    fontSize: "12px",
                    padding: "6px 12px",
                    borderRadius: theme.chipRadius,
                    border: `1px solid ${on ? theme.ink : theme.line}`,
                    background: on ? theme.ink : "transparent",
                    color: on ? theme.bg : theme.body,
                  }}
                >
                  {k}
                </button>
              );
            })}
          </div>

          <input
            style={fieldStyle}
            placeholder="Title — Fushimi Inari at dawn"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />

          <div style={{ display: "flex", gap: "8px" }}>
            <input
              style={fieldStyle}
              placeholder="Country"
              value={draft.country}
              onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))}
            />
            <input
              style={fieldStyle}
              placeholder="City"
              value={draft.city}
              onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
            />
          </div>

          <input
            style={fieldStyle}
            placeholder="Place or address (optional)"
            value={draft.place}
            onChange={(e) => setDraft((d) => ({ ...d, place: e.target.value }))}
          />

          <textarea
            style={{ ...fieldStyle, resize: "vertical" }}
            rows={2}
            placeholder="Notes for whoever adds this to a trip (optional)"
            value={draft.note}
            onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
          />

          <div style={{ display: "flex", gap: "8px" }}>
            <input
              style={fieldStyle}
              type="number"
              min="0"
              step="0.01"
              placeholder="Cost each, base currency (optional)"
              value={draft.costEach}
              onChange={(e) => setDraft((d) => ({ ...d, costEach: e.target.value }))}
            />
            <input
              style={fieldStyle}
              type="url"
              placeholder="Photo URL (optional)"
              value={draft.photoUrl}
              onChange={(e) => setDraft((d) => ({ ...d, photoUrl: e.target.value }))}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              type="button"
              className="trip-page__reset trip-page__add"
              disabled={saving || !draft.title.trim() || !draft.country.trim() || !draft.city.trim()}
              onClick={() => void addActivity()}
              style={{ color: theme.bg, background: theme.ink, borderColor: theme.ink, padding: "8px 16px" }}
            >
              {saving ? "Saving…" : "Save to library"}
            </button>
            <button
              type="button"
              className="trip-page__reset trip-card__action"
              onClick={() => {
                setAdding(false);
                setDraft(EMPTY_DRAFT);
              }}
              style={{ fontFamily: theme.fontMono, color: theme.body }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="trip-page__reset trip-page__add"
          onClick={() => setAdding(true)}
          style={{ color: theme.bg, background: theme.ink, borderColor: theme.ink }}
        >
          Save an activity
        </button>
      )}

      {!error && activities && visible.length === 0 && (
        <div className="empty-day" style={{ borderColor: theme.line, color: theme.body }}>
          <span className="empty-day__title" style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
            {activities.length === 0 ? "Nothing saved yet" : "Nothing matches"}
          </span>
          <span className="empty-day__note">
            {activities.length === 0
              ? "Save a place once and it's there to drop into any future client trip to the same city."
              : "Try a different search."}
          </span>
        </div>
      )}

      {[...byCountry.entries()].map(([country, cities]) => (
        <div key={country} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={{ fontFamily: theme.fontDisplay, fontSize: "18px", color: theme.ink }}>
            {country}
          </span>
          {[...cities.entries()].map(([city, items]) => (
            <div key={city} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={labelStyle}>{city}</span>
              {items.map((a) => (
                <div
                  key={a.id}
                  className="wf-card wf-card--pad"
                  style={{ background: theme.card, borderColor: theme.line, gap: "4px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>{a.title}</span>
                    <span style={{ fontFamily: theme.fontMono, color: theme.meta, fontSize: "12px" }}>
                      {a.kind}
                    </span>
                  </div>
                  {(a.place || a.note) && (
                    <span style={{ fontFamily: theme.fontMono, color: theme.body, fontSize: "12px" }}>
                      {[a.place, a.note].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  <button
                    type="button"
                    className="trip-page__reset trip-card__action"
                    disabled={busyId === a.id}
                    onClick={() => void remove(a.id)}
                    style={{
                      fontFamily: theme.fontMono,
                      color: theme.body,
                      fontSize: "12px",
                      alignSelf: "flex-start",
                    }}
                  >
                    {busyId === a.id ? "Removing…" : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
