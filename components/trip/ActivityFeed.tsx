import {
  BedDouble,
  CalendarPlus,
  Plane,
  UserPlus,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TripNotification } from "@/lib/types";
import { formatRelativeTime } from "@/lib/format";
import { Card, SectionHeading } from "@/components/shell/Card";

const KIND_ICONS: Record<TripNotification["kind"], LucideIcon> = {
  booking: BedDouble,
  payment: Wallet,
  flight: Plane,
  member: UserPlus,
  plan: CalendarPlus,
};

export function ActivityFeed({
  notifications,
  now,
}: {
  notifications: TripNotification[];
  now: Date;
}) {
  if (notifications.length === 0) return null;

  return (
    <section aria-labelledby="activity-heading">
      <SectionHeading title="Recent activity" meta="What the group has changed" />
      <div className="px-5">
        <Card className="divide-y divide-line">
          <h3 id="activity-heading" className="sr-only">
            Recent activity
          </h3>
          {notifications.map((item) => {
            const Icon = KIND_ICONS[item.kind];
            return (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lagoon/12 text-lagoon-dark"
                  aria-hidden="true"
                >
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-ink-text">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {item.body}
                  </p>
                </div>
                <time
                  dateTime={item.createdAt}
                  className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted"
                >
                  {formatRelativeTime(item.createdAt, now)}
                </time>
              </div>
            );
          })}
        </Card>
      </div>
    </section>
  );
}
