import { ArrowRight, Clock } from "lucide-react";
import type { Flight } from "@/lib/types";
import { formatOffsetDate, formatOffsetTime } from "@/lib/format";
import { Card, Overline, Pill, SectionHeading } from "@/components/shell/Card";
import { StubDivider } from "@/components/shell/SectionDivider";

const STATUS_TONE = {
  confirmed: "palm",
  "on-time": "palm",
  delayed: "papaya",
  cancelled: "stamp",
} as const;

const STATUS_LABEL = {
  confirmed: "Confirmed",
  "on-time": "On time",
  delayed: "Delayed",
  cancelled: "Cancelled",
} as const;

/**
 * Signature pattern 2 — the boarding pass.
 *
 * Two-part card: flight info on the left, a torn-off barcode stub on the right,
 * separated by a vertical perforation. The barcode is decorative; real
 * scannable codes are a later integration.
 */
function BoardingPass({ flight }: { flight: Flight }) {
  return (
    <Card as="article" className="overflow-hidden">
      <div className="flex items-stretch">
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-center justify-between gap-2">
            <Overline>
              {flight.direction === "outbound" ? "Outbound" : "Return"}
            </Overline>
            <Pill tone={STATUS_TONE[flight.status]}>
              {STATUS_LABEL[flight.status]}
            </Pill>
          </div>

          <div className="mt-3 flex items-end gap-3">
            <div>
              <p className="font-display text-2xl font-semibold leading-none text-ink">
                {flight.originCode}
              </p>
              <p className="mt-1 text-[11px] text-muted">{flight.originCity}</p>
            </div>

            <ArrowRight
              size={16}
              className="mb-4 shrink-0 text-lagoon"
              aria-hidden="true"
            />

            <div>
              <p className="font-display text-2xl font-semibold leading-none text-ink">
                {flight.destinationCode}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {flight.destinationCity}
              </p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <dt>
                <Overline>Departs</Overline>
              </dt>
              <dd className="mt-0.5 font-mono text-sm font-semibold text-ink-text">
                {formatOffsetTime(flight.departsAt)}
              </dd>
              <dd className="text-[10px] text-muted">
                {formatOffsetDate(flight.departsAt)}
              </dd>
            </div>
            <div>
              <dt>
                <Overline>Arrives</Overline>
              </dt>
              <dd className="mt-0.5 font-mono text-sm font-semibold text-ink-text">
                {formatOffsetTime(flight.arrivesAt)}
              </dd>
              <dd className="text-[10px] text-muted">
                {formatOffsetDate(flight.arrivesAt)}
              </dd>
            </div>
            <div>
              <dt>
                <Overline>Seats</Overline>
              </dt>
              <dd className="mt-0.5 font-mono text-sm font-semibold text-ink-text">
                {flight.seatLabel ?? "—"}
              </dd>
              <dd className="text-[10px] text-muted">
                {flight.gate ? `Gate ${flight.gate}` : "Gate TBA"}
              </dd>
            </div>
          </dl>

          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted">
            <Clock size={12} aria-hidden="true" />
            {flight.durationLabel} · {flight.airline} {flight.flightNumber}
          </p>
        </div>

        <StubDivider />

        {/* Torn-off stub. */}
        <div className="flex w-[76px] shrink-0 flex-col items-center justify-between bg-paper-hi px-2 py-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
            {flight.flightNumber}
          </p>
          <div
            className="barcode my-3 h-24 w-8 opacity-80"
            role="img"
            aria-label={`Barcode placeholder for booking ${flight.reference}`}
          />
          <p className="font-mono text-[9px] font-semibold tracking-[0.08em] text-ink-text">
            {flight.reference}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function BoardingPassList({ flights }: { flights: Flight[] }) {
  return (
    <section id="flights" aria-labelledby="flights-heading">
      <SectionHeading
        title="Flights"
        meta={`${flights.length} legs · one booking reference`}
      />
      <h3 id="flights-heading" className="sr-only">
        Flights
      </h3>
      <div className="space-y-3 px-5">
        {flights.map((flight) => (
          <BoardingPass key={flight.id} flight={flight} />
        ))}
      </div>
    </section>
  );
}
