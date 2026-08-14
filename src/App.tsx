import { useEffect, useState } from "react";
import { DEFAULT_THEME_KEY, getTheme } from "./theme";
import { TripSetupPage } from "./screens/trip-setup/TripSetupPage";
import { TripPage } from "./screens/trip/TripPage";
import { PastTripScreen } from "./screens/trip/PastTripScreen";
import { PastTripsScreen } from "./screens/trip/PastTripsScreen";
import { SharedListScreen } from "./screens/trip/SharedListScreen";
import {
  decodeShare,
  loadPastTrips,
  savePastTrips,
  type PastTrip,
  type SharedList,
} from "./screens/trip/trip-data";

type Screen = "setup" | "trip" | "past" | "pastTrip";

/** A shared list arrives in the fragment, so it needs no server route and
 *  survives being pasted anywhere. */
function readShareLink(): SharedList | undefined {
  const match = /[#&]s=([^&]+)/.exec(window.location.hash);
  return match ? decodeShare(match[1]) : undefined;
}

function App() {
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);
  const [screen, setScreen] = useState<Screen>("setup");
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
      />
    );
  }

  return (
    <TripSetupPage
      themeKey={themeKey}
      onThemeKeyChange={setThemeKey}
      onCreate={() => setScreen("trip")}
    />
  );
}

export default App;
