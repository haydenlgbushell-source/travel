import { ExternalLink, Users } from "lucide-react";
import type { Accommodation } from "@/lib/types";
import { formatShortDate } from "@/lib/format";
import { Card, Overline, Pill, SectionHeading } from "@/components/shell/Card";

export function StayCard({ stay }: { stay: Accommodation }) {
  return (
    <section id="stay" aria-labelledby="stay-heading">
      <SectionHeading
        title="Where you're staying"
        meta={`${stay.nights} nights · ${stay.guests} guests`}
      />

      <div className="px-5">
        <Card>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3
                  id="stay-heading"
                  className="font-display text-base font-semibold leading-tight text-ink"
                >
                  {stay.name}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {stay.address}
                </p>
              </div>
              <Pill tone="palm">Booked</Pill>
            </div>

            {stay.notes ? (
              <p className="mt-3 text-xs leading-relaxed text-ink-text/75">
                {stay.notes}
              </p>
            ) : null}
          </div>

          {/* Perforation across the card: notches show the page through. */}
          <div className="px-4" aria-hidden="true">
            <div className="perf" />
          </div>

          <div className="grid grid-cols-2 gap-px bg-line/60 p-px">
            <div className="bg-paper-hi px-4 py-3">
              <Overline>Check in</Overline>
              <p className="mt-1 font-mono text-sm font-semibold text-ink-text">
                {formatShortDate(stay.checkIn)}
              </p>
              <p className="text-[11px] text-muted">from 14:00</p>
            </div>
            <div className="bg-paper-hi px-4 py-3">
              <Overline>Check out</Overline>
              <p className="mt-1 font-mono text-sm font-semibold text-ink-text">
                {formatShortDate(stay.checkOut)}
              </p>
              <p className="text-[11px] text-muted">by 11:00</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <div className="min-w-0">
              <Overline>Reference</Overline>
              <p className="mt-0.5 truncate font-mono text-xs font-semibold tracking-wide text-ink-text">
                {stay.reference}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                <Users size={12} aria-hidden="true" />
                {stay.guests}
              </span>
              {stay.bookingUrl ? (
                <a
                  href={stay.bookingUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="
                    inline-flex items-center gap-1 rounded-pill bg-lagoon-dark px-3 py-1.5
                    text-[11px] font-semibold text-paper-hi transition-opacity hover:opacity-90
                    focus-visible:outline focus-visible:outline-2
                    focus-visible:outline-offset-2 focus-visible:outline-lagoon-dark
                  "
                >
                  Booking
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
