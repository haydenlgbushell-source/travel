import type { Metadata } from "next";
import { loadTrip } from "@/lib/data/load";
import { deletePackingItemAction } from "@/lib/actions/engagement";
import { EditShell, EmptyHint, FormCard } from "@/components/edit/EditShell";
import { AddPackingItemForm } from "@/components/edit/PackingForm";
import { DeleteButton } from "@/components/form/Fields";

export const metadata: Metadata = { title: "Packing list" };

export default async function PackingEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { detail } = await loadTrip(slug);

  const memberName = new Map(detail.trip.members.map((m) => [m.id, m.name]));
  const categories = [...new Set(detail.packing.map((item) => item.category))];

  const grouped = categories.map((category) => ({
    category,
    items: detail.packing.filter((item) => item.category === category),
  }));

  return (
    <EditShell
      title="Packing list"
      meta={`${detail.packing.length} items`}
      backHref={`/trips/${slug}/edit`}
      backLabel="Edit trip"
    >
      {detail.packing.length === 0 ? (
        <EmptyHint>The list is empty. Add the first thing below.</EmptyHint>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ category, items }) => (
            <section key={category}>
              <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                {category}
              </h2>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-card border border-line bg-paper-hi px-4 py-2.5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink-text">
                        {item.label}
                      </span>
                      {item.assignedToMemberId ? (
                        <span className="block text-xs text-muted">
                          {memberName.get(item.assignedToMemberId)} brings this
                        </span>
                      ) : null}
                    </span>

                    <form action={deletePackingItemAction.bind(null, slug)}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <DeleteButton compact confirm={`Remove "${item.label}"?`}>
                        Remove
                      </DeleteButton>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="mt-6">
        <FormCard title="Add an item">
          <AddPackingItemForm
            slug={slug}
            members={detail.trip.members}
            categories={categories}
          />
        </FormCard>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Ticking things off happens on the trip page, and it&rsquo;s per person —
        everyone has their own copy of the list.
      </p>
    </EditShell>
  );
}
