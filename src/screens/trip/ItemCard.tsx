import type { Theme } from "../../theme";
import type { TripItem } from "./trip-data";

export type Verdict = "approved" | "declined";

const PENDING_BG = "#F7F7F3";
const PENDING_BORDER = "oklch(0.88 0.05 285)";
const ACCENT_INK = "oklch(0.42 0.13 285)";
const ACCENT_LINE = "oklch(0.88 0.05 285)";
const WARN_INK = "oklch(0.52 0.13 60)";
const DECLINED_INK = "oklch(0.5 0.13 30)";
const APPROVED_INK = "oklch(0.42 0.11 155)";
const NO_BOOKING_INK = "oklch(0.5 0.13 60)";

export function ItemCard({
  item,
  index,
  verdict,
  canApprove,
  onResolve,
  theme,
}: {
  item: TripItem;
  index: number;
  verdict?: Verdict;
  canApprove: boolean;
  onResolve: (verdict: Verdict) => void;
  theme: Theme;
}) {
  /* A suggestion stays visually provisional — tinted and dashed — until an
     editor approves it. Declining leaves the card in place with a verdict. */
  const unresolved = item.suggested && verdict !== "approved";
  const pending = item.suggested && !verdict;

  return (
    <div className="item" style={{ animationDelay: `${index * 55}ms` }}>
      <div
        className="item__card"
        style={{
          background: unresolved ? PENDING_BG : theme.card,
          borderStyle: unresolved ? "dashed" : "solid",
          borderColor: unresolved ? PENDING_BORDER : theme.line,
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
                    style={{ color: ACCENT_INK, border: `1px solid ${ACCENT_LINE}` }}
                  >
                    Back this
                  </button>
                )}
              </div>
            </div>
          )}

          {verdict && (
            <div
              className="item__verdict"
              style={{
                fontFamily: theme.fontMono,
                color: verdict === "declined" ? DECLINED_INK : APPROVED_INK,
              }}
            >
              {verdict === "approved"
                ? "Approved · now in the plan"
                : "Declined · hidden from the plan"}
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
