import { useEffect, useRef } from "react";
import type { Theme } from "../../theme";
import type { TripItem } from "./trip-data";

export type Verdict = "approved" | "declined";

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
  onEdit,
  highlighted,
  theme,
}: {
  item: TripItem;
  index: number;
  verdict?: Verdict;
  canApprove: boolean;
  onResolve: (verdict: Verdict | undefined) => void;
  onEdit?: () => void;
  highlighted?: boolean;
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
        }}
      >
        {item.photo && (
          <div className="item__photo" style={{ background: theme.photoFill }}>
            <span
              className="item__photo-tag"
              style={{
                fontFamily: theme.fontMono,
                background: theme.card,
                borderColor: theme.line,
              }}
            >
              {item.photo}
            </span>
          </div>
        )}

        <div className="item__body">
          <div className="item__title-row">
            <span className="item__time" style={{ fontFamily: theme.fontMono }}>
              {item.time}
            </span>
            <span className="item__title" style={{ color: theme.ink }}>
              {item.title}
            </span>
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
                Suggested by {item.suggestedBy} · 2 of 5 backing it
              </span>
              <div className="item__pending-actions">
                {canApprove ? (
                  <>
                    <button
                      type="button"
                      className="trip-page__reset item__pending-btn"
                      onClick={() => onResolve("approved")}
                      style={{ color: theme.btnInk, background: theme.accent }}
                    >
                      Add to the day
                    </button>
                    <button
                      type="button"
                      className="trip-page__reset item__pending-btn"
                      onClick={() => onResolve("declined")}
                      style={{ color: theme.ink, border: "1px solid #D6D7D0" }}
                    >
                      Not this time
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="trip-page__reset item__pending-btn"
                    onClick={() => onResolve("approved")}
                    style={{ color: theme.accentInk, border: "1px solid var(--wf-accent-edge)" }}
                  >
                    Back this
                  </button>
                )}
              </div>
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
            <span className="item__foot-spacer" />
            {onEdit && (
              <button
                type="button"
                className="trip-page__reset item__edit"
                onClick={onEdit}
                style={{ fontFamily: theme.fontMono, color: theme.accent }}
              >
                Edit
              </button>
            )}
            {item.mapsUrl && (
              <a
                className="item__maps"
                href={item.mapsUrl}
                target="_blank"
                rel="noreferrer noopener"
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
