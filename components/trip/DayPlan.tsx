"use client";

import { useMemo, useState } from "react";
import { MapPin, Star } from "lucide-react";
import type { EventTag, TripDay } from "@/lib/types";
import { Card, Pill, SectionHeading } from "@/components/shell/Card";

const TAG_TONE: Record<EventTag, "neutral" | "lagoon" | "palm" | "stamp" | "papaya"> = {
  food: "papaya",
  activity: "lagoon",
  travel: "neutral",
  rest: "palm",
  booking: "palm",
  free: "neutral",
};

const TAG_LABEL: Record<EventTag, string> = {
  food: "Food",
  activity: "Do",
  travel: "Travel",
  rest: "Rest",
  booking: "Booked",
  free: "Free",
};

const OVERVIEW = "overview";

/**
 * Day tabs + timeline, together.
 *
 * In the mockup the tabs sat near the top and were decorative — they didn't
 * filter anything. Pairing them with the timeline in one client component is
 * what makes them work: the selected day is local state, and "Overview" shows
 * every day's highlights instead of a single day's detail.
 */
export function DayPlan({ days }: { days: TripDay[] }) {
  const [selected, setSelected] = useState<string>(OVERVIEW);

  const activeDay = useMemo(
    () => days.find((day) => day.date === selected) ?? null,
    [days, selected],
  );

  const highlights = useMemo(
    () =>
      days.map((day) => ({
        day,
        events: day.events.filter((event) => event.isHighlight),
      })),
    [days],
  );

  const tabs = [{ id: OVERVIEW, top: "All", bottom: "Days" }].concat(
    days.map((day) => ({
      id: day.date,
      top: day.weekdayShort,
      bottom: day.dayOfMonth,
    })),
  );

  return (
    <section id="today" aria-labelledby="plan-heading">
      <SectionHeading
        title="The plan"
        meta={
          activeDay
            ? `${activeDay.weekdayShort} ${activeDay.dayOfMonth} · ${activeDay.label}`
            : `${days.length} days · highlights`
        }
      />

      {/* Tab strip scrolls horizontally on narrow screens. */}
      <div
        role="tablist"
        aria-label="Trip days"
        className="flex snap-x gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === selected;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="plan-panel"
              onClick={() => setSelected(tab.id)}
              className={`
                flex w-[52px] shrink-0 snap-start flex-col items-center rounded-card
                border px-2 py-2 transition-colors
                focus-visible:outline focus-visible:outline-2
                focus-visible:outline-offset-2 focus-visible:outline-lagoon-dark
                ${
                  isActive
                    ? "border-lagoon-dark bg-lagoon-dark text-paper-hi"
                    : "border-line bg-paper-hi text-muted hover:border-lagoon/40"
                }
              `}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.1em]">
                {tab.top}
              </span>
              <span className="font-display text-base font-semibold leading-tight">
                {tab.bottom}
              </span>
            </button>
          );
        })}
      </div>

      <div id="plan-panel" role="tabpanel" className="px-5">
        <h3 id="plan-heading" className="sr-only">
          The plan
        </h3>

        {activeDay ? (
          <DayTimeline day={activeDay} />
        ) : (
          <div className="space-y-3">
            {highlights.map(({ day, events }) => (
              <Card key={day.date} className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-sm font-semibold text-ink">
                    {day.weekdayShort} {day.dayOfMonth} · {day.label}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelected(day.date)}
                    className="
                      shrink-0 font-mono text-[10px] uppercase tracking-[0.1em]
                      text-lagoon-dark underline-offset-2 hover:underline
                      focus-visible:outline focus-visible:outline-2
                      focus-visible:outline-offset-2 focus-visible:outline-lagoon-dark
                    "
                  >
                    {day.events.length} items
                  </button>
                </div>

                <ul className="mt-2 space-y-1.5">
                  {events.length > 0 ? (
                    events.map((event) => (
                      <li
                        key={event.id}
                        className="flex items-start gap-2 text-xs text-ink-text/85"
                      >
                        <Star
                          size={11}
                          className="mt-1 shrink-0 fill-papaya text-papaya"
                          aria-hidden="true"
                        />
                        <span>
                          <span className="font-mono text-[11px] text-muted">
                            {event.time}
                          </span>{" "}
                          {event.title}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-muted">
                      Nothing locked in — an open day.
                    </li>
                  )}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DayTimeline({ day }: { day: TripDay }) {
  return (
    <Card className="p-4">
      <ol className="relative space-y-4 border-l border-dashed border-line pl-5">
        {day.events.map((event) => (
          <li key={event.id} className="relative">
            {/* Timeline node sits on the dashed spine. */}
            <span
              aria-hidden="true"
              className={`
                absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-paper-hi
                ${event.isHighlight ? "bg-papaya" : "bg-lagoon"}
              `}
            />

            <div className="flex items-baseline gap-2">
              <time className="font-mono text-xs font-semibold tracking-wide text-lagoon-dark">
                {event.time}
              </time>
              <Pill tone={TAG_TONE[event.tag]}>{TAG_LABEL[event.tag]}</Pill>
            </div>

            <p className="mt-1 text-sm font-semibold leading-snug text-ink-text">
              {event.title}
            </p>

            {event.subtitle ? (
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                {event.subtitle}
              </p>
            ) : null}

            {event.location ? (
              <p className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                <MapPin size={10} aria-hidden="true" />
                {event.location}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}
