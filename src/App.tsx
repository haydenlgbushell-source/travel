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
import { clearSession, onAccountChange, setAccountName, type Account } from "./screens/auth/auth-data";
import {
  decodeShare,
  deletePastTrip,
  insertPastTrip,
  loadPastTrips,
  type PastTrip,
  type SharedList,
} from "./screens/trip/trip-data";

type Screen = "auth" | "name" | "trips" | "setup" | "trip" | "past" | "pastTrip";

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

/** Everything an account owns, read together so the screen only changes once
 *  it's known whether to open a trip, the trip list, or setup. */
async function initialState(account: Account | undefined) {
  if (!account) {
    return { events: [], currentId: undefined, screen: "auth" as Screen, pastTrips: [] as PastTrip[] };
  }
  if (!account.name) {
    return { events: [], currentId: undefined, screen: "name" as Screen, pastTrips: [] as PastTrip[] };
  }

  const [events, savedId, pastTrips] = await Promise.all([
    loadEvents(account.id),
    loadCurrentEventId(account.id),
    loadPastTrips(account.id),
  ]);
  const currentId = events.some((e) => e.id === savedId) ? savedId : undefined;
  const screen: Screen = currentId ? "trip" : events.length > 0 ? "trips" : "setup";
  return { events, currentId, screen, pastTrips };
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
  const [screen, setScreen] = useState<Screen>("auth");
  const [pastTrips, setPastTrips] = useState<PastTrip[]>([]);
  const [openTripId, setOpenTripId] = useState<string | undefined>();
  const [shared, setShared] = useState<SharedList | undefined>(readShareLink);
  const [inviteToken, setInviteToken] = useState<string | undefined>(readInviteToken);
  /* Tracks whose data is currently loaded, so a token refresh or other
     no-identity-change auth event doesn't reset navigation state out from
     under whatever the person is doing — only a real sign-in/out should. */
  const loadedAccountId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const onHashChange = () => {
      setShared(readShareLink());
      setInviteToken(readInviteToken());
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
          setBootLoading(false);
        })
        .catch(() => {
          /* A network hiccup shouldn't strand the app on a blank loading
             screen — land on an empty trip list rather than nothing. */
          setEvents([]);
          setCurrentId(undefined);
          setScreen(acc ? "trips" : "auth");
          setPastTrips([]);
          setBootLoading(false);
        });
    });
    return unsubscribe;
  }, []);

  const theme = getTheme(themeKey);
  const event = events.find((e) => e.id === currentId);
  const editing = events.find((e) => e.id === editingId);

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
    const exists = events.some((e) => e.id === next.id);
    setEvents(exists ? events.map((e) => (e.id === next.id ? next : e)) : [next, ...events]);
    setEditingId(undefined);
    if (account) {
      try {
        await upsertEventRow(account.id, next);
      } catch {
        /* still shows locally; it'll try again the next time it's edited. */
      }
    }
    openEvent(next.id);
  }

  /** Deleting the row cascades to its saved content on the backend — nothing
   *  else needs cleaning up separately. */
  function deleteEvent(id: string) {
    const next = events.filter((e) => e.id !== id);
    setEvents(next);
    void deleteEventRow(id).catch(() => {});
    if (currentId === id) {
      setCurrentId(undefined);
      if (account) void saveCurrentEventId(account.id, undefined).catch(() => {});
    }
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

  if (bootLoading) {
    return <div style={{ background: theme.bg, width: "100%", height: "100vh" }} />;
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
          loadEvents(account.id)
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
              setBootLoading(false);
            })
            .catch(() => {
              setEvents([]);
              setCurrentId(undefined);
              setScreen("trips");
              setPastTrips([]);
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
          setScreen("setup");
        }}
        onEdit={(id) => {
          setEditingId(id);
          setScreen("setup");
        }}
        onDelete={deleteEvent}
        onBack={currentId ? () => setScreen("trip") : undefined}
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
        theme={theme}
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
      onCreate={upsertEvent}
      onCancel={
        events.length > 0
          ? () => {
              setEditingId(undefined);
              setScreen("trips");
            }
          : undefined
      }
    />
  );
}

export default App;
