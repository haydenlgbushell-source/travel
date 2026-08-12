import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BedDouble,
  Bus,
  CalendarDays,
  ChevronRight,
  Megaphone,
  Plane,
  Receipt,
  Settings,
  Users,
  Vote,
  Luggage,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getTripDetail } from "@/lib/data/store";
import { deleteTripAction } from "@/lib/actions/trips";
import { EditShell } from "@/components/edit/EditShell";
import { DeleteButton } from "@/components/form/Fields";

export const metadata: Metadata = { title: "Edit trip" };

interface SectionLink {
  href: string;
  label: string;
  meta: string;
  icon: LucideIcon;
}

export default async function EditHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const detail = await getTripDetail(slug, user.id);
  if (!detail) notFound();

  const eventCount = detail.days.reduce((sum, day) => sum + day.events.length, 0);

  const sections: SectionLink[] = [
    {
      href: `/trips/${slug}/edit/settings`,
      label: "Trip details",
      meta: `${detail.trip.destination} · ${detail.trip.status}`,
      icon: Settings,
    },
    {
      href: `/trips/${slug}/edit/members`,
      label: "People",
      meta: countLabel(detail.trip.members.length, "person", "people"),
      icon: Users,
    },
    {
      href: `/trips/${slug}/edit/stay`,
      label: "Accommodation",
      meta: detail.accommodation?.name ?? "Nothing added yet",
      icon: BedDouble,
    },
    {
      href: `/trips/${slug}/edit/flights`,
      label: "Flights",
      meta: countLabel(detail.flights.length, "leg", "legs"),
      icon: Plane,
    },
    {
      href: `/trips/${slug}/edit/transport`,
      label: "Getting around",
      meta: countLabel(detail.transport.length, "item", "items"),
      icon: Bus,
    },
    {
      href: `/trips/${slug}/edit/plan`,
      label: "The plan",
      meta: `${countLabel(eventCount, "item", "items")} across ${detail.days.length} days`,
      icon: CalendarDays,
    },
    {
      href: `/trips/${slug}/edit/budget`,
      label: "Budget",
      meta: countLabel(detail.budget.expenses.length, "expense", "expenses"),
      icon: Receipt,
    },
    {
      href: `/trips/${slug}/edit/packing`,
      label: "Packing list",
      meta: countLabel(detail.packing.length, "item", "items"),
      icon: Luggage,
    },
    {
      href: `/trips/${slug}/edit/poll`,
      label: "Group vote",
      meta: detail.poll ? detail.poll.question : "No vote running",
      icon: Vote,
    },
    {
      href: `/trips/${slug}/edit/alerts`,
      label: "Alerts",
      meta: countLabel(detail.alerts.length, "showing", "showing"),
      icon: Megaphone,
    },
  ];

  return (
    <EditShell
      title={detail.trip.name}
      meta="Everything in this trip, editable."
      backHref={`/trips/${slug}`}
      backLabel="Back to the trip"
    >
      <ul className="space-y-2">
        {sections.map(({ href, label, meta, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="
                flex items-center gap-3 rounded-card border border-line bg-paper-hi
                px-4 py-3 transition-colors hover:border-lagoon/40
                focus-visible:outline focus-visible:outline-2
                focus-visible:outline-offset-2 focus-visible:outline-lagoon-dark
              "
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card bg-paper text-lagoon-dark"
                aria-hidden="true"
              >
                <Icon size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink-text">
                  {label}
                </span>
                <span className="block truncate text-xs text-muted">{meta}</span>
              </span>
              <ChevronRight
                size={15}
                className="shrink-0 text-muted"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 border-t border-line pt-5">
        <form action={deleteTripAction.bind(null, slug)}>
          <DeleteButton
            confirm={`Delete "${detail.trip.name}" and everything in it? This can't be undone.`}
          >
            Delete this trip
          </DeleteButton>
        </form>
      </div>
    </EditShell>
  );
}

function countLabel(count: number, singular: string, plural: string): string {
  if (count === 0) return `No ${plural} yet`;
  return `${count} ${count === 1 ? singular : plural}`;
}
