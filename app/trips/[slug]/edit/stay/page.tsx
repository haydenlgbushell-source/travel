import type { Metadata } from "next";
import { loadTrip } from "@/lib/data/load";
import { EditShell, FormCard } from "@/components/edit/EditShell";
import { AccommodationForm } from "@/components/edit/AccommodationForm";

export const metadata: Metadata = { title: "Accommodation" };

export default async function StayEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { detail } = await loadTrip(slug);

  return (
    <EditShell
      title="Accommodation"
      meta={detail.accommodation ? "Edit the booking" : "Add where you're staying"}
      backHref={`/trips/${slug}/edit`}
      backLabel="Edit trip"
    >
      <FormCard title={detail.accommodation ? "The stay" : "Add a stay"}>
        <AccommodationForm slug={slug} stay={detail.accommodation} />
      </FormCard>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Nights are worked out from the dates. A trip holds one stay today —
        multi-leg trips need a list here, which is a schema change rather than a
        form change.
      </p>
    </EditShell>
  );
}
