import { useEffect, useId, useRef, useState } from "react";
import type { Theme } from "../../theme";
import { Photo } from "./Photo";
import { Sheet } from "./Sheet";
import {
  CURRENCIES,
  ITEM_KINDS,
  TRAVEL_MODES,
  airlineFor,
  clashAt,
  deleteItemDocument,
  deleteItemPhotoIfOwned,
  draftFrom,
  formatDuration,
  fromBaseAmount,
  looksLikeImage,
  parseDuration,
  suggestSlots,
  toBaseAmount,
  uploadItemDocument,
  uploadItemPhoto,
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
  documents: [],
};

/** Two required answers — what and when — and everything else optional. A
 *  longer form is a form people abandon on a phone. The same sheet edits an
 *  existing item, keeping every field it does not ask about. */
export function ItemSheet({
  day,
  days,
  tripId,
  editing,
  template,
  canApprove,
  currency,
  onCurrencyChange,
  onSave,
  onDelete,
  onClose,
  theme,
}: {
  /** The day this item starts on — an edit's own day, or whichever day was
   *  open when Add was tapped. */
  day: Day;
  /** Every day on the trip, so the sheet can offer moving the item to a
   *  different one rather than only ever landing on `day`. */
  days: Day[];
  /** Where an uploaded photo's storage path is scoped — see uploadItemPhoto. */
  tripId: string;
  editing?: TripItem;
  /** Pre-fills a new item from an agency's saved activity — everything but
   *  the time, which still has to be chosen here same as any other add.
   *  Ignored once `editing` is set. */
  template?: Partial<DraftItem>;
  canApprove: boolean;
  currency: string;
  /** Changes the trip's shared currency — the same setting MoneyTab shows,
   *  offered here too since this is where a cost actually gets typed in and
   *  people don't reliably know to go find it elsewhere first. */
  onCurrencyChange: (code: string) => void;
  /** The date is whichever day's chip is selected, which starts as `day`'s
   *  own but can move — the caller decides what moving days actually does. */
  onSave: (draft: DraftItem, date: string) => void;
  onDelete?: () => void;
  onClose: () => void;
  theme: Theme;
}) {
  const [draft, setDraft] = useState<DraftItem>(
    editing ? draftFrom(editing, currency) : { ...EMPTY, ...template },
  );
  /* Which day's chip is selected — starts on the day the sheet opened for,
     moves only if someone taps a different one. */
  const [selectedDate, setSelectedDate] = useState(day.date);
  const activeDay = days.find((d) => d.date === selectedDate) ?? day;
  const [detailOpen, setDetailOpen] = useState(editing !== undefined || template !== undefined);
  /* A second, deeper reveal for the field people fill in least — pasting a
     website is a nice-to-have, not something the "where/cost/notes" crowd
     is usually here for, and it drags a lookup spinner and an image preview
     along with it. Starts open when editing something that already has one,
     so existing data is never hidden behind a tap. */
  const [photoOpen, setPhotoOpen] = useState(
    () => (editing?.photoUrl ?? template?.photoUrl ?? "").trim() !== "",
  );
  const [photoStatus, setPhotoStatus] = useState<"idle" | "looking" | "found" | "none">("idle");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const photoFileRef = useRef<HTMLInputElement>(null);
  const [placeStatus, setPlaceStatus] = useState<"idle" | "looking" | "found" | "none">("idle");
  /* Typed free-form ("3h 25m") rather than bound to travel.durationMinutes
     directly, so a still-incomplete value being typed doesn't wipe out a
     good one already saved — see handleDurationChange. */
  const [durationText, setDurationText] = useState(() =>
    draft.travel.durationMinutes !== undefined ? formatDuration(draft.travel.durationMinutes) : "",
  );
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentError, setDocumentError] = useState<string>();
  const documentFileRef = useRef<HTMLInputElement>(null);
  const ids = {
    title: useId(),
    time: useId(),
    place: useId(),
    note: useId(),
    cost: useId(),
    photo: useId(),
    document: useId(),
    flightNo: useId(),
    from: useId(),
    to: useId(),
    arrive: useId(),
    duration: useId(),
  };

  const setTravel = (patch: Partial<DraftItem["travel"]>) =>
    setDraft((d) => ({ ...d, travel: { ...d.travel, ...patch } }));

  const set = <K extends keyof DraftItem>(key: K, value: DraftItem[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  /* Not every place has a website worth scraping — this is the other way in,
     a photo someone on the trip actually took. Uploading replaces whatever
     was in the field, same as a pasted website resolving to its picture. */
  async function handlePhotoFile(file: File) {
    setUploadError(undefined);
    setUploadingPhoto(true);
    const previousPhotoUrl = draft.photoUrl;
    try {
      const result = await uploadItemPhoto(tripId, file);
      if ("error" in result) {
        setUploadError(
          result.error === "too-large"
            ? "That photo's too big — keep it under 5MB."
            : "That file type isn't supported — use a JPEG, PNG or WebP.",
        );
      } else {
        set("photoUrl", result.url);
        setPhotoStatus("idle");
        /* The one this replaces was this app's own upload, not something
           worth keeping around now nothing points at it. */
        void deleteItemPhotoIfOwned(previousPhotoUrl);
      }
    } catch {
      setUploadError("Couldn't upload that — check your connection and try again.");
    } finally {
      setUploadingPhoto(false);
      if (photoFileRef.current) photoFileRef.current.value = "";
    }
  }

  /* A boarding pass or booking PDF, kept with the item rather than only in
     whoever booked it's own inbox — the one place on the trip everyone can
     actually find it again. Several can pile up on one item (an outbound and
     a return boarding pass on the same flight item, say), so this appends
     rather than replacing. */
  async function handleDocumentFile(file: File) {
    setDocumentError(undefined);
    setUploadingDocument(true);
    try {
      const result = await uploadItemDocument(tripId, file);
      if ("error" in result) {
        setDocumentError(
          result.error === "too-large"
            ? "That file's too big — keep it under 10MB."
            : "That file type isn't supported — use a PDF, JPEG, PNG or WebP.",
        );
      } else {
        setDraft((d) => ({ ...d, documents: [...d.documents, result.document] }));
      }
    } catch {
      setDocumentError("Couldn't upload that — check your connection and try again.");
    } finally {
      setUploadingDocument(false);
      if (documentFileRef.current) documentFileRef.current.value = "";
    }
  }

  function removeDocument(url: string) {
    setDraft((d) => ({ ...d, documents: d.documents.filter((doc) => doc.url !== url) }));
    void deleteItemDocument(url);
  }

  /* Commits a parseable value straight away; an unparseable one (someone
     mid-typing "3h 2", say) is kept on screen without overwriting whatever
     duration was there before — nothing is lost to a value that isn't
     finished yet. */
  function handleDurationChange(text: string) {
    setDurationText(text);
    const parsed = parseDuration(text);
    if (parsed !== undefined || text.trim() === "") setTravel({ durationMinutes: parsed });
  }

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

  const slots = suggestSlots(activeDay.items.filter((i) => i.id !== editing?.id));
  const clash = draft.time ? clashAt(draft.time, activeDay.items, editing?.id) : undefined;
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
      title={editing ? "Edit item" : `Add to ${activeDay.fullDate.split(" ")[0]}`}
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
                  {carrier}
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

      {days.length > 1 && (
        <div className="add-sheet__section">
          <span className="wf-card__eyebrow" style={labelStyle}>
            Day
          </span>
          <div className="add-sheet__days">
            {days.map((d) => {
              const on = d.date === selectedDate;
              return (
                <button
                  key={d.date}
                  type="button"
                  aria-pressed={on}
                  className="trip-page__reset add-sheet__day"
                  onClick={() => setSelectedDate(d.date)}
                  style={{
                    background: on ? theme.ink : theme.card,
                    borderColor: on ? theme.ink : theme.line,
                    color: on ? theme.bg : theme.ink,
                    borderRadius: theme.chipRadius,
                  }}
                >
                  <span
                    className="add-sheet__day-dow"
                    style={{ fontFamily: theme.fontMono, color: on ? theme.headMeta : theme.meta }}
                  >
                    {d.dow}
                  </span>
                  <span className="add-sheet__day-num" style={{ fontFamily: theme.fontDisplay }}>
                    {d.num}
                  </span>
                </button>
              );
            })}
          </div>
          {editing && selectedDate !== day.date && (
            <span
              className="add-sheet__hint"
              style={{ fontFamily: theme.fontMono, color: theme.meta }}
            >
              Moves to {activeDay.fullDate}
            </span>
          )}
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

        {draft.kind === "Travel" && draft.travel.arrive && (
          <div className="add-sheet__field">
            <label htmlFor={ids.duration} className="wf-card__eyebrow" style={labelStyle}>
              Actual flight/journey time
            </label>
            <input
              id={ids.duration}
              className="add-sheet__input"
              value={durationText}
              onChange={(e) => handleDurationChange(e.target.value)}
              placeholder="e.g. 14h 25m, off the ticket"
              style={{ ...fieldStyle, fontFamily: theme.fontMono }}
            />
            <span className="add-sheet__hint" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
              {durationText.trim() === ""
                ? "Departs/arrives are local clock times — across time zones, the gap between them isn't how long the trip actually takes. Type the real duration off the ticket."
                : ""}
            </span>
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
                  ? "Looking…"
                  : placeStatus === "found"
                    ? draft.placeAddress
                    : "Couldn't find that one"}
              </span>
            )}
          </div>

          <div className="add-sheet__field">
            <label htmlFor={ids.cost} className="wf-card__eyebrow currency" style={labelStyle}>
              Cost each, in
              <select
                className="currency__select"
                value={currency}
                onChange={(e) => {
                  const next = e.target.value;
                  /* Re-express what's already typed in the new currency
                     rather than leaving the same digits under a different
                     label — otherwise switching currency mid-entry silently
                     changes what the number means. */
                  const base = toBaseAmount(draft.costEach, currency);
                  if (base !== undefined) {
                    set("costEach", fromBaseAmount(base, next));
                  }
                  onCurrencyChange(next);
                }}
                aria-label="Currency"
                style={{
                  fontFamily: theme.fontMono,
                  color: theme.ink,
                  background: theme.strip,
                  borderColor: theme.line,
                }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
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

          <div className="add-sheet__field">
            <span className="wf-card__eyebrow" style={labelStyle}>
              Documents
            </span>
            {draft.documents.length > 0 && (
              <div className="add-sheet__documents">
                {draft.documents.map((doc) => (
                  <div key={doc.url} className="add-sheet__document">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      style={{ color: theme.ink }}
                    >
                      {doc.name}
                    </a>
                    <button
                      type="button"
                      className="trip-page__reset add-sheet__more"
                      onClick={() => removeDocument(doc.url)}
                      style={{ fontFamily: theme.fontMono, color: theme.meta }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            {canApprove && (
              <div className="add-sheet__photo-upload">
                <input
                  ref={documentFileRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  className="trip-page__visually-hidden"
                  id={`${ids.document}-file`}
                  disabled={uploadingDocument}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleDocumentFile(file);
                  }}
                />
                <label
                  htmlFor={`${ids.document}-file`}
                  className="trip-page__reset add-sheet__more"
                  style={{ fontFamily: theme.fontMono, color: theme.accent }}
                >
                  {uploadingDocument
                    ? "Uploading…"
                    : "Attach a boarding pass, e-ticket or confirmation +"}
                </label>
              </div>
            )}
            {documentError && (
              <span className="add-sheet__hint" style={{ fontFamily: theme.fontMono, color: WARN_INK }}>
                {documentError}
              </span>
            )}
          </div>

          {photoOpen ? (
            <div className="add-sheet__field">
              <label htmlFor={ids.photo} className="wf-card__eyebrow" style={labelStyle}>
                Photo
              </label>
              <input
                id={ids.photo}
                className="add-sheet__input"
                type="url"
                inputMode="url"
                value={draft.photoUrl}
                onChange={(e) => set("photoUrl", e.target.value)}
                placeholder="Paste the place's website (optional)"
                autoFocus
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
                    ? "Looking…"
                    : photoStatus === "found"
                      ? ""
                      : "No picture found there"}
                </span>
              )}

              {/* Storage RLS on trip-item-photos only accepts an
                  Organiser/Editor's own upload — a Contributor pasting a
                  website URL still works fine (that's a plain text field,
                  no storage write), so only the upload control itself is
                  hidden from them rather than the whole photo section. */}
              {canApprove && (
                <div className="add-sheet__photo-upload">
                  <input
                    ref={photoFileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="trip-page__visually-hidden"
                    id={`${ids.photo}-file`}
                    disabled={uploadingPhoto}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handlePhotoFile(file);
                    }}
                  />
                  <label
                    htmlFor={`${ids.photo}-file`}
                    className="trip-page__reset add-sheet__more"
                    style={{ fontFamily: theme.fontMono, color: theme.accent }}
                  >
                    {uploadingPhoto ? "Uploading…" : "Or upload one directly +"}
                  </label>
                </div>
              )}
              {uploadError && (
                <span
                  className="add-sheet__hint"
                  style={{ fontFamily: theme.fontMono, color: WARN_INK }}
                >
                  {uploadError}
                </span>
              )}

              {draft.photoUrl.trim() !== "" && (
                <>
                  <Photo className="add-sheet__preview" url={draft.photoUrl.trim()} theme={theme} />
                  <button
                    type="button"
                    className="trip-page__reset add-sheet__more"
                    onClick={() => {
                      void deleteItemPhotoIfOwned(draft.photoUrl);
                      set("photoUrl", "");
                    }}
                    style={{ fontFamily: theme.fontMono, color: theme.meta }}
                  >
                    Remove photo
                  </button>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="trip-page__reset add-sheet__more"
              onClick={() => setPhotoOpen(true)}
              style={{ fontFamily: theme.fontMono, color: theme.accent }}
            >
              Add a photo or website +
            </button>
          )}
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
        onClick={() => onSave(draft, selectedDate)}
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

    </Sheet>
  );
}
