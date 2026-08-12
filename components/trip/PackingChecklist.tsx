"use client";

import { useMemo, useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import type { PackingItem, TripMember } from "@/lib/types";
import { togglePackingCheckAction } from "@/lib/actions/engagement";
import { Card, Overline, SectionHeading } from "@/components/shell/Card";

/**
 * Ticks are per user — a `packing_checks` row for (item, viewer) — so two
 * people can each pack their own sunscreen without fighting over one flag.
 * Group-kit items stay assigned to whoever is bringing them.
 */
export function PackingChecklist({
  slug,
  items,
  members,
}: {
  slug: string;
  items: PackingItem[];
  members: TripMember[];
}) {
  const [, startTransition] = useTransition();

  const [checked, toggle] = useOptimistic(
    items,
    (current, itemId: string) =>
      current.map((item) =>
        item.id === itemId ? { ...item, isDone: !item.isDone } : item,
      ),
  );

  const groups = useMemo(() => {
    const byCategory = new Map<string, PackingItem[]>();
    for (const item of checked) {
      const bucket = byCategory.get(item.category) ?? [];
      bucket.push(item);
      byCategory.set(item.category, bucket);
    }
    return [...byCategory.entries()];
  }, [checked]);

  const memberNames = useMemo(
    () => new Map(members.map((m) => [m.id, m.name])),
    [members],
  );

  const doneCount = checked.filter((item) => item.isDone).length;
  const progress =
    checked.length > 0 ? Math.round((doneCount / checked.length) * 100) : 0;

  return (
    <section aria-labelledby="packing-heading">
      <SectionHeading
        title="Packing list"
        meta={`${doneCount} of ${checked.length} packed`}
      />

      <div className="px-5">
        <Card className="overflow-hidden">
          <h3 id="packing-heading" className="sr-only">
            Packing list
          </h3>

          <div className="px-4 pt-4">
            <div
              className="h-1.5 overflow-hidden rounded-pill bg-line"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Packing progress"
            >
              <div
                className="h-full rounded-pill bg-palm transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {groups.map(([category, categoryItems]) => (
            <div key={category} className="px-4 py-3">
              <Overline>{category}</Overline>
              <ul className="mt-2 space-y-1">
                {categoryItems.map((item) => {
                  const owner = item.assignedToMemberId
                    ? memberNames.get(item.assignedToMemberId)
                    : undefined;

                  return (
                    <li key={item.id}>
                      <label className="flex cursor-pointer items-center gap-2.5 py-1">
                        <input
                          type="checkbox"
                          checked={item.isDone}
                          onChange={() =>
                            startTransition(async () => {
                              toggle(item.id);
                              await togglePackingCheckAction(slug, item.id);
                            })
                          }
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={`
                            flex h-[18px] w-[18px] shrink-0 items-center justify-center
                            rounded-[5px] border transition-colors
                            peer-focus-visible:outline peer-focus-visible:outline-2
                            peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lagoon-dark
                            ${
                              item.isDone
                                ? "border-palm bg-palm text-paper-hi"
                                : "border-line bg-paper"
                            }
                          `}
                        >
                          {item.isDone ? <Check size={12} strokeWidth={3} /> : null}
                        </span>

                        <span
                          className={`flex-1 text-sm transition-colors ${
                            item.isDone
                              ? "text-muted line-through"
                              : "text-ink-text"
                          }`}
                        >
                          {item.label}
                        </span>

                        {owner ? (
                          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted">
                            {owner}
                          </span>
                        ) : null}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </Card>
      </div>
    </section>
  );
}
