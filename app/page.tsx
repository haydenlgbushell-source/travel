import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { getTripSummaries } from "@/lib/mock-data";
import { formatDateRange } from "@/lib/format";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { Card, Overline, Pill } from "@/components/shell/Card";
import { GroupAvatars } from "@/components/trip/GroupAvatars";
import type { TripStatus } from "@/lib/types";

const STATUS_TONE: Record<TripStatus, "neutral" | "lagoon" | "palm" | "papaya"> = {
  planning: "papaya",
  confirmed: "palm",
  live: "lagoon",
  complete: "neutral",
};

const STATUS_LABEL: Record<TripStatus, string> = {
  planning: "Planning",
  confirmed: "Confirmed",
  live: "In progress",
  complete: "Complete",
};

function countdownCopy(daysUntil: number | null, status: TripStatus): string {
  if (status === "complete") return "Wrapped up";
  if (daysUntil === null) return "Dates to confirm";
  if (daysUntil < 0) return "Under way";
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  if (daysUntil < 31) return `${daysUntil} days away`;
  return `${Math.round(daysUntil / 7)} weeks away`;
}

/**
 * The platform's home screen. Each row is a trip the signed-in user belongs to;
 * with Supabase this becomes a query over `trip_members` for the current user,
 * with RLS doing the filtering rather than the query.
 */
export default function TripsIndexPage() {
  const trips = getTripSummaries();

  return (
    <PhoneFrame>
      <header className="bg-ink px-5 pb-7 pt-8 text-paper">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-lagoon">
          Wayfare
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight">
          Your trips
        </h1>
        <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-paper/70">
          Build an itinerary with the people you&rsquo;re actually going with.
        </p>
      </header>

      <main className="px-5 py-6">
        <ul className="space-y-3">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link
                href={`/trips/${trip.slug}`}
                className="
                  group block rounded-card
                  focus-visible:outline focus-visible:outline-2
                  focus-visible:outline-offset-2 focus-visible:outline-lagoon-dark
                "
              >
                <Card className="p-4 transition-shadow group-hover:shadow-phone">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Overline>{formatDateRange(trip.startDate, trip.endDate)}</Overline>
                      <p className="mt-1 font-display text-2xl font-semibold leading-none text-ink">
                        {trip.coverRoute}
                      </p>
                      <p className="mt-1.5 truncate text-sm font-medium text-ink-text">
                        {trip.name}
                      </p>
                      <p className="text-xs text-muted">{trip.destination}</p>
                    </div>
                    <Pill tone={STATUS_TONE[trip.status]}>
                      {STATUS_LABEL[trip.status]}
                    </Pill>
                  </div>

                  <div className="mt-4" aria-hidden="true">
                    <div className="perf" />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <GroupAvatars
                      size="sm"
                      members={trip.memberInitials.map((initials, index) => ({
                        id: `${trip.id}-${index}`,
                        initials,
                        name: initials,
                      }))}
                    />
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-lagoon-dark">
                      {countdownCopy(trip.daysUntil, trip.status)}
                      <ArrowRight
                        size={12}
                        className="transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>

        {/*
          Creating a trip needs auth and a write path, so it announces itself as
          not-yet-wired rather than pretending to work.
        */}
        <div className="mt-4 rounded-card border border-dashed border-line px-4 py-5 text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted">
            <Plus size={15} aria-hidden="true" />
            New trip
          </span>
          <p className="mt-1 text-xs text-muted">
            Available once accounts are wired up.
          </p>
        </div>
      </main>
    </PhoneFrame>
  );
}
