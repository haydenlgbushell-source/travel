import type { Metadata } from "next";
import { loadTrip } from "@/lib/data/load";
import { EditShell } from "@/components/edit/EditShell";
import { TripForm } from "@/components/edit/TripForm";

export const metadata: Metadata = { title: "Trip details" };

export default async function TripSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { detail, mapLabel } = await loadTrip(slug);

  return (
    <EditShell
      title="Trip details"
      meta="Name, dates, budget target and status."
      backHref={`/trips/${slug}/edit`}
      backLabel="Edit trip"
    >
      <TripForm
        existing={{
          trip: detail.trip,
          currency: detail.budget.currency,
          perPersonTarget: (detail.budget.perPersonTargetCents / 100).toFixed(2),
          mapLabel,
        }}
      />

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Shortening the dates keeps every plan item — anything falling outside the
        new range moves to the nearest day rather than disappearing.
      </p>
    </EditShell>
  );
}
