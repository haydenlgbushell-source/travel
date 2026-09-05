import { useEffect, useRef, type HTMLAttributes } from "react";
import type { Theme } from "../../theme";
import { Photo } from "./Photo";
import { PaperclipIcon } from "./NavIcons";
import type { TripItem } from "./trip-data";

export type Verdict = "approved" | "declined";
export type DragHandleProps = HTMLAttributes<HTMLButtonElement>;

const PENDING_BG = "#F7F7F3";
const WARN_INK = "oklch(0.52 0.13 60)";
const APPROVED_INK = "oklch(0.42 0.11 155)";
const NO_BOOKING_INK = "oklch(0.5 0.13 60)";

export function ItemCard({
  item,
  index,
  verdict,
  canApprove,
  onResolve,
  onOpen,
  highlighted,
  dragHandleProps,
  dragging,
  theme,
}: {
  item: TripItem;
  index: number;
  verdict?: Verdict;
  canApprove: boolean;
  onResolve: (verdict: Verdict | undefined) => void;
  onOpen?: () => void;
  highlighted?: boolean;
  dragHandleProps?: DragHandleProps;
  dragging?: boolean;
  theme: Theme;
}) {
  const ref = useRef<HTMLDivElement>(null);

  /* Bring a freshly added item into view so its place in the day is obvious. */
  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlighted]);

  /* Declined means declined — the card collapses to a line that says so and
     offers the way back, rather than claiming to be hidden while sitting
     there in full. */
  if (verdict === "declined") {
    return (
      <div
        className="declined"
        style={{ borderColor: theme.line, background: theme.strip }}
      >
        <span
          className="declined__text"
          style={{ fontFamily: theme.fontMono, color: theme.meta }}
        >
          Declined · {item.title}
        </span>
        <button
          type="button"
          className="trip-page__reset declined__action"
          onClick={() => onResolve(undefined)}
          style={{ fontFamily: theme.fontMono, color: theme.accent }}
        >
          Put it back
        </button>
      </div>
    );
  }

  /* A suggestion stays visually provisional — tinted and dashed — until an
     editor approves it. Declining leaves the card in place with a verdict. */
  const unresolved = item.suggested && verdict !== "approved";
  const pending = item.suggested && !verdict;

  return (
    <div ref={ref} className="item" style={{ animationDelay: `${index * 55}ms` }}>
      <div
        className={highlighted ? "item__card item__card--new" : "item__card"}
        style={{
          background: unresolved ? PENDING_BG : theme.card,
          borderStyle: unresolved ? "dashed" : "solid",
          borderColor: unresolved ? "var(--wf-accent-edge)" : theme.line,
          opacity: dragging ? 0.5 : 1,
          cursor: onOpen ? "pointer" : undefined,
        }}
        /* No role="button" here — the card contains several real buttons
           and a link (drag handle, approve/decline, Maps), and a button
           can't nest other interactive elements without breaking how a
           screen reader announces them. onClick still opens it for mouse
           and touch; the title below is the real, keyboard-reachable
           trigger. */
        onClick={onOpen}
      >
        {(item.photo || item.photoUrl) && (
          <Photo
            className="item__photo"
            url={item.photoUrl}
            caption={item.photo}
            theme={theme}
          />
        )}

        <div className="item__body">
          <div className="item__title-row">
            {dragHandleProps && (
              <button
                type="button"
                className="trip-page__reset item__drag-handle"
                aria-label={`Reorder ${item.title}`}
                style={{ color: theme.meta }}
                onClick={(e) => e.stopPropagation()}
                {...dragHandleProps}
              >
                <svg width="12" height="18" viewBox="0 0 12 18" fill="none" aria-hidden="true">
                  <circle cx="3" cy="3" r="1.5" fill="currentColor" />
                  <circle cx="9" cy="3" r="1.5" fill="currentColor" />
                  <circle cx="3" cy="9" r="1.5" fill="currentColor" />
                  <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                  <circle cx="3" cy="15" r="1.5" fill="currentColor" />
                  <circle cx="9" cy="15" r="1.5" fill="currentColor" />
                </svg>
              </button>
            )}
            <span className="item__time" style={{ fontFamily: theme.fontMono }}>
              {item.time}
            </span>
            {onOpen ? (
              <button
                type="button"
                className="trip-page__reset item__title"
                style={{ color: theme.ink, cursor: "pointer", textAlign: "left" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
              >
                {item.title}
              </button>
            ) : (
              <span className="item__title" style={{ color: theme.ink }}>
                {item.title}
              </span>
            )}
            <span
              className="item__pin"
              style={{
                fontFamily: theme.fontMono,
                background: item.accent,
                color: theme.btnInk,
              }}
            >
              {index + 1}
            </span>
          </div>

          {item.travel && (item.travel.from || item.travel.to) && (
            <div className="item__route" style={{ fontFamily: theme.fontMono }}>
              <span className="item__route-end" style={{ color: theme.ink }}>
                {item.travel.from || "—"}
              </span>
              <span className="item__route-line" style={{ background: theme.line }} />
              <span className="item__route-end" style={{ color: theme.ink }}>
                {item.travel.to || "—"}
              </span>
              {item.travel.arrive && (
                <span className="item__route-time" style={{ color: theme.body }}>
                  in at {item.travel.arrive}
                </span>
              )}
            </div>
          )}

          {item.rating && (
            <div className="item__rating-row">
              <span className="item__stars">
                <span className="item__star" style={{ color: theme.star }}>
                  ★
                </span>
                <span
                  className="item__rating"
                  style={{ fontFamily: theme.fontMono, color: theme.ink }}
                >
                  {item.rating}
                </span>
              </span>
              <span
                className="item__rating-meta"
                style={{ fontFamily: theme.fontMono, color: theme.body }}
              >
                {item.reviews}
              </span>
              <span
                className="item__rating-meta"
                style={{ fontFamily: theme.fontMono, color: theme.body }}
              >
                {item.price}
              </span>
              <span
                className="item__rating-meta"
                style={{
                  fontFamily: theme.fontMono,
                  color: item.openWarn ? WARN_INK : theme.okInk,
                }}
              >
                {item.open}
              </span>
            </div>
          )}

          <div className="item__note" style={{ color: theme.body }}>
            {item.note}
          </div>

          {item.booking && (
            <div
              className="item__booking"
              style={{ background: theme.strip, borderColor: "#E7E7E0" }}
            >
              <span
                className="item__booking-kind"
                style={{
                  fontFamily: theme.fontMono,
                  color: item.bookingKind === "No table yet" ? NO_BOOKING_INK : theme.accentInk,
                }}
              >
                {item.bookingKind}
              </span>
              {item.booking.map((fact) => (
                <span key={fact.label} className="item__booking-fact">
                  <span
                    className="item__booking-label"
                    style={{ fontFamily: theme.fontMono, color: theme.body }}
                  >
                    {fact.label}
                  </span>
                  <span
                    className="item__booking-value"
                    style={{ fontFamily: theme.fontMono, color: theme.ink }}
                  >
                    {fact.value}
                  </span>
                </span>
              ))}
            </div>
          )}

          {pending && (
            <div className="item__pending">
              <span className="item__pending-label" style={{ fontFamily: theme.fontMono }}>
                Suggested by {item.suggestedBy}
              </span>
              {/* Only an editor gets buttons here. This used to offer a
                  Contributor a "Back this" button wired to the very same
                  onResolve("approved") an editor's approve fires — so a vote
                  silently put the item in the plan, in the day's money and in
                  the calendar export, on that one device only, since RLS
                  refuses their write. Nothing tallies backings, so until
                  something does, this says who is waiting on whom. */}
              {canApprove ? (
                <div className="item__pending-actions">
                  <button
                    type="button"
                    className="trip-page__reset item__pending-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolve("approved");
                    }}
                    style={{ color: theme.btnInk, background: theme.accent }}
                  >
                    Add to the day
                  </button>
                  <button
                    type="button"
                    className="trip-page__reset item__pending-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolve("declined");
                    }}
                    style={{ color: theme.ink, border: "1px solid #D6D7D0" }}
                  >
                    Not this time
                  </button>
                </div>
              ) : (
                <span className="item__pending-note" style={{ color: theme.body }}>
                  Waiting on an editor to add it to the day.
                </span>
              )}
            </div>
          )}

          {verdict === "approved" && (
            <div
              className="item__verdict"
              style={{ fontFamily: theme.fontMono, color: APPROVED_INK }}
            >
              Approved · now in the plan
            </div>
          )}

          <div className="item__foot">
            <span
              className="item__foot-meta"
              style={{ fontFamily: theme.fontMono, color: theme.body }}
            >
              {item.meta}
            </span>
            <span
              className="item__foot-meta"
              style={{ fontFamily: theme.fontMono, color: item.split ? WARN_INK : theme.body }}
            >
              {item.who}
            </span>
            {(item.documents?.length ?? 0) > 0 && (
              <span
                className="item__foot-meta item__doc-badge"
                style={{ fontFamily: theme.fontMono, color: theme.body }}
              >
                <PaperclipIcon />
                {item.documents?.length}
              </span>
            )}
            <span className="item__foot-spacer" />
            {item.mapsUrl && (
              <a
                className="item__maps"
                href={item.mapsUrl}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(e) => e.stopPropagation()}
                style={{ fontFamily: theme.fontMono, color: theme.accent }}
              >
                Maps ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {item.transit && (
        <div
          className="item__transit"
          style={{
            fontFamily: theme.fontMono,
            color: item.transitWarn ? WARN_INK : theme.meta,
          }}
        >
          {item.transit}
        </div>
      )}
    </div>
  );
}
