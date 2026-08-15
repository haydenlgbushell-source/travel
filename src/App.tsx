import { useEffect, useState } from "react";
import { DEFAULT_THEME_KEY, getTheme } from "./theme";
import { TripSetupPage } from "./screens/trip-setup/TripSetupPage";
import { loadEventDetails, saveEventDetails, type EventDetails } from "./screens/trip-setup/event-data";
import { TripPage } from "./screens/trip/TripPage";
import { PastTripScreen } from "./screens/trip/PastTripScreen";
import { PastTripsScreen } from "./screens/trip/PastTripsScreen";
import { SharedListScreen } from "./screens/trip/SharedListScreen";
import { AuthPage } from "./screens/auth/AuthPage";
import { NamePage } from "./screens/auth/NamePage";
import { currentAccount, setAccountName, type Account } from "./screens/auth/auth-data";
import {
  decodeShare,
  loadPastTrips,
  savePastTrips,
  type PastTrip,
  type SharedList,
} from "./screens/trip/trip-data";

type Screen = "auth" | "name" | "setup" | "trip" | "past" | "pastTrip";

/** A shared list arrives in the fragment, so it needs no server route and
 *  survives being pasted anywhere. */
function readShareLink(): SharedList | undefined {
  const match = /[#&]s=([^&]+)/.exec(window.location.hash);
  return match ? decodeShare(match[1]) : undefined;
}

function initialScreen(account: Account | undefined, event: EventDetails | undefined): Screen {
  if (!account) return "auth";
  if (!account.name) return "name";
  return event ? "trip" : "setup";
}

function App() {
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);
  const [account, setAccount] = useState<Account | undefined>(currentAccount);
  const [eventDetails, setEventDetails] = useState<EventDetails | undefined>(loadEventDetails);
  const [screen, setScreen] = useState<Screen>(() => initialScreen(currentAccount(), loadEventDetails()));
  const [pastTrips, setPastTrips] = useState<PastTrip[]>(loadPastTrips);
  const [openTripId, setOpenTripId] = useState<string | undefined>();
  const [shared, setShared] = useState<SharedList | undefined>(readShareLink);

  useEffect(() => {
    const onHashChange = () => setShared(readShareLink());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const theme = getTheme(themeKey);

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
          setScreen("setup");
        }}
        theme={theme}
      />
    );
  }

  if (screen === "auth") {
    return (
      <AuthPage
        onAuthenticated={(acc) => {
          setAccount(acc);
          setScreen(acc.name ? "setup" : "name");
        }}
      />
    );
  }

  if (screen === "name") {
    return (
      <NamePage
        onSubmit={(name) => {
          if (!account) return;
          const updated = setAccountName(account.id, name);
          setAccount(updated ?? { ...account, name });
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
        onBack={() => setScreen("trip")}
        theme={theme}
      />
    );
  }

  if (screen === "trip") {
    return (
      <TripPage
        theme={theme}
        savedCount={pastTrips.length}
        onSaveTrip={keepTrip}
        onOpenPast={() => setScreen("past")}
        onBack={() => setScreen("setup")}
        eventName={eventDetails?.name}
        eventDates={eventDetails?.dates}
      />
    );
  }

  return (
    <TripSetupPage
      themeKey={themeKey}
      onThemeKeyChange={setThemeKey}
      onCreate={(event) => {
        setEventDetails(event);
        saveEventDetails(event);
        setScreen("trip");
      }}
    />
  );
}

export default App;
