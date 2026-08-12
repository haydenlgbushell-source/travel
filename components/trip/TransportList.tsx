import { Bike, Bus, Car, Ship } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TransportItem } from "@/lib/types";
import { Card, Pill, SectionHeading } from "@/components/shell/Card";

const KIND_ICONS: Record<TransportItem["kind"], LucideIcon> = {
  transfer: Bus,
  scooter: Bike,
  driver: Car,
  ferry: Ship,
};

const STATUS_TONE = {
  booked: "palm",
  pending: "papaya",
  idea: "neutral",
} as const;

const STATUS_LABEL = {
  booked: "Booked",
  pending: "Pending",
  idea: "Idea",
} as const;

export function TransportList({ transport }: { transport: TransportItem[] }) {
  const pending = transport.filter((t) => t.status !== "booked").length;

  return (
    <section aria-labelledby="transport-heading">
      <SectionHeading
        title="Getting around"
        meta={pending > 0 ? `${pending} still to sort` : "All booked"}
      />
      <div className="px-5">
        <Card className="divide-y divide-line">
          <h3 id="transport-heading" className="sr-only">
            Getting around
          </h3>
          {transport.map((item) => {
            const Icon = KIND_ICONS[item.kind];
            return (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-card bg-paper text-lagoon-dark"
                  aria-hidden="true"
                >
                  <Icon size={15} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold leading-snug text-ink-text">
                      {item.label}
                    </p>
                    <Pill tone={STATUS_TONE[item.status]}>
                      {STATUS_LABEL[item.status]}
                    </Pill>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {item.detail}
                  </p>
                </div>

                {item.cost ? (
                  <p className="shrink-0 whitespace-nowrap font-mono text-xs font-semibold text-ink-text">
                    {item.cost}
                  </p>
                ) : null}
              </div>
            );
          })}
        </Card>
      </div>
    </section>
  );
}
