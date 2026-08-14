import { useState } from "react";
import { DEFAULT_THEME_KEY, getTheme } from "./theme";
import { TripSetupPage } from "./screens/trip-setup/TripSetupPage";
import { TripPage } from "./screens/trip/TripPage";

type Screen = "setup" | "trip";

function App() {
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);
  const [screen, setScreen] = useState<Screen>("setup");

  if (screen === "trip") {
    return <TripPage theme={getTheme(themeKey)} onBack={() => setScreen("setup")} />;
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
