import type { Metadata } from "next";
import Link from "next/link";
import { loadTrip } from "@/lib/data/load";
import { deleteEventAction, setDayLabelAction } from "@/lib/actions/itinerary";
import {
  EditShell,
  EditableRow,
  EmptyHint,
  FormCard,
} from "@/components/edit/EditShell";
import { EventForm } from "@/components/edit/EventForm";
import { DeleteButton } from "@/components/form/Fields";

export const metadata: Metadata = { title: "The plan" };

/**
 * One day at a time, chosen by `?day=`. Rendering all eight days' forms at once
 * would mean dozens of open editors on a long trip.
 */
export default async function PlanEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { slug } = await params;
  const { day: dayParam } = await searchParams;
  const { detail } = await loadTrip(slug);

  const days = detail.days;
  const activeDay = days.find((d) => d.date === dayParam) ?? days[0];

  if (!activeDay) {
    return (
      <EditShell
        title="The plan"
        meta="No days to plan"
        backHref={`/trips/${slug}/edit`}
        backLabel="Edit trip"
      >
        <EmptyHint>
          Set the trip&rsquo;s start and end dates first — days come from the
          date range.
        </EmptyHint>
      </EditShell>
    );
  }

  return (
    <EditShell
      title="The plan"
      meta={`${activeDay.weekdayShort} ${activeDay.dayOfMonth} · ${activeDay.label}`}
      backHref={`/trips/${slug}/edit`}
      backLabel="Edit trip"
    >
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.map((day) => {
          const isActive = day.date === activeDay.date;
          return (
            <Link
              key={day.date}
              href={`/trips/${slug}/edit/plan?day=${day.date}`}
              aria-current={isActive ? "page" : undefined}
              className={`
                flex w-[52px] shrink-0 flex-col items-center rounded-card border
                px-2 py-2 transition-colors
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
                {day.weekdayShort}
              </span>
              <span className="font-display text-base font-semibold leading-tight">
                {day.dayOfMonth}
              </span>
              {day.events.length > 0 ? (
                <span className="mt-0.5 font-mono text-[9px] opacity-70">
                  {day.events.length}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Day heading — submits on blur so there's no separate save button. */}
      <form
        action={setDayLabelAction.bind(null, slug)}
        className="mb-4 rounded-card border border-line bg-paper-hi px-4 py-3"
      >
        <input type="hidden" name="date" value={activeDay.date} />
        <label
          htmlFor="day-label"
          className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
        >
          Day heading
        </label>
        <input
          id="day-label"
          name="label"
          defaultValue={activeDay.label}
          maxLength={40}
          placeholder="Arrival"
          className="
            w-full rounded-card border border-line bg-paper px-3 py-2 text-sm
            text-ink-text focus:outline-none focus-visible:outline
            focus-visible:outline-2 focus-visible:outline-offset-1
            focus-visible:outline-lagoon-dark
          "
        />
        <button
          type="submit"
          className="
            mt-2 text-xs font-semibold text-lagoon-dark underline-offset-2
            hover:underline focus-visible:outline focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-lagoon-dark
          "
        >
          Save heading
        </button>
      </form>

      <div className="space-y-2">
        {activeDay.events.length === 0 ? (
          <EmptyHint>Nothing planned for this day yet.</EmptyHint>
        ) : (
          activeDay.events.map((event) => (
            <EditableRow
              key={event.id}
              summary={`${event.time} · ${event.title}`}
              detail={event.subtitle ?? event.location}
            >
              <EventForm
                slug={slug}
                days={days}
                defaultDate={activeDay.date}
                event={event}
              />

              <div className="mt-4 border-t border-line pt-4">
                <form action={deleteEventAction.bind(null, slug)}>
                  <input type="hidden" name="eventId" value={event.id} />
                  <DeleteButton compact confirm={`Delete "${event.title}"?`}>
                    Delete
                  </DeleteButton>
                </form>
              </div>
            </EditableRow>
          ))
        )}
      </div>

      <div className="mt-6">
        <FormCard title="Add to this day">
          <EventForm slug={slug} days={days} defaultDate={activeDay.date} />
        </FormCard>
      </div>
    </EditShell>
  );
}
