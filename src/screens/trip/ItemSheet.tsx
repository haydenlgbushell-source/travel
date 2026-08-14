import { useId, useState } from "react";
import type { Theme } from "../../theme";
import { Sheet } from "./Sheet";
import {
  ITEM_KINDS,
  clashAt,
  draftFrom,
  suggestSlots,
  type Day,
  type DraftItem,
  type TripItem,
} from "./trip-data";

const WARN_INK = "oklch(0.52 0.13 60)";
const WARN_BG = "oklch(0.96 0.04 60)";
const WARN_LINE = "oklch(0.88 0.07 60)";
const DANGER_INK = "oklch(0.5 0.13 30)";

const EMPTY: DraftItem = {
  kind: "Do",
  title: "",
  time: "",
  place: "",
  note: "",
  booked: false,
  costEach: "",
};

/** Two required answers — what and when — and everything else optional. A
 *  longer form is a form people abandon on a phone. The same sheet edits an
 *  existing item, keeping every field it does not ask about. */
export function ItemSheet({
  day,
  editing,
  canApprove,
  onSave,
  onDelete,
  onClose,
  theme,
}: {
  day: Day;
  editing?: TripItem;
  canApprove: boolean;
  onSave: (draft: DraftItem) => void;
  onDelete?: () => void;
  onClose: () => void;
  theme: Theme;
}) {
  const [draft, setDraft] = useState<DraftItem>(editing ? draftFrom(editing) : EMPTY);
  const [detailOpen, setDetailOpen] = useState(editing !== undefined);
  const ids = {
    title: useId(),
    time: useId(),
    place: useId(),
    note: useId(),
    cost: useId(),
  };

  const set = <K extends keyof DraftItem>(key: K, value: DraftItem[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const slots = suggestSlots(day.items.filter((i) => i.id !== editing?.id));
  const clash = draft.time ? clashAt(draft.time, day.items, editing?.id) : undefined;
  const ready = draft.title.trim().length > 0 && draft.time.length > 0;

  const fieldStyle = {
    fontFamily: theme.fontSans,
    background: theme.card,
    borderColor: theme.line,
    color: theme.ink,
  };
  const labelStyle = { fontFamily: theme.fontMono, color: theme.meta };

  return (
    <Sheet
      title={editing ? "Edit item" : `Add to ${day.fullDate.split(" ")[0]}`}
      className="add-sheet"
      onClose={onClose}
      theme={theme}
    >
      <div className="add-sheet__field">
        <label htmlFor={ids.title} className="wf-card__eyebrow" style={labelStyle}>
          What is it?
        </label>
        <input
          id={ids.title}
          className="add-sheet__input add-sheet__input--title"
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Rooftop drinks"
          autoFocus
          style={fieldStyle}
        />
      </div>

      <div className="add-sheet__section">
        <span className="wf-card__eyebrow" style={labelStyle}>
          What kind
        </span>
        <div className="kind-picker">
          {ITEM_KINDS.map((kind) => {
            const on = kind === draft.kind;
            return (
              <button
                key={kind}
                type="button"
                aria-pressed={on}
                className="trip-page__reset kind-picker__option"
                onClick={() => set("kind", kind)}
                style={{
                  background: on ? theme.ink : theme.card,
                  borderColor: on ? theme.ink : theme.line,
                  color: on ? theme.bg : theme.body,
                }}
              >
                {kind}
              </button>
            );
          })}
        </div>
      </div>

      <div className="add-sheet__section">
        <span className="wf-card__eyebrow" style={labelStyle}>
          When
        </span>
        <div className="add-sheet__slots">
          {slots.map((slot) => {
            const on = slot.time === draft.time;
            return (
              <button
                key={slot.time + slot.caption}
                type="button"
                aria-pressed={on}
                className="trip-page__reset add-sheet__slot"
                onClick={() => set("time", slot.time)}
                style={{
                  background: on ? theme.ink : theme.card,
                  borderColor: on ? theme.ink : theme.line,
                  color: on ? theme.bg : theme.ink,
                }}
              >
                <span className="add-sheet__slot-time" style={{ fontFamily: theme.fontMono }}>
                  {slot.time}
                </span>
                <span
                  className="add-sheet__slot-caption"
                  style={{
                    fontFamily: theme.fontMono,
                    color: on ? theme.headMeta : theme.meta,
                  }}
                >
                  {slot.caption}
                </span>
              </button>
            );
          })}
        </div>

        <div className="add-sheet__other">
          <label htmlFor={ids.time} className="add-sheet__other-label" style={labelStyle}>
            Other time
          </label>
          <input
            id={ids.time}
            type="time"
            className="add-sheet__time"
            value={draft.time}
            onChange={(e) => set("time", e.target.value)}
            style={{ ...fieldStyle, fontFamily: theme.fontMono }}
          />
        </div>
      </div>

      {clash && (
        <div className="add-sheet__clash" style={{ background: WARN_BG, borderColor: WARN_LINE }}>
          <span
            className="add-sheet__clash-label"
            style={{ fontFamily: theme.fontMono, color: WARN_INK }}
          >
            Tight against {clash.title} at {clash.time}
          </span>
          <span className="add-sheet__clash-note" style={{ color: theme.body }}>
            That one is booked. Go ahead if you want — the day will carry a note
            about it.
          </span>
        </div>
      )}

      {detailOpen ? (
        <div className="add-sheet__section">
          <div className="add-sheet__field">
            <label htmlFor={ids.place} className="wf-card__eyebrow" style={labelStyle}>
              Where
            </label>
            <input
              id={ids.place}
              className="add-sheet__input"
              value={draft.place}
              onChange={(e) => set("place", e.target.value)}
              placeholder="Optional"
              style={fieldStyle}
            />
          </div>

          <div className="add-sheet__field">
            <label htmlFor={ids.cost} className="wf-card__eyebrow" style={labelStyle}>
              Cost each, in euros
            </label>
            <input
              id={ids.cost}
              className="add-sheet__input"
              type="number"
              min="0"
              step="0.05"
              inputMode="decimal"
              value={draft.costEach}
              onChange={(e) => set("costEach", e.target.value)}
              placeholder="Optional"
              style={{ ...fieldStyle, fontFamily: theme.fontMono }}
            />
          </div>

          <div className="add-sheet__field">
            <label htmlFor={ids.note} className="wf-card__eyebrow" style={labelStyle}>
              Anything the group should know
            </label>
            <textarea
              id={ids.note}
              className="add-sheet__input add-sheet__textarea"
              value={draft.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Optional"
              rows={3}
              style={fieldStyle}
            />
          </div>

          <button
            type="button"
            aria-pressed={draft.booked}
            className="trip-page__reset add-sheet__toggle"
            onClick={() => set("booked", !draft.booked)}
          >
            <span
              className="add-sheet__checkbox"
              style={{
                borderColor: draft.booked ? theme.ink : theme.line,
                background: draft.booked ? theme.ink : "transparent",
                color: theme.bg,
              }}
            >
              {draft.booked ? "✓" : ""}
            </span>
            <span style={{ color: theme.ink }}>Already booked</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="trip-page__reset add-sheet__more"
          onClick={() => setDetailOpen(true)}
          style={{ fontFamily: theme.fontMono, color: theme.accent }}
        >
          Add where, cost, notes +
        </button>
      )}

      <button
        type="button"
        className="trip-page__reset add-sheet__submit"
        disabled={!ready}
        onClick={() => onSave(draft)}
        style={{
          color: ready ? theme.btnInk : theme.meta,
          background: ready ? (canApprove ? theme.ink : theme.accent) : theme.line,
          cursor: ready ? "pointer" : "not-allowed",
        }}
      >
        {editing ? "Save changes" : canApprove ? "Add to the day" : "Send to editors"}
      </button>

      {onDelete && (
        <button
          type="button"
          className="trip-page__reset add-sheet__delete"
          onClick={onDelete}
          style={{ fontFamily: theme.fontMono, color: DANGER_INK }}
        >
          Remove from the day
        </button>
      )}

      {!editing && !canApprove && (
        <span className="add-sheet__foot" style={labelStyle}>
          An editor sees it before it joins the plan
        </span>
      )}
    </Sheet>
  );
}
