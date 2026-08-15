import type { Theme } from "../../theme";

const DAYS: Array<[dow: string, num: string]> = [
  ["Fri", "14"],
  ["Sat", "15"],
  ["Sun", "16"],
  ["Mon", "17"],
  ["Tue", "18"],
];
const ACTIVE_DAY_INDEX = 0; // Friday
const MEMBER_INITIALS = ["AN", "TM", "JR", "SB", "KE"];

export function PhonePreview({
  theme,
  eventName,
  eventDates,
}: {
  theme: Theme;
  eventName: string;
  eventDates: string;
}) {
  return (
    <div
      className="wf-phone"
      style={{
        background: theme.bg,
        borderColor: theme.line,
        borderRadius: theme.frameRadius,
      }}
    >
      <div className="wf-phone__head" style={{ background: theme.headBg }}>
        <div className="wf-phone__head-row">
          <span
            className="wf-phone__wordmark"
            style={{
              fontFamily: theme.fontDisplay,
              letterSpacing: theme.wordTrack,
              color: theme.headInk,
            }}
          >
            {theme.wordmark}
          </span>
          <span
            className="wf-mono wf-label"
            style={{ fontFamily: theme.fontMono, color: theme.headMeta }}
          >
            {theme.countdown}
          </span>
        </div>
        <div className="wf-phone__head-row" style={{ alignItems: "flex-end" }}>
          <div>
            <div
              className="wf-mono wf-label"
              style={{ fontFamily: theme.fontMono, color: theme.headMeta }}
            >
              {eventDates}
            </div>
            <div
              className="wf-phone__city"
              style={{ fontFamily: theme.fontDisplay, color: theme.headInk }}
            >
              {eventName}
            </div>
            <div
              className="wf-phone__strapline"
              style={{ fontFamily: theme.fontSans, color: theme.headMeta }}
            >
              {theme.strapline}
            </div>
          </div>
          <div className="wf-phone__avatars">
            {MEMBER_INITIALS.map((initials) => (
              <div
                key={initials}
                className="wf-mono wf-phone__avatar"
                style={{
                  fontFamily: theme.fontMono,
                  background: theme.avatarBg,
                  borderColor: theme.headBg,
                  color: theme.headInk,
                }}
              >
                {initials}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="wf-phone__days" style={{ borderColor: theme.line }}>
        {DAYS.map(([dow, num], i) => {
          const active = i === ACTIVE_DAY_INDEX;
          return (
            <div
              key={dow + num}
              className="wf-phone__day"
              style={{
                borderRadius: theme.chipRadius,
                background: active ? theme.headBg : theme.card,
                borderColor: active ? theme.headBg : theme.line,
              }}
            >
              <span
                className="wf-mono wf-label"
                style={{
                  fontFamily: theme.fontMono,
                  color: active ? theme.headMeta : theme.meta,
                }}
              >
                {dow}
              </span>
              <span
                className="wf-phone__day-num"
                style={{
                  fontFamily: theme.fontDisplay,
                  color: active ? theme.headInk : theme.ink,
                }}
              >
                {num}
              </span>
            </div>
          );
        })}
      </div>

      <div className="wf-phone__body">
        <div>
          <div
            className="wf-mono wf-label"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            Friday 14 August
          </div>
          <div
            className="wf-phone__day-title"
            style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
          >
            {theme.dayTitle}
          </div>
        </div>

        <div
          className="wf-phone__card"
          style={{
            background: theme.card,
            borderColor: theme.line,
            borderRadius: theme.cardRadius,
          }}
        >
          <div className="wf-phone__photo" style={{ background: theme.photoFill }}>
            <span
              className="wf-mono wf-phone__photo-label"
              style={{
                fontFamily: theme.fontMono,
                color: theme.meta,
                background: theme.card,
                borderColor: theme.line,
              }}
            >
              Deep dish, straight from the oven
            </span>
          </div>
          <div className="wf-phone__card-body">
            <div className="wf-phone__item-row">
              <span
                className="wf-mono"
                style={{ fontFamily: theme.fontMono, color: theme.ink, fontSize: 12.5 }}
              >
                19:30
              </span>
              <span
                className="wf-phone__item-name"
                style={{ fontFamily: theme.fontSans, color: theme.ink }}
              >
                Lou Malnati's Pizzeria
              </span>
              <span
                className="wf-mono wf-pill-tag"
                style={{
                  fontFamily: theme.fontMono,
                  color: theme.tagInk,
                  background: theme.tagBg,
                  borderRadius: theme.pillRadius,
                }}
              >
                {theme.tag}
              </span>
            </div>
            <div className="wf-phone__rating-row">
              <span style={{ color: theme.star, fontSize: 12 }}>★</span>
              <span className="wf-mono" style={{ fontFamily: theme.fontMono, color: theme.ink, fontSize: 12 }}>
                4.6
              </span>
              <span className="wf-mono" style={{ fontFamily: theme.fontMono, color: theme.meta, fontSize: 11 }}>
                9,240
              </span>
              <span className="wf-mono" style={{ fontFamily: theme.fontMono, color: theme.meta, fontSize: 11 }}>
                $$
              </span>
              <span className="wf-mono" style={{ fontFamily: theme.fontMono, color: theme.okInk, fontSize: 11 }}>
                Until 22:00
              </span>
            </div>
            <div
              className="wf-phone__item-note"
              style={{ fontFamily: theme.fontSans, color: theme.body }}
            >
              {theme.itemNote}
            </div>
            <div
              className="wf-phone__booking"
              style={{
                background: theme.strip,
                borderColor: theme.line,
                borderRadius: theme.pillRadius,
              }}
            >
              <span
                className="wf-mono wf-label"
                style={{ fontFamily: theme.fontMono, color: theme.accentInk }}
              >
                {theme.bookingLabel}
              </span>
              <span className="wf-phone__booking-fact">
                <span
                  className="wf-mono wf-label"
                  style={{ fontFamily: theme.fontMono, color: theme.meta }}
                >
                  Under
                </span>
                <span className="wf-mono" style={{ fontFamily: theme.fontMono, color: theme.ink, fontSize: 12.5 }}>
                  Ana
                </span>
              </span>
              <span className="wf-phone__booking-fact">
                <span
                  className="wf-mono wf-label"
                  style={{ fontFamily: theme.fontMono, color: theme.meta }}
                >
                  Party
                </span>
                <span className="wf-mono" style={{ fontFamily: theme.fontMono, color: theme.ink, fontSize: 12.5 }}>
                  5
                </span>
              </span>
            </div>
          </div>
        </div>

        <div
          className="wf-phone__card wf-phone__flight"
          style={{ background: theme.card, borderColor: theme.line, borderRadius: theme.cardRadius }}
        >
          <div className="wf-phone__flight-route">
            <span className="wf-phone__airport" style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
              LGW
            </span>
            <span className="wf-phone__flight-line" style={{ background: theme.line }} />
            <span className="wf-phone__airport" style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
              ORD
            </span>
          </div>
          <div
            className="wf-phone__flight-status"
            style={{ background: theme.warnBg, borderRadius: theme.pillRadius }}
          >
            <span className="wf-phone__flight-dot" style={{ background: theme.warnInk }} />
            <span
              className="wf-mono wf-label"
              style={{ fontFamily: theme.fontMono, color: theme.warnInk }}
            >
              Delayed 20 min · gate D42
            </span>
          </div>
        </div>

        <div className="wf-phone__actions">
          <span
            className="wf-phone__cta"
            style={{
              fontFamily: theme.fontSans,
              color: theme.btnInk,
              background: theme.accent,
              borderRadius: theme.pillRadius,
            }}
          >
            {theme.cta}
          </span>
          <span
            className="wf-mono wf-phone__secondary"
            style={{
              fontFamily: theme.fontMono,
              color: theme.accentInk,
              background: theme.strip,
              borderColor: theme.line,
              borderRadius: theme.pillRadius,
            }}
          >
            {theme.secondary}
            <span
              className="wf-phone__badge"
              style={{ background: theme.accent, color: theme.btnInk, fontFamily: theme.fontSans }}
            >
              3
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
