import type { Metadata } from "next";
import { loadTrip } from "@/lib/data/load";
import { deleteTransportAction } from "@/lib/actions/logistics";
import {
  EditShell,
  EditableRow,
  EmptyHint,
  FormCard,
} from "@/components/edit/EditShell";
import { TransportForm } from "@/components/edit/TransportForm";
import { DeleteButton } from "@/components/form/Fields";

export const metadata: Metadata = { title: "Getting around" };

export default async function TransportEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { detail } = await loadTrip(slug);

  return (
    <EditShell
      title="Getting around"
      meta={`${detail.transport.length} items`}
      backHref={`/trips/${slug}/edit`}
      backLabel="Edit trip"
    >
      <div className="space-y-2">
        {detail.transport.length === 0 ? (
          <EmptyHint>
            Transfers, drivers, boats and hire — add the first one below.
          </EmptyHint>
        ) : (
          detail.transport.map((item) => (
            <EditableRow
              key={item.id}
              summary={item.label}
              detail={`${item.status}${item.cost ? ` · ${item.cost}` : ""}`}
            >
              <TransportForm slug={slug} item={item} />

              <div className="mt-4 border-t border-line pt-4">
                <form action={deleteTransportAction.bind(null, slug)}>
                  <input type="hidden" name="transportId" value={item.id} />
                  <DeleteButton compact confirm={`Delete "${item.label}"?`}>
                    Delete
                  </DeleteButton>
                </form>
              </div>
            </EditableRow>
          ))
        )}
      </div>

      <div className="mt-6">
        <FormCard title="Add transport">
          <TransportForm slug={slug} />
        </FormCard>
      </div>
    </EditShell>
  );
}
