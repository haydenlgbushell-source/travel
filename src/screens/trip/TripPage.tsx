import { useEffect, useRef, useState, type ComponentType } from "react";
import { ThemeProvider, Wordmark, type Theme } from "../../theme";
import { brandTheme, loadTripBranding, type AgencyBranding } from "../agency/branding";
import { AirportPanel } from "./AirportPanel";
import { DecisionsSheet } from "./DecisionsSheet";
import { InfoTab } from "./InfoTab";
import { ItemDetail } from "./ItemDetail";
import { ItemSheet } from "./ItemSheet";
import { ActivityPickerSheet } from "./ActivityPickerSheet";
import type { AgencyActivity } from "../agency/activity-data";
import { MapTab } from "./MapTab";
import { MoneyTab } from "./MoneyTab";
import { MoreSheet } from "./MoreSheet";
import {
  HamburgerIcon,
  InfoIcon,
  MapIcon,
  MoneyIcon,
  PeopleIcon,
  PlanIcon,
  SearchIcon,
  TravelIcon,
} from "./NavIcons";
import { PeopleTab } from "./PeopleTab";
import { PlanTab } from "./PlanTab";
import { SearchSheet } from "./SearchSheet";
import { TravelTab } from "./TravelTab";
import type { Verdict } from "./ItemCard";
import type { EventDetails } from "../trip-setup/event-data";
import {
  DAYS,
  DECISION_COUNT,
  INBOX,
  DEFAULT_CURRENCY,
  applyDraft,
  buildItem,
  deleteItemDocument,
  deleteItemPhotoIfOwned,
  byTime,
  clashAt,
  archive,
  createAccessCode,
  createInvite,
  daysForRange,
  fromBaseAmount,
  isoDate,
  suggestSlots,
  loadTripContent,
  loadTripMembers,
  loadUserSettings,
  membersFor,
  proposeItem,
  reconcileDays,
  saveCurrency,
  saveNotifyEnabled,
  saveTripContent,
  StaleRevisionError,
  type Day,
  type DraftItem,
  type PastTrip,
  type Person,
  type Role,
} from "./trip-data";
import { useIsDesktop } from "../../lib/useIsDesktop";
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

/** A swipe has to travel this far, and be mostly sideways rather than a
 *  scroll that wandered, before it counts as "change the day". */
const SWIPE_MIN_PX = 60;
const SWIPE_MAX_SLOPE = 0.5;

/** Bumped whenever the Travel tab changes enough to be worth a "new" dot —
 *  a fresh string re-shows the badge to everyone, since the old key just
 *  becomes an unread localStorage entry nobody looks at again. */
const TRAVEL_CARD_BADGE_KEY = "wf-seen-travel-card-2026-08";

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

/* On a desktop the tab bar is a sidebar with room to spare, so the two tabs
   a phone hides behind the menu sit out in the open with the rest. The menu
   still carries them, along with notifications and the account. */
const DESK_NAV: NavEntry[] = [
  ...NAV_TABS,
  { label: "Money", short: "Money", kind: "tab", tab: 2, icon: MoneyIcon },
  { label: "People", short: "People", kind: "tab", tab: 4, icon: PeopleIcon },
];

/** A blank slate for a template-built item — same shape ItemSheet's own
 *  EMPTY starts from, needed here too since applyTemplate builds items
 *  without ever opening that sheet. */
const EMPTY_DRAFT: DraftItem = {
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

/** What's shared between an agency's saved activity and a trip item's own
 *  draft form — everything but the time, which only makes sense once it's
 *  actually going onto a specific day. `costEach` moves from the library's
 *  fixed base currency into whatever the trip is showing. */
function templateFromActivity(activity: AgencyActivity, currency: string): Partial<DraftItem> {
  return {
    kind: activity.kind,
    title: activity.title,
    place: activity.place ?? "",
    placeAddress: activity.place,
    lat: activity.lat,
    lng: activity.lng,
    note: activity.note ?? "",
    costEach: activity.costEach !== undefined ? fromBaseAmount(activity.costEach, currency) : "",
    photoUrl: activity.photoUrl ?? "",
  };
}

export function TripPage({
  theme: baseTheme,
  event,
  accountId,
  userName,
  savedCount,
  libraryAgencyId,
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
  /** Set only when the signed-in account belongs to this trip's own agency —
   *  gates the "From library" add option, an internal working tool that has
   *  no business being visible to the client on their own trip. */
  libraryAgencyId?: string;
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
  const [members, setMembers] = useState<Person[]>(() => membersFor(isExample, userName, accountId));
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
  /* What save_trip_content must be told the trip is currently at for a save
     to succeed — bumped after every successful save, reset on reload. A
     trip with no saved content yet starts at 1, matching what the RPC
     expects for its first-ever insert. */
  const contentRevision = useRef(1);
  /* Set when a save comes back rejected because someone else's save landed
     first — autosave stops firing (see the effect below) until this is
     cleared by reloading, so the local, now-behind copy can't keep trying
     to overwrite the newer one. */
  const [contentConflict, setContentConflict] = useState(false);
  /* The example opens on its second day, where the authored plan is richest.
     A real trip opens on today if the trip is running, otherwise day one. */
  const [dayIndex, setDayIndex] = useState(() => {
    if (event.fromExample) return 1;
    const today = isoDate(new Date());
    const i = seed.findIndex((d) => d.date === today);
    return i === -1 ? 0 : i;
  });
  const [tab, setTab] = useState(0);
  /* A small dot on the Travel tab, marking the redrawn leg card until
     someone actually opens the tab and sees it — cleared per browser via
     localStorage rather than per account, since there's no server-side
     "seen" state to key this against. Fails open (no badge) if storage
     is blocked, rather than nagging forever. */
  const [travelCardSeen, setTravelCardSeen] = useState(() => {
    try {
      return localStorage.getItem(TRAVEL_CARD_BADGE_KEY) === "1";
    } catch {
      return true;
    }
  });
  const [loading, setLoading] = useState(false);
  const [airport, setAirport] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [voted, setVoted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [role, setRole] = useState<Role>("Editor");
  /* Real trips: whether the membership fetch above found Organiser/Editor.
     Example trip: whatever the "View as" demo switcher is set to. Either
     way, this is what actually gates every write below. */
  const canApprove = role === "Organiser" || role === "Editor";
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [addOpen, setAddOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  /* Set for the one add that follows picking something from the library —
     ItemSheet reads it once on open to pre-fill, same as editing does. */
  const [addTemplate, setAddTemplate] = useState<Partial<DraftItem>>();
  const [editingId, setEditingId] = useState<string | undefined>();
  /* The read-only view a tap on the card opens — available to every role,
     unlike editingId which only an Organiser or Editor ever reaches. */
  const [detailId, setDetailId] = useState<string | undefined>();
  /* `wasAdd` splits two things this used to conflate: highlighting the
     item that was just touched (fine after an edit too) and the "Added ·
     Undo" toast, whose Undo deletes the item outright — right for
     reversing a fresh add, wrong for "undo" on an edit, which would
     silently destroy something that already existed. */
  const [added, setAdded] = useState<{ id: string; title: string; wasAdd: boolean } | undefined>();
  const [weather, setWeather] = useState<Record<string, string>>({});
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  /* Drives what the tab bar renders, not just how it looks — see DESK_NAV. */
  const desktop = useIsDesktop();
  /* An agency trip carries that agency's logo and colours. Everyone on the
     trip sees them — including a client on an access code, who has no
     agency relationship of their own and reads this through trip_branding.
     A personal trip never asks. */
  const [branding, setBranding] = useState<AgencyBranding>();
  const theme = brandTheme(baseTheme, branding);
  /* The header's brand slot falls back to the *style's* own name
     ("Postcard", "Meridian") when nobody has set anything else — which
     means every unbranded trip showed the look it was drawn in as if that
     were the trip's own identity. An agency's logo or chosen name still
     wins, since that is real branding; short of that, what belongs in a
     trip's own header is the trip, not the theme. */
  const headerBrand: Theme =
    theme.logoUrl || branding?.wordmark?.trim() ? theme : { ...theme, wordmark: eventName };

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const body = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | undefined>(undefined);
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
        contentRevision.current = saved?.revision ?? 1;
        setContentConflict(false);
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

  useEffect(() => {
    if (!event.agencyId) {
      setBranding(undefined);
      return;
    }
    let cancelled = false;
    loadTripBranding(event.id).then((b) => {
      if (!cancelled) setBranding(b);
    });
    return () => {
      cancelled = true;
    };
  }, [event.id, event.agencyId]);

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
    /* A conflict means this copy is known to be behind — saving again with
       the same stale revision would just fail again, so autosave stays off
       until reloadAfterConflict below brings it back up to date. */
    if (contentLoading || !canApprove || contentConflict) return;
    void saveTripContent(event.id, { days, resolved, revision: contentRevision.current })
      .then((newRevision) => {
        contentRevision.current = newRevision;
      })
      .catch((err) => {
        if (err instanceof StaleRevisionError) {
          setContentConflict(true);
          return;
        }
        /* Any other failure: the plan still works locally; it just won't be
           there on another device until the next successful save. */
      });
  }, [event.id, days, resolved, contentLoading, canApprove, contentConflict]);

  /* The explicit way out of a conflict — replaces the local plan with
     whatever's actually saved and picks autosave back up. There's no merge:
     the two copies could differ anywhere, so the only honest move is to
     show what's really there rather than guess how to combine them. */
  function reloadAfterConflict() {
    setContentLoading(true);
    loadTripContent(event.id)
      .then((saved) => {
        setDays(saved?.days ? reconcileDays(saved.days, seed) : seed);
        setResolved((saved?.resolved as Record<string, Verdict>) ?? {});
        contentRevision.current = saved?.revision ?? 1;
        setContentConflict(false);
        setContentLoading(false);
      })
      .catch(() => setContentLoading(false));
  }

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

  /* A trip whose dates don't make a range produces no days at all. That used
     to fall straight through to `days[dayIndex].items` and white-screen —
     and because the trip id is saved as the one to reopen, every later visit
     hit the same crash with no way back out. Say what's wrong and offer the
     way out instead. */
  const day = days[dayIndex] as Day | undefined;
  if (!day) {
    return (
      <ThemeProvider
        theme={theme}
        className="trip-page"
        style={{ background: theme.bg, color: theme.ink }}
      >
        <div className="trip-page__stack" style={{ padding: "40px 20px" }}>
          <div className="empty-day" style={{ borderColor: theme.line, color: theme.body }}>
            <span
              className="empty-day__title"
              style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
            >
              These dates don't make a trip
            </span>
            <span className="empty-day__note">
              {eventName} ends before it starts ({eventDates}), so there are no days
              to plan. Edit the trip and set the end date after the start date.
            </span>
            {onBack && (
              <button
                type="button"
                className="trip-page__reset add-sheet__more"
                onClick={onBack}
                style={{ fontFamily: theme.fontMono, color: theme.accent }}
              >
                Back to your trips →
              </button>
            )}
          </div>
        </div>
      </ThemeProvider>
    );
  }
  /* Narrowed past the guard above, for the closures below — a function body
     doesn't inherit the narrowing from an early return. */
  const activeDay: Day = day;
  const navEntries = desktop ? DESK_NAV : NAV_TABS;
  /* Which nav button is current, so the panel below can name it. Falls back
     to the first entry when the open tab has no button at this width —
     Money and People on a phone, reached through the menu instead. */
  const selectedNavIndex = Math.max(
    navEntries.findIndex((entry) =>
      entry.kind === "map" ? mapOpen : !mapOpen && entry.tab === tab,
    ),
    0,
  );
  const editing = editingId ? day.items.find((i) => i.id === editingId) : undefined;
  const sheetItemOpen = addOpen || editing !== undefined;
  const detail = detailId ? day.items.find((i) => i.id === detailId) : undefined;

  /* Computed once so the People tab's list and the More sheet's badge can
     never disagree — the badge used to read the example's hardcoded INBOX
     regardless of which trip was open. */
  const pendingSuggestions = days.flatMap((d, i) =>
    d.items
      .filter((item) => item.suggested && resolved[item.id] === undefined)
      .map((item) => ({
        id: item.id,
        title: item.title,
        meta: `${item.suggestedBy ?? "A trip member"} · ${item.time}`,
        note: item.note,
        day: i,
      })),
  );
  const pendingCount = isExample ? INBOX.length : pendingSuggestions.length;

  function toTop() {
    body.current?.scrollTo({ top: 0 });
  }

  /* A search result names a day and an item — land on that day's Plan tab
     with the item's own detail open, same as tapping a suggestion in the
     People tab's inbox already does, rather than just switching days and
     leaving whoever searched to spot the item among the rest themselves. */
  function jumpToItem(targetDayIndex: number, itemId: string) {
    setSearchOpen(false);
    setDayIndex(targetDayIndex);
    setTab(0);
    setAirport(false);
    setMapOpen(false);
    setDetailId(itemId);
    toTop();
  }

  function pickDay(i: number) {
    if (i === dayIndex) return;
    setDayIndex(i);
    /* On the map, the day strip's job is exactly to narrow which day's pins
       show — same chips Plan already uses, so there's no second day picker
       of the map's own any more. Switching days here should re-filter the
       map in place, not bounce back out to Plan the way it does everywhere
       else the strip is tapped. */
    if (mapOpen) return;
    clearTimeout(timer.current);
    setTab(0);
    setAirport(false);
    setAdded(undefined);
    setLoading(true);
    toTop();
    timer.current = setTimeout(() => setLoading(false), DAY_SWITCH_MS);
  }

  /* Swipe left/right on the day's own content to move a day, mirroring the
     day strip's chips without making someone reach for them. Only live on
     the Plan tab — Money, People and the rest describe the whole trip, not
     one day, so a sideways swipe there has nothing to change. */
  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    swipeStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const start = swipeStart.current;
    swipeStart.current = undefined;
    if (!start || tab !== 0 || airport || mapOpen) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dy) > Math.abs(dx) * SWIPE_MAX_SLOPE) return;

    if (dx < 0 && dayIndex < days.length - 1) pickDay(dayIndex + 1);
    else if (dx > 0 && dayIndex > 0) pickDay(dayIndex - 1);
  }

  function pickTab(i: number) {
    setTab(i);
    setAirport(false);
    setMapOpen(false);
    toTop();
    if (i === 1 && !travelCardSeen) {
      setTravelCardSeen(true);
      try {
        localStorage.setItem(TRAVEL_CARD_BADGE_KEY, "1");
      } catch {
        /* Best-effort — the badge just reappears next visit. */
      }
    }
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

  /** What's left is picking a time — everything else about the activity
     carries straight over into the sheet's fields. `costEach` moves from the
     library's fixed base currency into whatever the trip is showing. */
  function pickFromLibrary(activity: AgencyActivity) {
    setAddTemplate(templateFromActivity(activity, currency));
    setLibraryOpen(false);
    setAddOpen(true);
  }

  /** A whole template's activities land on the active day in one go, each
     given the next open slot in turn rather than all piling onto the same
     time — the same suggestSlots the sheet itself offers, just walked
     forward once per item so each new addition sees the ones before it. */
  function applyTemplate(activitiesToAdd: AgencyActivity[]) {
    let priorItems = activeDay.items;
    const built = activitiesToAdd.map((activity) => {
      const time = suggestSlots(priorItems)[0]?.time ?? "09:00";
      const item = buildItem(
        { ...EMPTY_DRAFT, ...templateFromActivity(activity, currency), time },
        !canApprove,
        { currency, people: Math.max(members.length, 1) },
      );
      priorItems = [...priorItems, item];
      return item;
    });

    updateDay((d) => ({ ...d, items: [...d.items, ...built].sort(byTime) }));
    setLibraryOpen(false);
    setTab(0);

    if (!canApprove && !isExample) {
      for (const item of built) {
        void proposeItem(event.id, activeDay.date, item).catch(() => {});
      }
    }
  }

  /* New items slot into the day by time rather than landing at the end, so
     the plan still reads as a sequence. A clash the group creates is kept on
     the day, not just flashed in the sheet. The sheet's own day picker can
     name a day other than the one that was open — when it does, the item
     lands there instead and the view follows it, same as tapping that day's
     chip would. */
  function addItem(draft: DraftItem, date: string) {
    const item = buildItem(draft, !canApprove, {
      currency,
      people: Math.max(members.length, 1),
    });
    const targetIndex = days.findIndex((d) => d.date === date);
    const target = targetIndex === -1 ? activeDay : days[targetIndex];
    const clash = clashAt(item.time, target.items);
    const flag = clash
      ? `${item.title} at ${item.time} lands within the hour of ${clash.title} at ${clash.time}, which is booked.`
      : undefined;

    if (targetIndex === -1 || targetIndex === dayIndex) {
      updateDay((d) => ({
        ...d,
        items: [...d.items, item].sort(byTime),
        flags: flag ? [...(d.flags ?? []), flag] : d.flags,
      }));
    } else {
      setDays((prev) =>
        prev.map((d, i) =>
          i === targetIndex
            ? {
                ...d,
                items: [...d.items, item].sort(byTime),
                flags: flag ? [...(d.flags ?? []), flag] : d.flags,
              }
            : d,
        ),
      );
      setDayIndex(targetIndex);
      toTop();
    }
    setAddOpen(false);
    setAddTemplate(undefined);
    setTab(0);
    setAdded({ id: item.id, title: item.title, wasAdd: true });

    /* A Contributor's write can't go through the generic autosave above —
       RLS only lets an Organiser/Editor touch the whole blob — so their one
       allowed action, proposing something new, is persisted here directly. */
    if (!canApprove && !isExample) {
      void proposeItem(event.id, target.date, item).catch(() => {
        /* still shows locally for this session; just won't survive a
           reload or reach anyone else until retried. */
      });
    }
  }

  /* Moving an item to a different day removes it from this one and appends
     it to the target's, rather than teaching updateDay to reach across days
     for what is otherwise a same-day edit. */
  function saveEdit(draft: DraftItem, date: string) {
    if (!editing) return;
    const next = applyDraft(editing, draft, currency);

    if (date === activeDay.date) {
      updateDay((d) => ({
        ...d,
        items: d.items.map((i) => (i.id === next.id ? next : i)).sort(byTime),
      }));
    } else {
      const targetIndex = days.findIndex((d) => d.date === date);
      if (targetIndex === -1) {
        updateDay((d) => ({
          ...d,
          items: d.items.map((i) => (i.id === next.id ? next : i)).sort(byTime),
        }));
      } else {
        const fromIndex = dayIndex;
        setDays((prev) =>
          prev.map((d, i) => {
            if (i === fromIndex) return { ...d, items: d.items.filter((it) => it.id !== next.id) };
            if (i === targetIndex) return { ...d, items: [...d.items, next].sort(byTime) };
            return d;
          }),
        );
        setDayIndex(targetIndex);
        toTop();
      }
    }
    setEditingId(undefined);
    setAdded({ id: next.id, title: next.title, wasAdd: false });
  }

  function removeItem(id: string) {
    /* Cleans up the item's own upload, not one it merely linked to — a
       pasted website's photo was never this app's object to delete. */
    const removed = activeDay.items.find((i) => i.id === id);
    updateDay((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));
    setEditingId(undefined);
    setAdded(undefined);
    if (removed?.photoUrl) void deleteItemPhotoIfOwned(removed.photoUrl);
    removed?.documents?.forEach((doc) => void deleteItemDocument(doc.url));
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
      className="trip-page trip-page--app"
      style={{ background: theme.bg, color: theme.ink }}
    >
      {contentConflict && (
        <div
          role="alert"
          className="trip-page__banner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "10px 14px",
            background: "oklch(0.5 0.16 25)",
            color: "#fff",
            fontFamily: theme.fontMono,
            fontSize: "12px",
          }}
        >
          <span>This trip changed on another device — your latest edits here haven't saved.</span>
          <button
            type="button"
            onClick={reloadAfterConflict}
            style={{
              background: "none",
              border: "1px solid #fff",
              borderRadius: "6px",
              padding: "4px 10px",
              color: "inherit",
              font: "inherit",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Reload latest
          </button>
        </div>
      )}
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
              <Wordmark theme={headerBrand} />
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
              className="trip-page__reset trip-page__hamburger"
              aria-label="Search this trip"
              onClick={() => setSearchOpen(true)}
              style={{ color: theme.headInk }}
            >
              <SearchIcon />
            </button>
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

        {/* The wordmark up in the head row already says the trip's name —
            repeating it here in 30px type just to sit above the avatars was
            the same information twice. This row is just the dates and who's
            on the trip now, so the itinerary below starts that much sooner. */}
        <div className="trip-page__head-main trip-page__head-main--compact">
          <div
            className="trip-page__dates"
            style={{ fontFamily: theme.fontMono, color: theme.headMeta }}
          >
            {eventDates}
          </div>
          <div className="trip-page__avatars">
            {members.map((member) => (
              <div
                key={member.id}
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
              key={d.date}
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
        {libraryAgencyId && canApprove && (
          <button
            type="button"
            className="trip-page__reset trip-page__decisions"
            onClick={() => setLibraryOpen(true)}
            style={{
              fontFamily: theme.fontMono,
              color: theme.body,
              background: "transparent",
              borderColor: theme.line,
            }}
          >
            From library
          </button>
        )}
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
        /* Labelled by the tab that is actually selected. This used to name
           `wf-tab-${tab}` while the buttons carried `wf-tab-nav-${i}` — two
           different schemes, so the panel was labelled by nothing at all. */
        aria-labelledby={
          airport || mapOpen ? undefined : `wf-tab-nav-${selectedNavIndex}`
        }
        tabIndex={0}
        className="trip-page__body"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {airport ? (
          <AirportPanel day={day} resolved={resolved} isExample={isExample} theme={theme} />
        ) : mapOpen ? (
          <MapTab days={days} activeDay={day} center={mapCenter} theme={theme} />
        ) : (
          <>
            {tab === 0 && (
              <PlanTab
                /* Keyed by the ISO date fetchWeather actually returns —
                   looking it up by day.num ("14") never matched, so the live
                   forecast never once reached the day header. */
                day={weather[day.date] ? { ...day, weather: weather[day.date] } : day}
                highlightId={added?.id}
                loading={loading || contentLoading}
                resolved={resolved}
                canApprove={canApprove}
                onResolve={resolve}
                onOpen={setDetailId}
                onAdd={() => setAddOpen(true)}
                onReorder={reorderItem}
                currency={currency}
                theme={theme}
              />
            )}
            {tab === 1 && <TravelTab days={days} theme={theme} />}
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
                destination={event.destination}
                country={event.country}
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
                pendingSuggestions={pendingSuggestions}
                onCreateInvite={createInviteLink}
                onCreateAccessCode={createClientLink}
                tripId={event.id}
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
        {navEntries.map((entry, i) => {
          const on = entry.kind === "map" ? mapOpen && !airport : tab === entry.tab && !airport && !mapOpen;
          const Icon = entry.icon;
          const isNew = entry.kind === "tab" && entry.tab === 1 && !travelCardSeen;
          return (
            <button
              key={entry.label}
              type="button"
              role="tab"
              id={`wf-tab-nav-${i}`}
              aria-controls="wf-tabpanel"
              aria-selected={on}
              aria-label={isNew ? `${entry.label} — new` : entry.label}
              tabIndex={on ? 0 : -1}
              className="trip-page__reset trip-page__nav-item"
              onClick={() => (entry.kind === "map" ? setMapOpenTab() : pickTab(entry.tab))}
              onKeyDown={(e) => {
                /* Arrow keys move between tabs, as the tab pattern expects. */
                const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                if (step === 0) return;
                e.preventDefault();
                const next = (i + step + navEntries.length) % navEntries.length;
                const nextEntry = navEntries[next];
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
              <span className="trip-page__nav-icon">
                <Icon />
                {isNew && (
                  <span
                    className="trip-page__nav-badge"
                    style={{ background: theme.accent, borderColor: theme.bg }}
                    aria-hidden="true"
                  />
                )}
              </span>
              {entry.short}
            </button>
          );
        })}
      </div>

      {added?.wasAdd && !sheetItemOpen && !detail && (
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
          days={days}
          tripId={event.id}
          editing={editing}
          template={editing ? undefined : addTemplate}
          canApprove={canApprove}
          currency={currency}
          onCurrencyChange={(code) => {
            setCurrency(code);
            void saveCurrency(accountId, code).catch(() => {});
          }}
          onSave={editing ? saveEdit : addItem}
          onDelete={editing ? () => removeItem(editing.id) : undefined}
          onClose={() => {
            setAddOpen(false);
            setAddTemplate(undefined);
            setEditingId(undefined);
          }}
          theme={theme}
        />
      )}

      {detail && (
        <ItemDetail
          item={detail}
          canApprove={canApprove}
          currency={currency}
          onEdit={() => {
            setDetailId(undefined);
            setEditingId(detail.id);
          }}
          onClose={() => setDetailId(undefined)}
          theme={theme}
        />
      )}

      {libraryOpen && libraryAgencyId && (
        <ActivityPickerSheet
          agencyId={libraryAgencyId}
          onPick={pickFromLibrary}
          onApplyTemplate={applyTemplate}
          onClose={() => setLibraryOpen(false)}
          theme={theme}
        />
      )}

      {searchOpen && (
        <SearchSheet days={days} onJump={jumpToItem} onClose={() => setSearchOpen(false)} theme={theme} />
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
          pendingCount={pendingCount}
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
