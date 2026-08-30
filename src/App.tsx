import { useEffect, useRef, useState } from "react";
import { DEFAULT_THEME_KEY, getTheme } from "./theme";
import { TripSetupPage } from "./screens/trip-setup/TripSetupPage";
import { TripsScreen } from "./screens/trip-setup/TripsScreen";
import {
  deleteEventRow,
  loadCurrentEventId,
  loadEvents,
  saveCurrentEventId,
  upsertEvent as upsertEventRow,
  type EventDetails,
} from "./screens/trip-setup/event-data";
import { TripPage } from "./screens/trip/TripPage";
import { PastTripScreen } from "./screens/trip/PastTripScreen";
import { PastTripsScreen } from "./screens/trip/PastTripsScreen";
import { SharedListScreen } from "./screens/trip/SharedListScreen";
import { AuthPage } from "./screens/auth/AuthPage";
import { NamePage } from "./screens/auth/NamePage";
import { InviteAcceptScreen } from "./screens/auth/InviteAcceptScreen";
import { AccessCodeScreen } from "./screens/auth/AccessCodeScreen";
import { AgencyInviteAcceptScreen } from "./screens/auth/AgencyInviteAcceptScreen";
import { clearSession, onAccountChange, setAccountName, type Account } from "./screens/auth/auth-data";
import {
  decodeShare,
  deletePastTrip,
  insertPastTrip,
  loadPastTrips,
  type PastTrip,
  type SharedList,
} from "./screens/trip/trip-data";
import { AdminPage } from "./screens/admin/AdminPage";
import { AgencyPage } from "./screens/agency/AgencyPage";
import { loadMyAgencies, redeemAgencyInvite, type Agency } from "./screens/agency/agency-data";

type Screen = "auth" | "name" | "trips" | "setup" | "trip" | "past" | "pastTrip" | "agency";

/** A shared list arrives in the fragment, so it needs no server route and
 *  survives being pasted anywhere. */
function readShareLink(): SharedList | undefined {
  const match = /[#&]s=([^&]+)/.exec(window.location.hash);
  return match ? decodeShare(match[1]) : undefined;
}

/** An invite token in the fragment, parallel to `#s=` above — but this one
 *  needs a real signed-in account before it can be acted on, since it grants
 *  real write access rather than a read-only snapshot. */
function readInviteToken(): string | undefined {
  const match = /[#&]invite=([^&]+)/.exec(window.location.hash);
  return match?.[1];
}

/** A client access code, same fragment pattern again — but unlike an invite
 *  this one needs no account at all going in; AccessCodeScreen signs up an
 *  anonymous session itself if there isn't one already. */
function readAccessCode(): string | undefined {
  const match = /[#&]access=([^&]+)/.exec(window.location.hash);
  return match?.[1];
}

/** A direct, bookmarkable link to the admin page — no token, just a flag,
 *  since the real gate is account.isAdmin once signed in, not anything in
 *  the URL. */
function readAdminRoute(): boolean {
  return /[#&]admin(?:&|$)/.test(window.location.hash);
}

/** An agency-invite token, same fragment pattern as `#invite=` — but unlike
 *  that one this needs *no* account signed in, since the whole point is
 *  creating a brand-new one. The token is carried through signup itself (see
 *  auth-data.ts's signUp) rather than read again here once an account
 *  exists, since the email-confirmation redirect drops the URL hash. */
function readAgencyInviteToken(): string | undefined {
  const match = /[#&]agency-invite=([^&]+)/.exec(window.location.hash);
  return match?.[1];
}

/** Everything an account owns, read together so the screen only changes once
 *  it's known whether to open a trip, the trip list, or setup. */
async function initialState(account: Account | undefined) {
  if (!account) {
    return {
      events: [],
      currentId: undefined,
      screen: "auth" as Screen,
      pastTrips: [] as PastTrip[],
      agencies: [] as Agency[],
    };
  }
  /* A guest reached via an access code never picks a name — they're one
     person on one trip, not setting up an account. */
  if (!account.name && !account.isAnonymous) {
    return {
      events: [],
      currentId: undefined,
      screen: "name" as Screen,
      pastTrips: [] as PastTrip[],
      agencies: [] as Agency[],
    };
  }

  /* A guest's own agency status is meaningless — they're never the account
     an admin would designate — so this skips the lookup for them rather
     than firing an RPC call that could only ever come back empty. */
  const [events, savedId, pastTrips, agencies] = await Promise.all([
    loadEvents(),
    loadCurrentEventId(account.id),
    loadPastTrips(account.id),
    account.isAnonymous ? Promise.resolve([] as Agency[]) : loadMyAgencies().catch(() => [] as Agency[]),
  ]);
  const currentId = events.some((e) => e.id === savedId) ? savedId : undefined;
  const screen: Screen = currentId ? "trip" : events.length > 0 ? "trips" : "setup";
  return { events, currentId, screen, pastTrips, agencies };
}

function App() {
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);
  const [account, setAccount] = useState<Account | undefined>();
  /* Covers both "is there a session" and, once there is one, "has that
     account's trip list loaded" — one gate, since neither is meaningful
     to show a screen for on its own. */
  const [bootLoading, setBootLoading] = useState(true);
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [currentId, setCurrentId] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | undefined>();
  /* Set only by AgencyPage's "Build a client trip" button, and only read
     once — by the setup screen's onCreate below — then cleared, so it can
     never silently tag a later, unrelated trip as this agency's. */
  const [pendingAgencyId, setPendingAgencyId] = useState<string | undefined>();
  const [screen, setScreen] = useState<Screen>("auth");
  const [pastTrips, setPastTrips] = useState<PastTrip[]>([]);
  /* Empty for almost everyone — only populated for an account the admin has
     designated as an agency's Owner, or an Owner has added as an Agent —
     every agency that's true for, since an Agent can belong to more than
     one. */
  const [agencies, setAgencies] = useState<Agency[]>([]);
  /* Which of `agencies` the agency page is currently showing — session-only,
     not persisted, so it always starts back on the first one. */
  const [activeAgencyId, setActiveAgencyId] = useState<string | undefined>();
  /* A write that failed in a way local state can't quietly paper over.
     Rendered as one banner above whichever screen is showing, since the
     screens below are early returns with no shared chrome. */
  const [saveError, setSaveError] = useState<string | undefined>();
  const [openTripId, setOpenTripId] = useState<string | undefined>();
  const [shared, setShared] = useState<SharedList | undefined>(readShareLink);
  const [inviteToken, setInviteToken] = useState<string | undefined>(readInviteToken);
  const [accessCode, setAccessCode] = useState<string | undefined>(readAccessCode);
  const [adminRoute, setAdminRoute] = useState<boolean>(readAdminRoute);
  const [agencyInviteToken, setAgencyInviteToken] = useState<string | undefined>(readAgencyInviteToken);
  /* Tracks whose data is currently loaded, so a token refresh or other
     no-identity-change auth event doesn't reset navigation state out from
     under whatever the person is doing — only a real sign-in/out should. */
  const loadedAccountId = useRef<string | undefined>(undefined);

  /** Resets which agency is active whenever the list itself is (re)loaded —
   *  defaulting to the first keeps today's single-agency accounts landing
   *  exactly where they always did. */
  function applyAgencies(list: Agency[]) {
    setAgencies(list);
    setActiveAgencyId(list[0]?.id);
  }

  useEffect(() => {
    const onHashChange = () => {
      setShared(readShareLink());
      setInviteToken(readInviteToken());
      setAccessCode(readAccessCode());
      setAdminRoute(readAdminRoute());
      setAgencyInviteToken(readAgencyInviteToken());
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  /** Supabase reports the persisted session (or its absence) as soon as this
   *  subscribes, then again on every real sign-in/out — a page reload picks
   *  the same account back up without a manual "am I logged in?" check. */
  useEffect(() => {
    const unsubscribe = onAccountChange((acc) => {
      if (acc?.id === loadedAccountId.current) {
        setAccount(acc);
        setBootLoading(false);
        return;
      }
      loadedAccountId.current = acc?.id;
      setAccount(acc);
      setBootLoading(true);
      initialState(acc)
        .then((next) => {
          setEvents(next.events);
          setCurrentId(next.currentId);
          setScreen(next.screen);
          setPastTrips(next.pastTrips);
          applyAgencies(next.agencies);
          setBootLoading(false);
        })
        .catch(() => {
          /* A network hiccup shouldn't strand the app on a blank loading
             screen — land on an empty trip list rather than nothing. */
          setEvents([]);
          setCurrentId(undefined);
          setScreen(acc ? "trips" : "auth");
          setPastTrips([]);
          applyAgencies([]);
          setBootLoading(false);
        });
    });
    return unsubscribe;
  }, []);

  const theme = getTheme(themeKey);
  const event = events.find((e) => e.id === currentId);
  const editing = events.find((e) => e.id === editingId);

  /** Opens a trip the local list may not know about yet — the agency page
   *  fetches its own trips straight from the database, so a client trip
   *  another agent created (or one made on another device since this tab
   *  loaded) isn't in `events` and would otherwise fall through to the
   *  blank setup form at the bottom of this component. */
  function openLoadedEvent(trip: EventDetails) {
    setEvents((prev) =>
      prev.some((e) => e.id === trip.id) ? prev : [trip, ...prev],
    );
    openEvent(trip.id);
  }

  function openEvent(id: string | undefined) {
    setCurrentId(id);
    /* Best-effort — if this doesn't save, the next visit just lands on the
       trip list instead of straight back into this trip. */
    if (account) void saveCurrentEventId(account.id, id).catch(() => {});
    setScreen(id ? "trip" : "trips");
  }

  /** Updates local state immediately so the UI never waits on the network,
   *  then persists in the background — a failed write just means the trip
   *  isn't on another device yet, not that it's lost here. */
  async function upsertEvent(next: EventDetails) {
    /* Only a brand-new trip picks up the pending agency tag — editing an
       existing one later must never retroactively move it between personal
       and agency-owned. */
    const tagged =
      pendingAgencyId && !events.some((e) => e.id === next.id)
        ? { ...next, agencyId: pendingAgencyId }
        : next;
    setPendingAgencyId(undefined);
    const exists = events.some((e) => e.id === tagged.id);
    setEvents(exists ? events.map((e) => (e.id === tagged.id ? tagged : e)) : [tagged, ...events]);
    setEditingId(undefined);
    if (account) {
      try {
        await upsertEventRow(account.id, tagged, !exists);
      } catch {
        /* Personal trips can live in local state until the next edit
           retries, but an agency trip that never reached the database
           won't come back from loadAgencyTrips — so the agent would be
           looking at a client trip their colleagues can't see. Say so
           rather than letting the two lists quietly disagree. */
        if (tagged.agencyId) {
          setSaveError("That client trip didn't save — check your connection and edit it to try again.");
        }
      }
    }
    openEvent(tagged.id);
  }

  /** Deleting the row cascades to its saved content on the backend — nothing
   *  else needs cleaning up separately. */
  function deleteEvent(id: string) {
    const next = events.filter((e) => e.id !== id);
    setEvents(next);
    /* Deleting needs an Organiser row, which agency access alone doesn't
       give — so an agent can be shown Delete on a colleague's client trip,
       have the row survive, and watch it reappear on reload. Put it back
       and say so rather than pretending it worked. */
    void deleteEventRow(id).catch(() => {
      setEvents((prev) => (prev.some((e) => e.id === id) ? prev : [...prev, ...events.filter((e) => e.id === id)]));
      setSaveError("You don't have permission to delete that trip — only its organiser can.");
    });
    if (currentId === id) {
      setCurrentId(undefined);
      if (account) void saveCurrentEventId(account.id, undefined).catch(() => {});
    }
    setPendingAgencyId(undefined);
    setScreen(next.length > 0 ? "trips" : "setup");
  }

  function signOut() {
    loadedAccountId.current = undefined;
    void clearSession();
    setAccount(undefined);
    /* Their trips stay on the device under their own account key — signing
       back in brings them back, and nobody else's session can reach them. */
    setEvents([]);
    setCurrentId(undefined);
    setEditingId(undefined);
    setAgencies([]);
    setActiveAgencyId(undefined);
    /* Left set, this would tag the *next* account's first trip into the
       previous one's agency on a shared device. */
    setPendingAgencyId(undefined);
    setSaveError(undefined);
    setScreen("auth");
  }

  function keepTrip(trip: PastTrip) {
    setPastTrips([trip, ...pastTrips]);
    if (account) void insertPastTrip(account.id, trip).catch(() => {});
    setOpenTripId(trip.id);
    setScreen("pastTrip");
  }

  function forgetTrip(id: string) {
    setPastTrips(pastTrips.filter((t) => t.id !== id));
    void deletePastTrip(id).catch(() => {});
    setScreen("past");
  }

  /* Every screen below is an early return with no shared wrapper, so the
     banner goes here and `renderScreen` (hoisted) holds the chain. */
  return (
    <>
      {saveError && (
        <div
          role="alert"
          style={{
            position: "fixed",
            insetInline: 0,
            top: 0,
            zIndex: 50,
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
          <span>{saveError}</span>
          <button
            type="button"
            onClick={() => setSaveError(undefined)}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              font: "inherit",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      {renderScreen()}
    </>
  );

  function renderScreen() {
  if (shared) {
    return (
      <SharedListScreen
        list={shared}
        onDismiss={() => {
          window.location.hash = "";
          setShared(undefined);
          setScreen(currentId ? "trip" : "setup");
        }}
        theme={theme}
      />
    );
  }

  /* Needs no account at all going in — it signs up an anonymous session
     itself if there isn't one — so it renders ahead of the bootLoading gate
     rather than waiting on the normal boot sequence. */
  if (accessCode) {
    return (
      <AccessCodeScreen
        code={accessCode}
        account={account}
        onJoined={(tripId) => {
          window.location.hash = "";
          setAccessCode(undefined);
          loadEvents()
            .then((next) => {
              setEvents(next);
              openEvent(tripId);
            })
            .catch(() => {
              setScreen("setup");
            });
        }}
        onDecline={() => {
          window.location.hash = "";
          setAccessCode(undefined);
          setScreen(currentId ? "trip" : events.length > 0 ? "trips" : "setup");
        }}
      />
    );
  }

  /* Like the access-code screen above, this needs no account going in —
     that's the whole point, it's how a brand-new agency owner gets one. Once
     signup succeeds, onAccountChange picks up the new session and this falls
     away on its own (agencyInviteToken stays set, but the `!account` guard
     stops matching) while the redemption itself happens once, from the
     NamePage hook below, after the confirmation-email round trip. */
  if (agencyInviteToken && !account) {
    return (
      <AgencyInviteAcceptScreen
        token={agencyInviteToken}
        onSignedUp={() => {
          /* onAccountChange (or, for a project without email confirmation,
             the immediate session) takes it from here — nothing to do but
             wait for the account to appear. */
        }}
        onDecline={() => {
          window.location.hash = "";
          setAgencyInviteToken(undefined);
        }}
      />
    );
  }

  if (bootLoading) {
    return <div style={{ background: theme.bg, width: "100%", height: "100vh" }} />;
  }

  /* A direct, bookmarkable route rather than something reachable only via
     the in-app button — still gated on account.isAdmin, so visiting the
     link signed out or as anyone else just falls through to the normal
     screen below. */
  if (adminRoute && account?.isAdmin) {
    return (
      <AdminPage
        accountId={account.id}
        onBack={() => {
          window.location.hash = "";
          setAdminRoute(false);
        }}
        theme={theme}
      />
    );
  }

  /* Needs a real account first — sign-up/sign-in and NamePage run their
     normal course underneath (screen still drives them), and this catches
     the invite on the next render once account.name is set either way. */
  if (inviteToken && account?.name) {
    return (
      <InviteAcceptScreen
        token={inviteToken}
        onJoined={(tripId) => {
          window.location.hash = "";
          setInviteToken(undefined);
          loadEvents()
            .then((next) => {
              setEvents(next);
              openEvent(tripId);
            })
            .catch(() => {
              /* the membership still went through — it'll show up next
                 time the trip list loads even if this refresh didn't. */
              setScreen(events.length > 0 ? "trips" : "setup");
            });
        }}
        onDecline={() => {
          window.location.hash = "";
          setInviteToken(undefined);
          setScreen(currentId ? "trip" : events.length > 0 ? "trips" : "setup");
        }}
      />
    );
  }

  if (screen === "auth") {
    return (
      <AuthPage
        onAuthenticated={(acc) => {
          loadedAccountId.current = acc.id;
          setAccount(acc);
          setBootLoading(true);
          initialState(acc)
            .then((next) => {
              setEvents(next.events);
              setCurrentId(next.currentId);
              setScreen(next.screen);
              setPastTrips(next.pastTrips);
              applyAgencies(next.agencies);
              setBootLoading(false);
            })
            .catch(() => {
              setEvents([]);
              setCurrentId(undefined);
              setScreen("trips");
              setPastTrips([]);
              applyAgencies([]);
              setBootLoading(false);
            });
        }}
      />
    );
  }

  if (screen === "name") {
    return (
      <NamePage
        onSubmit={async (name) => {
          if (!account) return;
          const updated = await setAccountName(account.id, name);
          setAccount(updated);

          /* The one guaranteed moment to redeem an agency invite: whether
             the `#agency-invite=` hash survived the email-confirmation
             redirect or not (it usually doesn't — emailRedirectTo strips
             it), the token itself rode along in the account's own metadata
             from signUp(), and this is the first time that account has a
             session to redeem it with. Failure here just means there was
             nothing to redeem (an ordinary signup) — fall through to setup
             as normal. */
          if (agencyInviteToken) {
            window.location.hash = "";
            setAgencyInviteToken(undefined);
            try {
              await redeemAgencyInvite();
              const list = await loadMyAgencies();
              applyAgencies(list);
              setScreen("agency");
              return;
            } catch {
              /* Falls through to setup below. */
            }
          }

          setScreen("setup");
        }}
      />
    );
  }

  if (screen === "pastTrip") {
    const trip = pastTrips.find((t) => t.id === openTripId);
    if (trip) {
      return (
        <PastTripScreen
          trip={trip}
          onBack={() => setScreen("past")}
          onForget={() => forgetTrip(trip.id)}
          theme={theme}
        />
      );
    }
  }

  if (screen === "past") {
    return (
      <PastTripsScreen
        trips={pastTrips}
        onOpen={(id) => {
          setOpenTripId(id);
          setScreen("pastTrip");
        }}
        onBack={() => setScreen(currentId ? "trip" : "trips")}
        theme={theme}
      />
    );
  }

  if (screen === "trips") {
    return (
      <TripsScreen
        trips={events}
        currentId={currentId}
        onOpen={openEvent}
        onCreate={() => {
          setEditingId(undefined);
          /* Starting a trip from here is a personal one — without this it
             would inherit an agency tag left over from an abandoned
             "Build a client trip". */
          setPendingAgencyId(undefined);
          setScreen("setup");
        }}
        onEdit={(id) => {
          /* Opens the style picker on the trip's actual design rather than
             whatever the picker last happened to show — otherwise "Save
             changes" without touching Trip style would silently switch it
             to whatever was last selected elsewhere. */
          const target = events.find((e) => e.id === id);
          if (target) setThemeKey(target.themeKey);
          setEditingId(id);
          setScreen("setup");
        }}
        onDelete={deleteEvent}
        onBack={currentId ? () => setScreen("trip") : undefined}
        onOpenAdmin={
          account?.isAdmin
            ? () => {
                window.location.hash = "admin";
                setAdminRoute(true);
              }
            : undefined
        }
        onOpenAgency={agencies.length > 0 ? () => setScreen("agency") : undefined}
        theme={theme}
      />
    );
  }

  const activeAgency = agencies.find((a) => a.id === activeAgencyId);
  if (screen === "agency" && activeAgency && account) {
    return (
      <AgencyPage
        agency={activeAgency}
        agencies={agencies}
        onSwitchAgency={setActiveAgencyId}
        accountId={account.id}
        onOpenTrip={openLoadedEvent}
        onCreateClientTrip={(agencyId) => {
          setPendingAgencyId(agencyId);
          setEditingId(undefined);
          setScreen("setup");
        }}
        onBack={() => setScreen("trips")}
        theme={theme}
      />
    );
  }

  if (screen === "trip" && event && account) {
    return (
      <TripPage
        /* Rebuilds the day strip from scratch when the trip changes or its
           range is edited — the saved plan is fitted to the new range as it
           loads, so nothing on a surviving day is lost. */
        key={`${event.id}:${event.startDate}:${event.endDate}:${event.fromExample}`}
        theme={getTheme(event.themeKey)}
        event={event}
        accountId={account.id}
        userName={account.name}
        savedCount={pastTrips.length}
        onSaveTrip={keepTrip}
        onOpenPast={() => setScreen("past")}
        onOpenTrips={() => setScreen("trips")}
        onSignOut={signOut}
        onBack={() => setScreen("trips")}
      />
    );
  }

  return (
    <TripSetupPage
      themeKey={themeKey}
      onThemeKeyChange={setThemeKey}
      editing={editing}
      userName={account?.name}
      onCreate={upsertEvent}
      onCancel={
        events.length > 0
          ? () => {
              setEditingId(undefined);
              /* Backing out of "Build a client trip" must drop the tag —
                 otherwise the next trip started from anywhere silently
                 lands in the agency. */
              setPendingAgencyId(undefined);
              setScreen("trips");
            }
          : undefined
      }
    />
  );
  }
}

export default App;
