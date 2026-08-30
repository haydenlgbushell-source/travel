import type { Theme } from "../../theme";
import { Photo } from "./Photo";
import { Sheet } from "./Sheet";
import { looksLikeImage, money, type TripItem } from "./trip-data";

const WARN_INK = "oklch(0.52 0.13 60)";
const NO_BOOKING_INK = "oklch(0.5 0.13 60)";

/** Everything the compact card shows, plus everything it doesn't have room
 *  for — read-only, so tapping an item never risks changing it by accident.
 *  Edit stays a deliberate second step, reached from here rather than from
 *  the card itself, so a Contributor can open the same view an Editor sees. */
export function ItemDetail({
  item,
  canApprove,
  currency,
  onEdit,
  onClose,
  theme,
}: {
  item: TripItem;
  canApprove: boolean;
  currency: string;
  onEdit?: () => void;
  onClose: () => void;
  theme: Theme;
}) {
  const labelStyle = { fontFamily: theme.fontMono, color: theme.meta };
  const website = item.photoUrl && !looksLikeImage(item.photoUrl) ? item.photoUrl : undefined;

  return (
    <Sheet title={item.title} className="item-detail" onClose={onClose} theme={theme}>
      {(item.photo || item.photoUrl) && (
        <Photo className="item-detail__photo" url={item.photoUrl} caption={item.photo} theme={theme} />
      )}

      <div className="item-detail__body">
        <div className="item-detail__head">
          <span className="item-detail__time" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
            {item.time}
          </span>
          <span
            className="item-detail__kind"
            style={{ fontFamily: theme.fontMono, background: item.accent, color: theme.btnInk }}
          >
            {item.kind}
          </span>
        </div>

        {item.place && item.place !== "Not set" && (
          <div className="item-detail__place" style={{ color: theme.body }}>
            {item.place}
          </div>
        )}

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
        {item.travel?.number && (
          <div className="item-detail__row" style={{ fontFamily: theme.fontMono, color: theme.body }}>
            {item.travel.carrier ? `${item.travel.carrier} · ` : ""}
            {item.travel.number}
          </div>
        )}

        {item.rating && (
          <div className="item__rating-row">
            <span className="item__stars">
              <span className="item__star" style={{ color: theme.star }}>
                ★
              </span>
              <span className="item__rating" style={{ fontFamily: theme.fontMono, color: theme.ink }}>
                {item.rating}
              </span>
            </span>
            <span className="item__rating-meta" style={{ fontFamily: theme.fontMono, color: theme.body }}>
              {item.reviews}
            </span>
            <span className="item__rating-meta" style={{ fontFamily: theme.fontMono, color: theme.body }}>
              {item.price}
            </span>
            <span
              className="item__rating-meta"
              style={{ fontFamily: theme.fontMono, color: item.openWarn ? WARN_INK : theme.okInk }}
            >
              {item.open}
            </span>
          </div>
        )}

        {item.note && (
          <div className="item-detail__note" style={{ color: theme.ink }}>
            {item.note}
          </div>
        )}

        {item.booking && (
          <div className="item__booking" style={{ background: theme.strip, borderColor: "#E7E7E0" }}>
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
                <span className="item__booking-label" style={{ fontFamily: theme.fontMono, color: theme.body }}>
                  {fact.label}
                </span>
                <span className="item__booking-value" style={{ fontFamily: theme.fontMono, color: theme.ink }}>
                  {fact.value}
                </span>
              </span>
            ))}
          </div>
        )}

        {item.transit && (
          <div
            className="item-detail__row"
            style={{ fontFamily: theme.fontMono, color: item.transitWarn ? WARN_INK : theme.meta }}
          >
            {item.transit}
          </div>
        )}

        <div className="item-detail__facts">
          {item.costEach !== undefined && (
            <div className="item-detail__fact">
              <span className="wf-card__eyebrow" style={labelStyle}>
                Cost each
              </span>
              <span style={{ color: theme.ink }}>{money(item.costEach, currency)}</span>
            </div>
          )}
          <div className="item-detail__fact">
            <span className="wf-card__eyebrow" style={labelStyle}>
              Who
            </span>
            <span style={{ color: item.split ? WARN_INK : theme.ink }}>{item.who}</span>
          </div>
          {item.meta && (
            <div className="item-detail__fact">
              <span className="wf-card__eyebrow" style={labelStyle}>
                Status
              </span>
              <span style={{ color: theme.ink }}>{item.meta}</span>
            </div>
          )}
        </div>

        <div className="item-detail__links">
          {item.mapsUrl && (
            <a
              className="item__maps"
              href={item.mapsUrl}
              target="_blank"
              rel="noreferrer noopener"
              style={{ fontFamily: theme.fontMono, color: theme.accent }}
            >
              Open in Maps ↗
            </a>
          )}
          {website && (
            <a
              className="item__maps"
              href={website}
              target="_blank"
              rel="noreferrer noopener"
              style={{ fontFamily: theme.fontMono, color: theme.accent }}
            >
              Website ↗
            </a>
          )}
        </div>

        {canApprove && onEdit && (
          <button
            type="button"
            className="trip-page__reset add-sheet__more"
            onClick={onEdit}
            style={{ fontFamily: theme.fontMono, color: theme.accent }}
          >
            Edit this item
          </button>
        )}
      </div>
    </Sheet>
  );
}
