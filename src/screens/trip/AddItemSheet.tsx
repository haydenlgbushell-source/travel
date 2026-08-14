import { useState } from "react";
import type { Theme } from "../../theme";
import { clashAt, suggestSlots, type Day, type DraftItem } from "./trip-data";

const WARN_INK = "oklch(0.52 0.13 60)";
const WARN_BG = "oklch(0.96 0.04 60)";
const WARN_LINE = "oklch(0.88 0.07 60)";

/** Two required answers — what and when — and everything else optional. A
 *  longer form is a form people abandon on a phone. */
export function AddItemSheet({
  day,
  canApprove,
  onAdd,
  onClose,
  theme,
}: {
  day: Day;
  canApprove: boolean;
  onAdd: (draft: DraftItem) => void;
  onClose: () => void;
  theme: Theme;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [booked, setBooked] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const slots = suggestSlots(day.items);
  const clash = time ? clashAt(time, day.items) : undefined;
  const ready = title.trim().length > 0 && time.length > 0;

  const fieldStyle = {
    fontFamily: theme.fontSans,
    background: theme.card,
    borderColor: theme.line,
    color: theme.ink,
  };

  return (
    <>
      <div className="sheet__scrim" onClick={onClose} />
      <div className="sheet add-sheet" style={{ background: theme.bg }}>
        <div className="sheet__grabber" />

        <div className="sheet__head">
          <span
            className="sheet__title"
            style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
          >
            Add to {day.fullDate.split(" ")[0]}
          </span>
          <button
            type="button"
            className="trip-page__reset sheet__close"
            onClick={onClose}
            style={{ fontFamily: theme.fontMono, color: theme.body }}
          >
            Close
          </button>
        </div>

        <input
          className="add-sheet__input add-sheet__input--title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What is it?"
          autoFocus
          style={fieldStyle}
        />

        <div className="add-sheet__section">
          <span
            className="wf-card__eyebrow"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            When
          </span>
          <div className="add-sheet__slots">
            {slots.map((slot) => {
              const on = slot.time === time;
              return (
                <button
                  key={slot.time + slot.caption}
                  type="button"
                  className="trip-page__reset add-sheet__slot"
                  onClick={() => setTime(slot.time)}
                  style={{
                    background: on ? theme.ink : theme.card,
                    borderColor: on ? theme.ink : theme.line,
                    color: on ? theme.bg : theme.ink,
                  }}
                >
                  <span
                    className="add-sheet__slot-time"
                    style={{ fontFamily: theme.fontMono }}
                  >
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

          <label className="add-sheet__other" style={{ color: theme.meta }}>
            <span
              className="add-sheet__other-label"
              style={{ fontFamily: theme.fontMono }}
            >
              Other time
            </span>
            <input
              type="time"
              className="add-sheet__time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={{ ...fieldStyle, fontFamily: theme.fontMono }}
            />
          </label>
        </div>

        {clash && (
          <div
            className="add-sheet__clash"
            style={{ background: WARN_BG, borderColor: WARN_LINE }}
          >
            <span
              className="add-sheet__clash-label"
              style={{ fontFamily: theme.fontMono, color: WARN_INK }}
            >
              Tight against {clash.title} at {clash.time}
            </span>
            <span className="add-sheet__clash-note" style={{ color: theme.body }}>
              That one is booked. Adding this anyway is fine — the day will just
              flag it.
            </span>
          </div>
        )}

        {detailOpen ? (
          <div className="add-sheet__section">
            <input
              className="add-sheet__input"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Where? (optional)"
              style={fieldStyle}
            />
            <textarea
              className="add-sheet__input add-sheet__textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything the group should know? (optional)"
              rows={3}
              style={fieldStyle}
            />
            <button
              type="button"
              className="trip-page__reset add-sheet__toggle"
              onClick={() => setBooked((b) => !b)}
            >
              <span
                className="add-sheet__checkbox"
                style={{
                  borderColor: booked ? theme.ink : theme.line,
                  background: booked ? theme.ink : "transparent",
                  color: theme.bg,
                }}
              >
                {booked ? "✓" : ""}
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
            Add where, notes, booking +
          </button>
        )}

        <button
          type="button"
          className="trip-page__reset add-sheet__submit"
          disabled={!ready}
          onClick={() => onAdd({ title, time, place, note, booked })}
          style={{
            color: ready ? theme.btnInk : theme.meta,
            background: ready ? (canApprove ? theme.ink : theme.accent) : theme.line,
            cursor: ready ? "pointer" : "not-allowed",
          }}
        >
          {canApprove ? "Add to the day" : "Send to editors"}
        </button>

        {!canApprove && (
          <span
            className="add-sheet__foot"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            An editor sees it before it joins the plan
          </span>
        )}
      </div>
    </>
  );
}
