import { useEffect, useRef, useState } from "react";
import { ThemeProvider, type Theme } from "../../theme";
import { AirportPanel } from "./AirportPanel";
import { DecisionsSheet } from "./DecisionsSheet";
import { InfoTab } from "./InfoTab";
import { ItemSheet } from "./ItemSheet";
import { MoneyTab } from "./MoneyTab";
import { PeopleTab } from "./PeopleTab";
import { PlanTab } from "./PlanTab";
import { TravelTab } from "./TravelTab";
import type { Verdict } from "./ItemCard";
import {
  DAYS,
  DECISION_COUNT,
  TABS,
  TRIP,
  applyDraft,
  buildItem,
  byTime,
  clashAt,
  loadSaved,
  save,
  type Day,
  type DraftItem,
  type Role,
} from "./trip-data";
import "./trip-page.css";

/** Strip rules (day selector, tabs, bottom bar) sit a shade darker than card
 *  borders in the design. */
const STRIP_LINE = "#E1E1DA";
const AIRPORT_BORDER = "#3A3F42";
const AIRPORT_OFF_INK = "#C3C7C0";
const DAY_META_ON = "#9DA39B";

/** How long the day switch shows skeletons before the plan lands. */
const DAY_SWITCH_MS = 380;

/** How long undo stays offered after an add. */
const UNDO_MS = 8000;

export function TripPage({ theme, onBack }: { theme: Theme; onBack?: () => void }) {
  const saved = useRef(loadSaved()).current;
  const [days, setDays] = useState<Day[]>(saved?.days ?? DAYS);
  const [resolved, setResolved] = useState<Record<string, Verdict>>(
    (saved?.resolved as Record<string, Verdict>) ?? {},
  );
  const [dayIndex, setDayIndex] = useState(1);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [airport, setAirport] = useState(false);
  const [voted, setVoted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [role, setRole] = useState<Role>("Editor");
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [added, setAdded] = useState<{ id: string; title: string } | undefined>();

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  /* The plan survives a refresh. */
  useEffect(() => {
    save({ days, resolved });
  }, [days, resolved]);

  /* The undo strip and the ring on the new card clear themselves, so the plan
     goes back to being just the plan. */
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(undefined), UNDO_MS);
    return () => clearTimeout(t);
  }, [added]);

  const canApprove = role === "Organiser" || role === "Editor";
  const day = days[dayIndex];
  const editing = editingId ? day.items.find((i) => i.id === editingId) : undefined;
  const sheetItemOpen = addOpen || editing !== undefined;

  function toTop() {
    body.current?.scrollTo({ top: 0 });
  }

  function pickDay(i: number) {
    if (i === dayIndex) return;
    clearTimeout(timer.current);
    setDayIndex(i);
    setTab(0);
    setAirport(false);
    setAdded(undefined);
    setLoading(true);
    toTop();
    timer.current = setTimeout(() => setLoading(false), DAY_SWITCH_MS);
  }

  function pickTab(i: number) {
    setTab(i);
    setAirport(false);
    toTop();
  }

  function updateDay(change: (d: Day) => Day) {
    setDays((prev) => prev.map((d, i) => (i === dayIndex ? change(d) : d)));
  }

  /* New items slot into the day by time rather than landing at the end, so
     the plan still reads as a sequence. A clash the group creates is kept on
     the day, not just flashed in the sheet. */
  function addItem(draft: DraftItem) {
    const item = buildItem(draft, !canApprove);
    const clash = clashAt(item.time, day.items);
    const flag = clash
      ? `${item.title} at ${item.time} lands within the hour of ${clash.title} at ${clash.time}, which is booked.`
      : undefined;

    updateDay((d) => ({
      ...d,
      items: [...d.items, item].sort(byTime),
      flags: flag ? [...(d.flags ?? []), flag] : d.flags,
    }));
    setAddOpen(false);
    setTab(0);
    setAdded({ id: item.id, title: item.title });
  }

  function saveEdit(draft: DraftItem) {
    if (!editing) return;
    const next = applyDraft(editing, draft);
    updateDay((d) => ({
      ...d,
      items: d.items.map((i) => (i.id === next.id ? next : i)).sort(byTime),
    }));
    setEditingId(undefined);
    setAdded({ id: next.id, title: next.title });
  }

  function removeItem(id: string) {
    updateDay((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));
    setEditingId(undefined);
    setAdded(undefined);
  }

  function resolve(id: string, verdict: Verdict | undefined) {
    setResolved((prev) => {
      if (verdict === undefined) {
        const { [id]: _drop, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: verdict };
    });
  }

  return (
    <ThemeProvider
      theme={theme}
      className="trip-page"
      style={{ background: theme.bg, color: theme.ink }}
    >
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
              aria-pressed={airport}
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
        {days.map((d, i) => {
          const on = i === dayIndex;
          const flagged = d.conflict !== undefined || (d.flags?.length ?? 0) > 0;
          return (
            <button
              key={d.num}
              type="button"
              aria-pressed={on}
              aria-label={`${d.fullDate}${flagged ? ", has a clash" : ""}`}
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
                style={{ fontFamily: theme.fontMono, color: on ? DAY_META_ON : theme.meta }}
              >
                {d.dow}
              </span>
              <span
                className="trip-page__day-num"
                style={{ fontFamily: theme.fontDisplay, color: on ? theme.bg : theme.ink }}
              >
                {d.num}
              </span>
              {flagged && <span className="trip-page__day-flag" />}
            </button>
          );
        })}
      </div>

      <div
        role="tablist"
        className="trip-page__tabs"
        style={{ background: theme.bg, borderBottomColor: STRIP_LINE }}
      >
        {TABS.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            id={`wf-tab-${i}`}
            aria-controls="wf-tabpanel"
            aria-selected={i === tab && !airport}
            tabIndex={i === tab ? 0 : -1}
            className="trip-page__reset trip-page__tab"
            onClick={() => pickTab(i)}
            onKeyDown={(e) => {
              /* Arrow keys move between tabs, as the tab pattern expects. */
              const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (step === 0) return;
              e.preventDefault();
              const next = (i + step + TABS.length) % TABS.length;
              pickTab(next);
              document.getElementById(`wf-tab-${next}`)?.focus();
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

      <div
        ref={body}
        id="wf-tabpanel"
        role={airport ? undefined : "tabpanel"}
        aria-labelledby={airport ? undefined : `wf-tab-${tab}`}
        tabIndex={0}
        className="trip-page__body"
      >
        {airport ? (
          <AirportPanel day={day} theme={theme} />
        ) : (
          <>
            {tab === 0 && (
              <PlanTab
                day={day}
                highlightId={added?.id}
                loading={loading}
                resolved={resolved}
                canApprove={canApprove}
                onResolve={resolve}
                onEdit={setEditingId}
                onAdd={() => setAddOpen(true)}
                theme={theme}
              />
            )}
            {tab === 1 && <TravelTab theme={theme} />}
            {tab === 2 && <MoneyTab days={days} resolved={resolved} theme={theme} />}
            {tab === 3 && <InfoTab theme={theme} />}
            {tab === 4 && (
              <PeopleTab
                role={role}
                onRoleChange={setRole}
                onOpenSuggestion={(i) => {
                  setDayIndex(i);
                  setTab(0);
                  toTop();
                }}
                theme={theme}
              />
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
          onClick={() => setAddOpen(true)}
          style={{
            color: canApprove ? theme.btnInk : theme.accentInk,
            background: canApprove ? theme.ink : "var(--wf-accent-tint)",
            borderColor: canApprove ? theme.ink : "var(--wf-accent-edge)",
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

      {added && !sheetItemOpen && (
        <div className="undo" role="status" style={{ background: theme.ink, color: theme.btnInk }}>
          <span className="undo__text">
            {canApprove ? "Added" : "Sent to editors"} · {added.title}
          </span>
          <button
            type="button"
            className="trip-page__reset undo__action"
            onClick={() => removeItem(added.id)}
            style={{ fontFamily: theme.fontMono, color: theme.bg }}
          >
            Undo
          </button>
        </div>
      )}

      {sheetItemOpen && (
        <ItemSheet
          day={day}
          editing={editing}
          canApprove={canApprove}
          onSave={editing ? saveEdit : addItem}
          onDelete={editing ? () => removeItem(editing.id) : undefined}
          onClose={() => {
            setAddOpen(false);
            setEditingId(undefined);
          }}
          theme={theme}
        />
      )}

      {sheetOpen && (
        <DecisionsSheet
          voted={voted}
          onVote={() => setVoted((v) => !v)}
          onClose={() => setSheetOpen(false)}
          theme={theme}
        />
      )}
    </ThemeProvider>
  );
}
