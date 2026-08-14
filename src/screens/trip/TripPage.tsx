import { useEffect, useRef, useState } from "react";
import type { Theme } from "../../theme";
import { AirportPanel } from "./AirportPanel";
import { DecisionsSheet } from "./DecisionsSheet";
import { InfoTab } from "./InfoTab";
import { MoneyTab } from "./MoneyTab";
import { PeopleTab } from "./PeopleTab";
import { PlanTab } from "./PlanTab";
import { TravelTab } from "./TravelTab";
import type { Verdict } from "./ItemCard";
import { DAYS, DECISION_COUNT, TABS, TRIP, type Role } from "./trip-data";
import "./trip-page.css";

/** Strip rules (day selector, tabs, bottom bar) sit a shade darker than card
 *  borders in the design. */
const STRIP_LINE = "#E1E1DA";
const AIRPORT_BORDER = "#3A3F42";
const AIRPORT_OFF_INK = "#C3C7C0";
const DAY_META_ON = "#9DA39B";
const SUGGEST_INK = "oklch(0.42 0.13 285)";
const SUGGEST_BG = "oklch(0.97 0.02 285)";
const SUGGEST_LINE = "oklch(0.9 0.04 285)";

/** How long the day switch shows skeletons before the plan lands. */
const DAY_SWITCH_MS = 380;

export function TripPage({ theme, onBack }: { theme: Theme; onBack?: () => void }) {
  const [dayIndex, setDayIndex] = useState(1);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [airport, setAirport] = useState(false);
  const [voted, setVoted] = useState(false);
  const [resolved, setResolved] = useState<Record<string, Verdict>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [role] = useState<Role>("Editor");

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const canApprove = role === "Organiser" || role === "Editor";
  const day = DAYS[dayIndex];

  function pickDay(i: number) {
    if (i === dayIndex) return;
    clearTimeout(timer.current);
    setDayIndex(i);
    setTab(0);
    setAirport(false);
    setLoading(true);
    timer.current = setTimeout(() => setLoading(false), DAY_SWITCH_MS);
  }

  function openSuggestion(i: number) {
    setDayIndex(i);
    setTab(0);
  }

  return (
    <div className="trip-page" style={{ background: theme.bg, color: theme.ink }}>
      <div
        className="trip-page__head"
        style={{ background: theme.headBg, color: theme.headInk }}
      >
        <div className="trip-page__head-row">
          <button
            type="button"
            className="trip-page__reset trip-page__wordmark"
            onClick={onBack}
            style={{
              fontFamily: theme.fontDisplay,
              letterSpacing: theme.wordTrack,
              cursor: onBack ? "pointer" : "default",
            }}
          >
            {theme.wordmark}
          </button>
          <div className="trip-page__head-actions">
            <span
              className="trip-page__countdown"
              style={{ fontFamily: theme.fontMono, color: "oklch(0.78 0.13 60)" }}
            >
              {theme.countdown}
            </span>
            <button
              type="button"
              className="trip-page__reset trip-page__airport"
              onClick={() => setAirport((on) => !on)}
              style={{
                fontFamily: theme.fontMono,
                color: airport ? theme.ink : AIRPORT_OFF_INK,
                background: airport ? theme.bg : "transparent",
                borderColor: AIRPORT_BORDER,
              }}
            >
              Airport
            </button>
          </div>
        </div>

        <div className="trip-page__head-main">
          <div>
            <div
              className="trip-page__dates"
              style={{ fontFamily: theme.fontMono, color: theme.headMeta }}
            >
              {TRIP.dates}
            </div>
            <div className="trip-page__name" style={{ fontFamily: theme.fontDisplay }}>
              {TRIP.name}
            </div>
          </div>
          <div className="trip-page__avatars">
            {TRIP.members.map((member) => (
              <div
                key={member.initials}
                className="trip-page__avatar"
                style={{
                  fontFamily: theme.fontMono,
                  background: theme.avatarBg,
                  borderColor: theme.headBg,
                  color: "#D5D8D2",
                }}
              >
                {member.initials}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="trip-page__days"
        style={{ background: theme.bg, borderBottomColor: STRIP_LINE }}
      >
        {DAYS.map((d, i) => {
          const on = i === dayIndex;
          return (
            <button
              key={d.num}
              type="button"
              className="trip-page__reset trip-page__day"
              onClick={() => pickDay(i)}
              style={{
                background: on ? theme.ink : theme.card,
                borderColor: on ? theme.ink : theme.line,
                borderRadius: theme.chipRadius,
              }}
            >
              <span
                className="trip-page__day-dow"
                style={{
                  fontFamily: theme.fontMono,
                  color: on ? DAY_META_ON : theme.meta,
                }}
              >
                {d.dow}
              </span>
              <span
                className="trip-page__day-num"
                style={{
                  fontFamily: theme.fontDisplay,
                  color: on ? theme.bg : theme.ink,
                }}
              >
                {d.num}
              </span>
              {d.conflict && <span className="trip-page__day-flag" />}
            </button>
          );
        })}
      </div>

      <div
        className="trip-page__tabs"
        style={{ background: theme.bg, borderBottomColor: STRIP_LINE }}
      >
        {TABS.map((label, i) => (
          <button
            key={label}
            type="button"
            className="trip-page__reset trip-page__tab"
            onClick={() => {
              setTab(i);
              setAirport(false);
            }}
            style={{ color: i === tab ? theme.ink : theme.meta }}
          >
            {label}
            <span
              className="trip-page__tab-underline"
              style={{
                background: theme.accent,
                transform: `scaleX(${i === tab ? 1 : 0})`,
              }}
            />
          </button>
        ))}
      </div>

      <div className="trip-page__body">
        {airport ? (
          <AirportPanel day={day} theme={theme} />
        ) : (
          <>
            {tab === 0 && (
              <PlanTab
                day={day}
                dayIndex={dayIndex}
                loading={loading}
                resolved={resolved}
                canApprove={canApprove}
                onResolve={(key, verdict) =>
                  setResolved((prev) => ({ ...prev, [key]: verdict }))
                }
                theme={theme}
              />
            )}
            {tab === 1 && <TravelTab theme={theme} />}
            {tab === 2 && <MoneyTab theme={theme} />}
            {tab === 3 && <InfoTab theme={theme} />}
            {tab === 4 && (
              <PeopleTab role={role} onOpenSuggestion={openSuggestion} theme={theme} />
            )}
          </>
        )}
      </div>

      <div
        className="trip-page__bar"
        style={{ background: theme.bg, borderTopColor: STRIP_LINE }}
      >
        <button
          type="button"
          className="trip-page__reset trip-page__add"
          style={{
            color: canApprove ? theme.btnInk : SUGGEST_INK,
            background: canApprove ? theme.ink : SUGGEST_BG,
            borderColor: canApprove ? theme.ink : SUGGEST_LINE,
          }}
        >
          {canApprove ? "Add to this day" : "Suggest something"}
        </button>
        <button
          type="button"
          className="trip-page__reset trip-page__decisions"
          onClick={() => setSheetOpen(true)}
          style={{ fontFamily: theme.fontMono }}
        >
          Decisions
          <span
            className="trip-page__decisions-count"
            style={{ background: theme.accent, color: theme.btnInk }}
          >
            {DECISION_COUNT}
          </span>
        </button>
      </div>

      {sheetOpen && (
        <DecisionsSheet
          voted={voted}
          onVote={() => setVoted((v) => !v)}
          onClose={() => setSheetOpen(false)}
          theme={theme}
        />
      )}
    </div>
  );
}
