import { useEffect, useId, useState } from "react";
import type { Theme } from "../../theme";
import { Photo } from "./Photo";
import { Sheet } from "./Sheet";
import {
  ITEM_KINDS,
  TRAVEL_MODES,
  airlineFor,
  clashAt,
  draftFrom,
  looksLikeImage,
  suggestSlots,
  type Day,
  type DraftItem,
  type TripItem,
} from "./trip-data";
import { geocodePlace } from "../trip-setup/event-data";

const WARN_INK = "oklch(0.52 0.13 60)";
const WARN_BG = "oklch(0.96 0.04 60)";
const WARN_LINE = "oklch(0.88 0.07 60)";
const DANGER_INK = "oklch(0.5 0.13 30)";

const EMPTY: DraftItem = {
  kind: "Do",
  title: "",
  photoUrl: "",
  time: "",
  place: "",
  note: "",
  booked: false,
  costEach: "",
  travel: { mode: "Flight" },
};

/** Two required answers — what and when — and everything else optional. A
 *  longer form is a form people abandon on a phone. The same sheet edits an
 *  existing item, keeping every field it does not ask about. */
export function ItemSheet({
  day,
  editing,
  canApprove,
  currency,
  onSave,
  onDelete,
  onClose,
  theme,
}: {
  day: Day;
  editing?: TripItem;
  canApprove: boolean;
  currency: string;
  onSave: (draft: DraftItem) => void;
  onDelete?: () => void;
  onClose: () => void;
  theme: Theme;
}) {
  const [draft, setDraft] = useState<DraftItem>(editing ? draftFrom(editing, currency) : EMPTY);
  const [detailOpen, setDetailOpen] = useState(editing !== undefined);
  const [photoStatus, setPhotoStatus] = useState<"idle" | "looking" | "found" | "none">("idle");
  const [placeStatus, setPlaceStatus] = useState<"idle" | "looking" | "found" | "none">("idle");
  const ids = {
    title: useId(),
    time: useId(),
    place: useId(),
    note: useId(),
    cost: useId(),
    photo: useId(),
    flightNo: useId(),
    from: useId(),
    to: useId(),
    arrive: useId(),
  };

  const setTravel = (patch: Partial<DraftItem["travel"]>) =>
    setDraft((d) => ({ ...d, travel: { ...d.travel, ...patch } }));

  const set = <K extends keyof DraftItem>(key: K, value: DraftItem[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  /* Pasting the hotel's website is the natural thing to do, so look up the
     picture that page advertises rather than failing quietly. */
  useEffect(() => {
    const url = draft.photoUrl.trim();
    if (url === "") {
      setPhotoStatus("idle");
      return;
    }
    if (looksLikeImage(url) || !/^https?:\/\//i.test(url)) return;

    let cancelled = false;
    setPhotoStatus("looking");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/.netlify/functions/unfurl?url=${encodeURIComponent(url)}`);
        const data = (await response.json()) as { image?: string };
        if (cancelled) return;
        if (data.image) {
          setDraft((d) => ({ ...d, photoUrl: data.image as string }));
          setPhotoStatus("found");
        } else {
          setPhotoStatus("none");
        }
      } catch {
        if (!cancelled) setPhotoStatus("none");
      }
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft.photoUrl]);

  /* People type a name — "Sydney Opera House" — far more often than a street
     address, so look it up and keep both: the full address to show, and the
     coordinates that put the item on the map. Without this an added item is
     invisible on every map in the app. */
  useEffect(() => {
    const query = draft.place.trim();
    if (query.length < 3 || draft.placeAddress !== undefined) {
      if (query === "") setPlaceStatus("idle");
      return;
    }

    let cancelled = false;
    setPlaceStatus("looking");
    const timer = setTimeout(async () => {
      try {
        const found = await geocodePlace(query);
        if (cancelled) return;
        if (found) {
          setDraft((d) => ({
            ...d,
            placeAddress: found.label,
            lat: found.lat,
            lng: found.lng,
          }));
          setPlaceStatus("found");
        } else {
          setPlaceStatus("none");
        }
      } catch {
        if (!cancelled) setPlaceStatus("none");
      }
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft.place, draft.placeAddress]);

  /* Both ends of a journey get looked up too, so a flight or drive draws on
     the map instead of being the one kind of item that never appears. */
  useEffect(() => {
    if (draft.kind !== "Travel") return;
    const ends = [
      { text: draft.travel.from, has: draft.travel.fromLat !== undefined, key: "from" as const },
      { text: draft.travel.to, has: draft.travel.toLat !== undefined, key: "to" as const },
    ].filter((e) => !e.has && (e.text?.trim().length ?? 0) >= 3);
    if (ends.length === 0) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      for (const end of ends) {
        try {
          const found = await geocodePlace(end.text as string);
          if (cancelled || !found) continue;
          setTravel(
            end.key === "from"
              ? { fromLat: found.lat, fromLng: found.lng }
              : { toLat: found.lat, toLng: found.lng },
          );
        } catch {
          /* No coordinates just means this leg stays off the map. */
        }
      }
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.kind, draft.travel.from, draft.travel.to, draft.travel.fromLat, draft.travel.toLat]);

  /* Named offline from the number's prefix — see airlineFor. Looking up the
     actual route and times needs a keyed flight API. */
  const carrier = draft.travel.number ? airlineFor(draft.travel.number) : undefined;

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

      {draft.kind === "Travel" && (
        <div className="add-sheet__section">
          <span className="wf-card__eyebrow" style={labelStyle}>
            How you're getting there
          </span>
          <div className="kind-picker">
            {TRAVEL_MODES.map((mode) => {
              const on = mode === draft.travel.mode;
              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={on}
                  className="trip-page__reset kind-picker__option"
                  onClick={() => setTravel({ mode })}
                  style={{
                    background: on ? theme.ink : theme.card,
                    borderColor: on ? theme.ink : theme.line,
                    color: on ? theme.bg : theme.body,
                  }}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          {(draft.travel.mode === "Flight" || draft.travel.mode === "Train") && (
            <div className="add-sheet__field">
              <label htmlFor={ids.flightNo} className="wf-card__eyebrow" style={labelStyle}>
                {draft.travel.mode === "Flight" ? "Flight number" : "Train number"}
              </label>
              <input
                id={ids.flightNo}
                className="add-sheet__input"
                value={draft.travel.number ?? ""}
                onChange={(e) => setTravel({ number: e.target.value })}
                placeholder={draft.travel.mode === "Flight" ? "BA296" : "Optional"}
                autoCapitalize="characters"
                style={{ ...fieldStyle, fontFamily: theme.fontMono }}
              />
              {carrier && (
                <span
                  className="add-sheet__hint"
                  style={{ fontFamily: theme.fontMono, color: theme.meta }}
                >
                  {carrier} — add the route and times below
                </span>
              )}
            </div>
          )}

          <div className="add-sheet__pair">
            <div className="add-sheet__field">
              <label htmlFor={ids.from} className="wf-card__eyebrow" style={labelStyle}>
                From
              </label>
              <input
                id={ids.from}
                className="add-sheet__input"
                value={draft.travel.from ?? ""}
                onChange={(e) =>
                  setTravel({ from: e.target.value, fromLat: undefined, fromLng: undefined })
                }
                placeholder={draft.travel.mode === "Flight" ? "Gatwick" : "Where from"}
                style={fieldStyle}
              />
            </div>
            <div className="add-sheet__field">
              <label htmlFor={ids.to} className="wf-card__eyebrow" style={labelStyle}>
                To
              </label>
              <input
                id={ids.to}
                className="add-sheet__input"
                value={draft.travel.to ?? ""}
                onChange={(e) =>
                  setTravel({ to: e.target.value, toLat: undefined, toLng: undefined })
                }
                placeholder={draft.travel.mode === "Flight" ? "O'Hare" : "Where to"}
                style={fieldStyle}
              />
            </div>
          </div>
        </div>
      )}

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

        {draft.kind === "Travel" && (
          <div className="add-sheet__other">
            <label htmlFor={ids.arrive} className="add-sheet__other-label" style={labelStyle}>
              Arrives
            </label>
            <input
              id={ids.arrive}
              type="time"
              className="add-sheet__time"
              value={draft.travel.arrive ?? ""}
              onChange={(e) => setTravel({ arrive: e.target.value })}
              style={{ ...fieldStyle, fontFamily: theme.fontMono }}
            />
          </div>
        )}
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
              onChange={(e) =>
                /* Retyping invalidates whatever the old name resolved to —
                   keeping the previous address would pin the item to the
                   wrong spot on the map. */
                setDraft((d) => ({
                  ...d,
                  place: e.target.value,
                  placeAddress: undefined,
                  lat: undefined,
                  lng: undefined,
                }))
              }
              placeholder="Name or address (optional)"
              style={fieldStyle}
            />
            {placeStatus !== "idle" && (
              <span
                className="add-sheet__hint"
                style={{
                  fontFamily: theme.fontMono,
                  color: placeStatus === "none" ? WARN_INK : theme.meta,
                }}
              >
                {placeStatus === "looking"
                  ? "Looking that place up…"
                  : placeStatus === "found"
                    ? draft.placeAddress
                    : "Couldn't find that one — it still works, it just won't sit on the map"}
              </span>
            )}
          </div>

          <div className="add-sheet__field">
            <label htmlFor={ids.cost} className="wf-card__eyebrow" style={labelStyle}>
              Cost each, in {currency}
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
            <label htmlFor={ids.photo} className="wf-card__eyebrow" style={labelStyle}>
              Website
            </label>
            <input
              id={ids.photo}
              className="add-sheet__input"
              type="url"
              inputMode="url"
              value={draft.photoUrl}
              onChange={(e) => set("photoUrl", e.target.value)}
              placeholder="Paste the place's website (optional)"
              style={fieldStyle}
            />
            {photoStatus !== "idle" && (
              <span
                className="add-sheet__hint"
                style={{
                  fontFamily: theme.fontMono,
                  color: photoStatus === "none" ? WARN_INK : theme.meta,
                }}
              >
                {photoStatus === "looking"
                  ? "Looking for a picture on that page…"
                  : photoStatus === "found"
                    ? "Found the picture that page shows"
                    : "No picture found there — open the photo itself and copy its address"}
              </span>
            )}
            {draft.photoUrl.trim() !== "" && (
              <Photo className="add-sheet__preview" url={draft.photoUrl.trim()} theme={theme} />
            )}
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
          color: ready ? (canApprove ? theme.bg : theme.btnInk) : theme.meta,
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
