import { useMemo, useState } from "react";
import type { Theme } from "../../theme";
import { Sheet } from "./Sheet";
import type { Day } from "./trip-data";

interface Hit {
  dayIndex: number;
  itemId: string;
  title: string;
  meta: string;
  note: string;
}

/** Finds an item by what it's actually called, not which day it's on — a
 *  longer trip's plan is a dozen days deep, and nothing else in the app lets
 *  you jump straight to "that restaurant Kit mentioned" without paging
 *  through every one of them first. Matches title, place and note, since a
 *  half-remembered detail is as likely to be in one of those as the name
 *  itself. */
export function SearchSheet({
  days,
  onJump,
  onClose,
  theme,
}: {
  days: Day[];
  onJump: (dayIndex: number, itemId: string) => void;
  onClose: () => void;
  theme: Theme;
}) {
  const [query, setQuery] = useState("");

  const hits = useMemo<Hit[]>(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    const found: Hit[] = [];
    days.forEach((day, dayIndex) => {
      day.items.forEach((item) => {
        const haystack = `${item.title} ${item.place} ${item.note}`.toLowerCase();
        if (haystack.includes(needle)) {
          found.push({
            dayIndex,
            itemId: item.id,
            title: item.title,
            meta: `${day.dow} ${day.num} · ${item.time}`,
            note: item.place !== "Not set" ? item.place : item.note,
          });
        }
      });
    });
    return found;
  }, [days, query]);

  return (
    <Sheet title="Search this trip" className="search-sheet" onClose={onClose} theme={theme}>
      <input
        className="add-sheet__input"
        type="search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="A place, a name, a note…"
        style={{
          fontFamily: theme.fontSans,
          background: theme.card,
          borderColor: theme.line,
          color: theme.ink,
        }}
      />

      {query.trim().length >= 2 && (
        <span
          className="add-sheet__hint"
          style={{ fontFamily: theme.fontMono, color: theme.meta }}
        >
          {hits.length === 0 ? "Nothing matches that" : `${hits.length} found`}
        </span>
      )}

      <div className="search-sheet__results">
        {hits.map((hit) => (
          <button
            key={hit.itemId}
            type="button"
            className="trip-page__reset inbox__item"
            onClick={() => onJump(hit.dayIndex, hit.itemId)}
            style={{ background: theme.card }}
          >
            <span className="inbox__title" style={{ color: theme.ink }}>
              {hit.title}
            </span>
            <span className="inbox__meta" style={{ fontFamily: theme.fontMono, color: theme.body }}>
              {hit.meta}
            </span>
            {hit.note && (
              <span className="inbox__note" style={{ color: theme.body }}>
                {hit.note}
              </span>
            )}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
