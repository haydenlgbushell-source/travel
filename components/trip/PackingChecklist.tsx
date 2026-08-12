"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import type { PackingItem, TripMember } from "@/lib/types";
import { Card, Overline, SectionHeading } from "@/components/shell/Card";

/**
 * Checked state is per-user in the real product — a `packing_checks` row keyed
 * by (item_id, user_id) rather than a boolean on the item, so two people can
 * tick "sunscreen" independently. Group-kit items stay assigned to one member.
 */
export function PackingChecklist({
  items,
  members,
}: {
  items: PackingItem[];
  members: TripMember[];
}) {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(items.filter((item) => item.isDone).map((item) => item.id)),
  );

  const groups = useMemo(() => {
    const byCategory = new Map<string, PackingItem[]>();
    for (const item of items) {
      const bucket = byCategory.get(item.category) ?? [];
      bucket.push(item);
      byCategory.set(item.category, bucket);
    }
    return [...byCategory.entries()];
  }, [items]);

  const memberNames = useMemo(
    () => new Map(members.map((m) => [m.id, m.name])),
    [members],
  );

  const toggle = (id: string) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const doneCount = items.filter((item) => checked.has(item.id)).length;
  const progress = Math.round((doneCount / items.length) * 100);

  return (
    <section aria-labelledby="packing-heading">
      <SectionHeading
        title="Packing list"
        meta={`${doneCount} of ${items.length} packed`}
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
                  const isChecked = checked.has(item.id);
                  const owner = item.assignedToMemberId
                    ? memberNames.get(item.assignedToMemberId)
                    : undefined;

                  return (
                    <li key={item.id}>
                      <label className="flex cursor-pointer items-center gap-2.5 py-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(item.id)}
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
                              isChecked
                                ? "border-palm bg-palm text-paper-hi"
                                : "border-line bg-paper"
                            }
                          `}
                        >
                          {isChecked ? <Check size={12} strokeWidth={3} /> : null}
                        </span>

                        <span
                          className={`flex-1 text-sm transition-colors ${
                            isChecked
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
