import type { Metadata } from "next";
import { loadTrip } from "@/lib/data/load";
import { deleteFlightAction } from "@/lib/actions/logistics";
import { formatOffsetDate, formatOffsetTime } from "@/lib/format";
import {
  EditShell,
  EditableRow,
  EmptyHint,
  FormCard,
} from "@/components/edit/EditShell";
import { FlightForm } from "@/components/edit/FlightForm";
import { DeleteButton } from "@/components/form/Fields";

export const metadata: Metadata = { title: "Flights" };

export default async function FlightsEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { detail } = await loadTrip(slug);

  return (
    <EditShell
      title="Flights"
      meta={`${detail.flights.length} legs`}
      backHref={`/trips/${slug}/edit`}
      backLabel="Edit trip"
    >
      <div className="space-y-2">
        {detail.flights.length === 0 ? (
          <EmptyHint>No flights yet. Add the first leg below.</EmptyHint>
        ) : (
          detail.flights.map((flight) => (
            <EditableRow
              key={flight.id}
              summary={`${flight.originCode} → ${flight.destinationCode} · ${flight.flightNumber}`}
              detail={`${formatOffsetDate(flight.departsAt)}, ${formatOffsetTime(flight.departsAt)} · ${flight.airline}`}
            >
              <FlightForm slug={slug} flight={flight} />

              <div className="mt-4 border-t border-line pt-4">
                <form action={deleteFlightAction.bind(null, slug)}>
                  <input type="hidden" name="flightId" value={flight.id} />
                  <DeleteButton
                    compact
                    confirm={`Delete ${flight.flightNumber} from the trip?`}
                  >
                    Delete this flight
                  </DeleteButton>
                </form>
              </div>
            </EditableRow>
          ))
        )}
      </div>

      <div className="mt-6">
        <FormCard title="Add a flight">
          <FlightForm slug={slug} />
        </FormCard>
      </div>
    </EditShell>
  );
}
