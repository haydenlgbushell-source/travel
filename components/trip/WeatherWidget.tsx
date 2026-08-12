import { Cloud, CloudLightning, CloudRain, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { WeatherDay } from "@/lib/types";
import { Card, Overline, SectionHeading } from "@/components/shell/Card";

const CONDITION_ICONS: Record<WeatherDay["condition"], LucideIcon> = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
};

const CONDITION_LABELS: Record<WeatherDay["condition"], string> = {
  sun: "Sunny",
  cloud: "Cloudy",
  rain: "Rain",
  storm: "Storms",
};

/**
 * Seasonal averages, not a forecast — the trip is too far out for one to exist.
 * When a weather API is wired in, keep this fallback for trips beyond the
 * provider's forecast horizon and label which of the two is showing.
 */
export function WeatherWidget({ days }: { days: WeatherDay[] }) {
  return (
    <section aria-labelledby="weather-heading">
      <SectionHeading title="Weather" meta="Seasonal averages · not a forecast" />
      <div className="px-5">
        <Card className="p-4">
          <h3 id="weather-heading" className="sr-only">
            Weather
          </h3>
          <ul className="flex justify-between gap-1">
            {days.map((day) => {
              const Icon = CONDITION_ICONS[day.condition];
              return (
                <li
                  key={day.label}
                  className="flex flex-1 flex-col items-center gap-1.5"
                >
                  <Overline>{day.label}</Overline>
                  <Icon
                    size={20}
                    className={
                      day.condition === "sun" ? "text-papaya" : "text-lagoon"
                    }
                    aria-label={CONDITION_LABELS[day.condition]}
                  />
                  <p className="font-mono text-xs font-semibold tabular-nums text-ink-text">
                    {day.high}°
                  </p>
                  <p className="font-mono text-[10px] tabular-nums text-muted">
                    {day.low}°
                  </p>
                  <p className="font-mono text-[9px] tabular-nums text-lagoon-dark">
                    {day.rainChance}%
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </section>
  );
}
