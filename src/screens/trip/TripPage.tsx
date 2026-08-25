import { useEffect, useRef, useState, type ComponentType } from "react";
import { ThemeProvider, type Theme } from "../../theme";
import { AirportPanel } from "./AirportPanel";
import { DecisionsSheet } from "./DecisionsSheet";
import { InfoTab } from "./InfoTab";
import { ItemSheet } from "./ItemSheet";
import { MapTab } from "./MapTab";
import { MoneyTab } from "./MoneyTab";
import { MoreSheet } from "./MoreSheet";
import { HamburgerIcon, InfoIcon, MapIcon, PlanIcon, TravelIcon } from "./NavIcons";
import { PeopleTab } from "./PeopleTab";
import { PlanTab } from "./PlanTab";
import { TravelTab } from "./TravelTab";
import type { Verdict } from "./ItemCard";
import type { EventDetails } from "../trip-setup/event-data";
import {
  DAYS,
  DECISION_COUNT,
  DEFAULT_CURRENCY,
  applyDraft,
  buildItem,
  byTime,
  clashAt,
  archive,
  createAccessCode,
  createInvite,
  daysForRange,
  isoDate,
  loadTripContent,
  loadTripMembers,
  loadUserSettings,
  membersFor,
  proposeItem,
  reconcileDays,
  saveCurrency,
  saveNotifyEnabled,
  saveTripContent,
  type Day,
  type DraftItem,
  type PastTrip,
  type Person,
  type Role,
} from "./trip-data";
import { fetchWeather } from "./weather";
import {
  notifyPermission,
  requestNotifyPermission,
  scheduleNotifications,
} from "./notifications";
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

/** What sits in the bottom tablist. Money and People are one tap further,
 *  behind the hamburger in the header — this is what a thumb reaches for
 *  most often. */
type NavEntry =
  | { label: string; short: string; kind: "tab"; tab: number; icon: ComponentType }
  | { label: string; short: string; kind: "map"; icon: ComponentType };

const NAV_TABS: NavEntry[] = [
  { label: "Plan", short: "Plan", kind: "tab", tab: 0, icon: PlanIcon },
  { label: "Stay & travel", short: "Travel", kind: "tab", tab: 1, icon: TravelIcon },
  { label: "Trip map", short: "Map", kind: "map", icon: MapIcon },
  { label: "Info", short: "Info", kind: "tab", tab: 3, icon: InfoIcon },
];

export function TripPage({
  theme,
  event,
  accountId,
  userName,
  savedCount,
  onSaveTrip,
  onOpenPast,
  onOpenTrips,
  onSignOut,
  onBack,
}: {
  theme: Theme;
  event: EventDetails;
  accountId: string;
  userName?: string;
  savedCount: number;
  onSaveTrip: (trip: PastTrip) => void;
  onOpenPast: () => void;
  onOpenTrips: () => void;
  onSignOut: () => void;
  onBack?: () => void;
}) {
  const eventName = event.name;
  const eventDates = event.dates;
  const isExample = event.fromExample === true;
  /* Seeded with just the signed-in account so there's never a blank roster
     before the real membership load (below) lands — the example trip's
     authored cast never changes, so it needs no fetch at all. */
  const [members, setMembers] = useState<Person[]>(() => membersFor(isExample, userName));
  /* Open decisions are part of the authored example; a real trip has none
     until the group can actually vote on anything. */
  const decisionCount = isExample ? DECISION_COUNT : 0;
  /* Where the map looks before anything on the plan has a location of its
     own — otherwise a brand new trip opens on a blank grey square. */
  const mapCenter =
    event.lat !== undefined && event.lng !== undefined
      ? { lat: event.lat, lng: event.lng }
      : undefined;

  /* An event either carries the authored example or starts as one blank day
     per date in its range — either way the day strip agrees with the dates
     in the header, which a fixed Chicago itinerary never did. */
  const seed = useRef(
    event.fromExample ? DAYS : daysForRange(event.startDate, event.endDate),
  ).current;
  /* Starts on the blank/example seed and swaps in whatever's actually saved
     once the fetch below resolves — contentLoading covers that gap so the
     save-effect further down can't fire on the seed before then. */
  const [days, setDays] = useState<Day[]>(seed);
  const [resolved, setResolved] = useState<Record<string, Verdict>>({});
  const [contentLoading, setContentLoading] = useState(true);
  /* The example opens on its second day, where the authored plan is richest.
     A real trip opens on today if the trip is running, otherwise day one. */
  const [dayIndex, setDayIndex] = useState(() => {
    if (event.fromExample) return 1;
    const today = isoDate(new Date());
    const i = seed.findIndex((d) => d.date === today);
    return i === -1 ? 0 : i;
  });
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [airport, setAirport] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [voted, setVoted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [role, setRole] = useState<Role>("Editor");
  /* Real trips: whether the membership fetch above found Organiser/Editor.
     Example trip: whatever the "View as" demo switcher is set to. Either
     way, this is what actually gates every write below. */
  const canApprove = role === "Organiser" || role === "Editor";
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [added, setAdded] = useState<{ id: string; title: string } | undefined>();
  const [weather, setWeather] = useState<Record<string, string>>({});
  const [notifyEnabled, setNotifyEnabled] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const body = useRef<HTMLDivElement>(null);
  const wikiAttempted = useRef<Set<string>>(new Set());

  useEffect(() => () => clearTimeout(timer.current), []);

  /* Loads whatever's actually saved for this trip, fitted to its current
     date range so editing the dates keeps everything planned on days that
     still exist. Runs once per trip (event.id is stable across re-renders —
     App.tsx remounts this component via `key` when the range itself
     changes), so a background refresh never stomps on someone mid-edit. */
  useEffect(() => {
    let cancelled = false;
    setContentLoading(true);
    Promise.all([
      loadTripContent(event.id),
      /* The example trip's cast is fixed and every real trip's creator is
         already showing (seeded above) — no membership fetch needed either
         way until there's an actual roster to ask about. */
      isExample
        ? Promise.resolve(undefined)
        : loadTripMembers(event.id, accountId).catch(() => undefined),
    ])
      .then(([saved, membership]) => {
        if (cancelled) return;
        setDays(saved?.days ? reconcileDays(saved.days, seed) : seed);
        setResolved((saved?.resolved as Record<string, Verdict>) ?? {});
        if (membership) {
          setMembers(membership.members);
          setRole(membership.myRole);
        }
        setContentLoading(false);
      })
      .catch(() => {
        /* offline or a network hiccup — the seed is already showing, so the
           trip still works, it just starts blank until this succeeds. */
        if (!cancelled) setContentLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, accountId, isExample]);

  /* Loads this account's currency and notification preference once — these
     are per-account, not per-trip. */
  useEffect(() => {
    let cancelled = false;
    loadUserSettings(accountId).then((settings) => {
      if (cancelled) return;
      setCurrency(settings.currency);
      setNotifyEnabled(settings.notifyEnabled);
    });
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  /* The plan survives a refresh — but not before the load above has landed
     (firing on the very first render would save the blank/example seed over
     whatever was already there), and not for a Contributor: RLS rejects a
     whole-blob write from anyone but an Organiser/Editor, so their only
     change worth persisting — a new suggestion — goes through proposeItem
     in addItem below instead. */
  useEffect(() => {
    if (contentLoading || !canApprove) return;
    void saveTripContent(event.id, { days, resolved }).catch(() => {
      /* the plan still works locally; it just won't be there on another
         device until the next successful save. */
    });
  }, [event.id, days, resolved, contentLoading, canApprove]);

  /* Items that name a Wikipedia article get their photo resolved once, in
     the background — a wrong or dead article just leaves the fill showing,
     it never breaks the card. Resolved links get saved along with the trip,
     so this only runs once per item, not on every reload. */
  useEffect(() => {
    const pending = days
      .flatMap((d) => d.items)
      .filter((it) => it.wikiTitle && !it.photoUrl && !wikiAttempted.current.has(it.id));
    if (pending.length === 0) return;
    pending.forEach((it) => wikiAttempted.current.add(it.id));

    let cancelled = false;
    Promise.all(
      pending.map(async (it) => {
        try {
          const res = await fetch(
            `/.netlify/functions/wiki-photo?title=${encodeURIComponent(it.wikiTitle as string)}`,
          );
          const data = (await res.json()) as { image?: string };
          return { id: it.id, image: data.image };
        } catch {
          return { id: it.id, image: undefined };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const found = new Map(
        results.filter((r): r is { id: string; image: string } => r.image !== undefined).map((r) => [r.id, r.image]),
      );
      if (found.size === 0) return;
      setDays((prev) =>
        prev.map((d) => ({
          ...d,
          items: d.items.map((it) => (found.has(it.id) ? { ...it, photoUrl: found.get(it.id) } : it)),
        })),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [days]);

  /* A live forecast for whichever of the trip's dates fall in Open-Meteo's
     window. The dates come from the event, which doesn't change while the
     trip is open, so this runs once rather than on every item edit. */
  useEffect(() => {
    let cancelled = false;
    const coords =
      event.lat !== undefined && event.lng !== undefined
        ? { lat: event.lat, lng: event.lng }
        : undefined;
    fetchWeather(seed, coords)
      .then((byDate) => {
        if (!cancelled) setWeather(byDate);
      })
      .catch(() => {
        /* offline, no geocoded location, or dates outside the forecast
           window — the day header simply shows no weather. */
      });
    return () => {
      cancelled = true;
    };
  }, [event.lat, event.lng, seed]);

  /* Re-schedules from scratch whenever the plan changes (an item's added,
     approved or declined) or the toggle flips — only fires anything while
     permission is already granted and the toggle is on, and only while
     this tab stays open. */
  useEffect(() => {
    if (!notifyEnabled) return;
    return scheduleNotifications(days, resolved);
  }, [notifyEnabled, days, resolved]);

  async function toggleNotify() {
    if (notifyEnabled) {
      setNotifyEnabled(false);
      void saveNotifyEnabled(accountId, false).catch(() => {});
      return;
    }
    const permission =
      notifyPermission() === "granted" ? "granted" : await requestNotifyPermission();
    if (permission !== "granted") return;
    setNotifyEnabled(true);
    void saveNotifyEnabled(accountId, true).catch(() => {});
  }

  /* The undo strip and the ring on the new card clear themselves, so the plan
     goes back to being just the plan. */
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(undefined), UNDO_MS);
    return () => clearTimeout(t);
  }, [added]);

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
    setMapOpen(false);
    setAdded(undefined);
    setLoading(true);
    toTop();
    timer.current = setTimeout(() => setLoading(false), DAY_SWITCH_MS);
  }

  function pickTab(i: number) {
    setTab(i);
    setAirport(false);
    setMapOpen(false);
    toTop();
  }

  function openFromMore(label: string) {
    setTab(label === "Money" ? 2 : 4);
    setAirport(false);
    setMapOpen(false);
    setMoreOpen(false);
    toTop();
  }

  function setMapOpenTab() {
    setMapOpen(true);
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
    const item = buildItem(draft, !canApprove, {
      currency,
      people: Math.max(members.length, 1),
    });
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

    /* A Contributor's write can't go through the generic autosave above —
       RLS only lets an Organiser/Editor touch the whole blob — so their one
       allowed action, proposing something new, is persisted here directly. */
    if (!canApprove && !isExample) {
      void proposeItem(event.id, day.date, item).catch(() => {
        /* still shows locally for this session; just won't survive a
           reload or reach anyone else until retried. */
      });
    }
  }

  function saveEdit(draft: DraftItem) {
    if (!editing) return;
    const next = applyDraft(editing, draft, currency);
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

  function reorderItem(id: string, newTime: string) {
    updateDay((d) => ({
      ...d,
      items: d.items.map((i) => (i.id === id ? { ...i, time: newTime } : i)).sort(byTime),
    }));
  }

  /* Organiser-only per RLS on trip_invites — PeopleTab only shows the
     button that calls this to an Organiser, but the real gate is the
     database, not the UI. */
  async function createInviteLink(inviteRole: "Editor" | "Contributor"): Promise<string> {
    const token = await createInvite(event.id, inviteRole);
    const { origin, pathname } = window.location;
    return `${origin}${pathname}#invite=${token}`;
  }

  /** For a client who won't be creating an account — the link signs them
     into an anonymous session automatically when opened. */
  async function createClientLink(codeRole: "Editor" | "Contributor"): Promise<string> {
    const code = await createAccessCode(event.id, codeRole);
    const { origin, pathname } = window.location;
    return `${origin}${pathname}#access=${code}`;
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
          <div className="trip-page__head-left">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              className="trip-page__reset trip-page__hamburger"
              onClick={() => setMoreOpen(true)}
            >
              <HamburgerIcon />
              <span className="trip-page__visually-hidden">More — Money and People</span>
            </button>
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
          </div>
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
              {eventDates}
            </div>
            <div className="trip-page__name" style={{ fontFamily: theme.fontDisplay }}>
              {eventName}
            </div>
          </div>
          <div className="trip-page__avatars">
            {members.map((member) => (
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
        className="trip-page__actions"
        style={{ background: theme.bg, borderBottomColor: STRIP_LINE }}
      >
        <button
          type="button"
          className="trip-page__reset trip-page__add"
          onClick={() => setAddOpen(true)}
          style={{
            color: canApprove ? theme.bg : theme.accentInk,
            background: canApprove ? theme.ink : "var(--wf-accent-tint)",
            borderColor: canApprove ? theme.ink : "var(--wf-accent-edge)",
          }}
        >
          {canApprove ? "Add to this day" : "Suggest something"}
        </button>
        {decisionCount > 0 && (
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
              {decisionCount}
            </span>
          </button>
        )}
      </div>

      <div
        ref={body}
        id="wf-tabpanel"
        role={airport || mapOpen ? undefined : "tabpanel"}
        aria-labelledby={airport || mapOpen ? undefined : `wf-tab-${tab}`}
        tabIndex={0}
        className="trip-page__body"
      >
        {airport ? (
          <AirportPanel day={day} isExample={isExample} theme={theme} />
        ) : mapOpen ? (
          <MapTab days={days} center={mapCenter} theme={theme} />
        ) : (
          <>
            {tab === 0 && (
              <PlanTab
                day={weather[day.num] ? { ...day, weather: weather[day.num] } : day}
                highlightId={added?.id}
                loading={loading || contentLoading}
                resolved={resolved}
                canApprove={canApprove}
                onResolve={resolve}
                onEdit={setEditingId}
                onAdd={() => setAddOpen(true)}
                onOpenMap={setMapOpenTab}
                onReorder={reorderItem}
                center={mapCenter}
                currency={currency}
                theme={theme}
              />
            )}
            {tab === 1 && <TravelTab isExample={isExample} days={days} theme={theme} />}
            {tab === 2 && (
              <MoneyTab
                days={days}
                resolved={resolved}
                currency={currency}
                onCurrencyChange={(code) => {
                  setCurrency(code);
                  void saveCurrency(accountId, code).catch(() => {});
                }}
                isExample={isExample}
                people={Math.max(members.length, 1)}
                theme={theme}
              />
            )}
            {tab === 3 && (
              <InfoTab
                savedCount={savedCount}
                onSaveTrip={() => onSaveTrip(archive(eventName, eventDates, days, resolved))}
                onOpenPast={onOpenPast}
                eventName={eventName}
                days={days}
                resolved={resolved}
                isExample={isExample}
                theme={theme}
              />
            )}
            {tab === 4 && (
              <PeopleTab
                role={role}
                onRoleChange={setRole}
                onOpenSuggestion={(i) => {
                  setDayIndex(i);
                  setTab(0);
                  setMapOpen(false);
                  toTop();
                }}
                members={members}
                pendingSuggestions={days.flatMap((d, i) =>
                  d.items
                    .filter((item) => item.suggested && resolved[item.id] === undefined)
                    .map((item) => ({
                      title: item.title,
                      meta: `${item.suggestedBy ?? "A trip member"} · ${item.time}`,
                      note: item.note,
                      day: i,
                    })),
                )}
                onCreateInvite={createInviteLink}
                onCreateAccessCode={createClientLink}
                isExample={isExample}
                theme={theme}
              />
            )}
          </>
        )}
      </div>

      {/* The menu sits under the thumb; the day's actions sit up by the day.
          Money and People live behind the hamburger in the header — Plan,
          Travel, Map and Info are what a thumb needs most often. */}
      <div
        role="tablist"
        className="trip-page__nav"
        style={{ background: theme.bg, borderTopColor: STRIP_LINE }}
      >
        {NAV_TABS.map((entry, i) => {
          const on = entry.kind === "map" ? mapOpen && !airport : tab === entry.tab && !airport && !mapOpen;
          const Icon = entry.icon;
          return (
            <button
              key={entry.label}
              type="button"
              role="tab"
              id={`wf-tab-nav-${i}`}
              aria-controls="wf-tabpanel"
              aria-selected={on}
              aria-label={entry.label}
              tabIndex={on ? 0 : -1}
              className="trip-page__reset trip-page__nav-item"
              onClick={() => (entry.kind === "map" ? setMapOpenTab() : pickTab(entry.tab))}
              onKeyDown={(e) => {
                /* Arrow keys move between tabs, as the tab pattern expects. */
                const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                if (step === 0) return;
                e.preventDefault();
                const next = (i + step + NAV_TABS.length) % NAV_TABS.length;
                const nextEntry = NAV_TABS[next];
                if (nextEntry.kind === "map") setMapOpenTab();
                else pickTab(nextEntry.tab);
                document.getElementById(`wf-tab-nav-${next}`)?.focus();
              }}
              style={{ color: on ? theme.ink : theme.meta }}
            >
              <span
                className="trip-page__nav-mark"
                style={{ background: theme.accent, opacity: on ? 1 : 0 }}
              />
              <Icon />
              {entry.short}
            </button>
          );
        })}
      </div>

      {added && !sheetItemOpen && (
        <div className="undo" role="status" style={{ background: theme.ink, color: theme.bg }}>
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
          currency={currency}
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

      {moreOpen && (
        <MoreSheet
          onOpen={openFromMore}
          onClose={() => setMoreOpen(false)}
          notifyEnabled={notifyEnabled}
          notifySupported={notifyPermission() !== "unsupported"}
          notifyBlocked={notifyPermission() === "denied"}
          onToggleNotify={toggleNotify}
          userName={userName}
          onOpenTrips={() => {
            setMoreOpen(false);
            onOpenTrips();
          }}
          onSignOut={onSignOut}
          theme={theme}
        />
      )}
    </ThemeProvider>
  );
}
