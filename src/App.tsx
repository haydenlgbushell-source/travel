import { useEffect, useRef, useState } from "react";
import { DEFAULT_THEME_KEY, getTheme } from "./theme";
import { TripSetupPage } from "./screens/trip-setup/TripSetupPage";
import { TripsScreen } from "./screens/trip-setup/TripsScreen";
import {
  loadCurrentEventId,
  loadEvents,
  saveCurrentEventId,
  saveEvents,
  type EventDetails,
} from "./screens/trip-setup/event-data";
import { TripPage } from "./screens/trip/TripPage";
import { PastTripScreen } from "./screens/trip/PastTripScreen";
import { PastTripsScreen } from "./screens/trip/PastTripsScreen";
import { SharedListScreen } from "./screens/trip/SharedListScreen";
import { AuthPage } from "./screens/auth/AuthPage";
import { NamePage } from "./screens/auth/NamePage";
import { clearSession, onAccountChange, setAccountName, type Account } from "./screens/auth/auth-data";
import {
  clearSaved,
  decodeShare,
  loadPastTrips,
  savePastTrips,
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

/** Everything an account owns, read together so the first render already
 *  knows whether to open a trip, the trip list, or setup. */
function initialState(account: Account | undefined) {
  if (!account) return { events: [], currentId: undefined, screen: "auth" as Screen };
  if (!account.name) return { events: [], currentId: undefined, screen: "name" as Screen };

  const events = loadEvents(account.id);
  const savedId = loadCurrentEventId(account.id);
  const currentId = events.some((e) => e.id === savedId) ? savedId : undefined;
  const screen: Screen = currentId ? "trip" : events.length > 0 ? "trips" : "setup";
  return { events, currentId, screen };
}

function App() {
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);
  const [account, setAccount] = useState<Account | undefined>();
  const [authLoading, setAuthLoading] = useState(true);
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [currentId, setCurrentId] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | undefined>();
  const [screen, setScreen] = useState<Screen>("auth");
  const [pastTrips, setPastTrips] = useState<PastTrip[]>(loadPastTrips);
  const [openTripId, setOpenTripId] = useState<string | undefined>();
  const [shared, setShared] = useState<SharedList | undefined>(readShareLink);
  /* Tracks whose data is currently loaded, so a token refresh or other
     no-identity-change auth event doesn't reset navigation state out from
     under whatever the person is doing — only a real sign-in/out should. */
  const loadedAccountId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const onHashChange = () => setShared(readShareLink());
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
        setAuthLoading(false);
        return;
      }
      loadedAccountId.current = acc?.id;
      setAccount(acc);
      const next = initialState(acc);
      setEvents(next.events);
      setCurrentId(next.currentId);
      setScreen(next.screen);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const theme = getTheme(themeKey);
  const event = events.find((e) => e.id === currentId);
  const editing = events.find((e) => e.id === editingId);

  /** Everything an account owns is keyed to it, so writes always go through
   *  here rather than assuming there's a signed-in account to write against. */
  function persistEvents(next: EventDetails[]) {
    setEvents(next);
    if (account) saveEvents(account.id, next);
  }

  function openEvent(id: string | undefined) {
    setCurrentId(id);
    if (account) saveCurrentEventId(account.id, id);
    setScreen(id ? "trip" : "trips");
  }

  function upsertEvent(next: EventDetails) {
    const exists = events.some((e) => e.id === next.id);
    persistEvents(exists ? events.map((e) => (e.id === next.id ? next : e)) : [next, ...events]);
    setEditingId(undefined);
    openEvent(next.id);
  }

  /** Deleting takes the trip's saved plan with it — leaving that behind
   *  would quietly hold onto someone's data after they asked for it gone. */
  function deleteEvent(id: string) {
    clearSaved(id);
    const next = events.filter((e) => e.id !== id);
    persistEvents(next);
    if (currentId === id) {
      setCurrentId(undefined);
      if (account) saveCurrentEventId(account.id, undefined);
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
    const next = [trip, ...pastTrips];
    setPastTrips(next);
    savePastTrips(next);
    setOpenTripId(trip.id);
    setScreen("pastTrip");
  }

  function forgetTrip(id: string) {
    const next = pastTrips.filter((t) => t.id !== id);
    setPastTrips(next);
    savePastTrips(next);
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

  if (authLoading) {
    return <div style={{ background: theme.bg, width: "100%", height: "100vh" }} />;
  }

  if (screen === "auth") {
    return (
      <AuthPage
        onAuthenticated={(acc) => {
          loadedAccountId.current = acc.id;
          setAccount(acc);
          const next = initialState(acc);
          setEvents(next.events);
          setCurrentId(next.currentId);
          setScreen(next.screen);
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

  if (screen === "trip" && event) {
    return (
      <TripPage
        /* Rebuilds the day strip from scratch when the trip changes or its
           range is edited — the saved plan is fitted to the new range as it
           loads, so nothing on a surviving day is lost. */
        key={`${event.id}:${event.startDate}:${event.endDate}:${event.fromExample}`}
        theme={theme}
        event={event}
        userName={account?.name}
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
