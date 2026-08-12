import { CircleAlert, CircleCheck, CircleDashed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EntryRequirement } from "@/lib/types";
import { Card, SectionHeading } from "@/components/shell/Card";

const STATUS_STYLES: Record<
  EntryRequirement["status"],
  { icon: LucideIcon; className: string; label: string }
> = {
  required: { icon: CircleAlert, className: "text-stamp", label: "Required" },
  recommended: {
    icon: CircleDashed,
    className: "text-papaya",
    label: "Recommended",
  },
  "not-required": {
    icon: CircleCheck,
    className: "text-palm",
    label: "Not required",
  },
};

/**
 * Reference content, per destination. This is what the shortcut nav's last slot
 * points at now that the document vault is gone — read-only guidance, nothing
 * personal stored.
 */
export function EntryRequirements({
  requirements,
  destination,
}: {
  requirements: EntryRequirement[];
  destination: string;
}) {
  if (requirements.length === 0) {
    return (
      <section id="info" aria-labelledby="entry-heading">
        <SectionHeading title="Entry requirements" meta={destination} />
        <h3 id="entry-heading" className="sr-only">
          Entry requirements
        </h3>
        <p className="mx-5 rounded-card border border-dashed border-line px-4 py-5 text-center text-sm text-muted">
          Nothing recorded for this destination yet. Entry rules are reference
          content maintained per destination, not something you enter per trip.
        </p>
      </section>
    );
  }

  return (
    <section id="info" aria-labelledby="entry-heading">
      <SectionHeading
        title="Entry requirements"
        meta={`Entering ${destination} on an Australian passport`}
      />

      <div className="px-5">
        <Card className="divide-y divide-line">
          <h3 id="entry-heading" className="sr-only">
            Entry requirements
          </h3>

          {requirements.map((item) => {
            const style = STATUS_STYLES[item.status];
            const Icon = style.icon;

            return (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                <Icon
                  size={15}
                  className={`mt-0.5 shrink-0 ${style.className}`}
                  aria-label={style.label}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug text-ink-text">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {item.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </Card>

        <p className="mt-2 px-1 text-[11px] leading-relaxed text-muted">
          Guidance only — check the official source before you travel. Nothing
          here is stored against your account.
        </p>
      </div>
    </section>
  );
}
