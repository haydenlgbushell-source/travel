import Link from "next/link";
import { ChevronLeft, MapPin } from "lucide-react";
import type { Trip } from "@/lib/types";
import { formatDateRange, tripCountdownLabel } from "@/lib/format";
import { GroupAvatars } from "./GroupAvatars";

const STATUS_COPY: Record<Trip["status"], { label: string; dot: string }> = {
  planning: { label: "Planning", dot: "bg-papaya" },
  confirmed: { label: "Confirmed", dot: "bg-palm" },
  live: { label: "In progress", dot: "bg-papaya" },
  complete: { label: "Complete", dot: "bg-muted" },
};

/**
 * Hero. The route code is the trip's identity in this design — display face,
 * oversized, with the destination and dates hanging off it.
 */
export function TripHeader({ trip, now }: { trip: Trip; now: Date }) {
  const status = STATUS_COPY[trip.status];
  const countdown = tripCountdownLabel(trip.startDate, trip.endDate, now);

  return (
    <header
      id="trip"
      className="relative overflow-hidden bg-ink px-5 pb-8 pt-5 text-paper"
    >
      {/* Faint boarding-pass guilloche behind the hero content. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border-[24px] border-ink-soft/60"
      />

      <div className="relative flex items-center justify-between">
        <Link
          href="/"
          className="
            -ml-2 inline-flex items-center gap-1 rounded-pill px-2 py-1 text-xs
            font-medium text-paper/70 transition-colors hover:text-paper
            focus-visible:outline focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-paper
          "
        >
          <ChevronLeft size={14} aria-hidden="true" />
          All trips
        </Link>

        <span className="inline-flex items-center gap-1.5 rounded-pill bg-ink-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-paper/80">
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
          {status.label}
        </span>
      </div>

      <p className="relative mt-6 font-mono text-[11px] uppercase tracking-[0.32em] text-lagoon">
        {formatDateRange(trip.startDate, trip.endDate)}
      </p>

      <h1 className="relative mt-1.5 font-display text-[40px] font-semibold leading-none tracking-tight">
        {trip.coverRoute}
      </h1>

      <p className="relative mt-3 flex items-center gap-1.5 text-sm text-paper/75">
        <MapPin size={14} aria-hidden="true" />
        {trip.name} · {trip.destination}
      </p>

      <div className="relative mt-6 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/50">
            Countdown
          </p>
          <p className="mt-0.5 font-display text-lg font-semibold">{countdown}</p>
        </div>
        <GroupAvatars members={trip.members} surface="ink" />
      </div>
    </header>
  );
}
