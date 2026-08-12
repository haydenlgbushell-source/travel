import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getTripDetail } from "@/lib/data/store";
import { loadTrip } from "@/lib/data/load";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { ShortcutNav } from "@/components/shell/ShortcutNav";
import { SectionDivider } from "@/components/shell/SectionDivider";
import { TripHeader } from "@/components/trip/TripHeader";
import { AlertBanner } from "@/components/trip/AlertBanner";
import { ActivityFeed } from "@/components/trip/ActivityFeed";
import { StayCard } from "@/components/trip/StayCard";
import { TripMap } from "@/components/trip/TripMap";
import { WeatherWidget } from "@/components/trip/WeatherWidget";
import { BoardingPassList } from "@/components/trip/BoardingPassList";
import { TransportList } from "@/components/trip/TransportList";
import { DayPlan } from "@/components/trip/DayPlan";
import { BudgetReceipt } from "@/components/trip/BudgetReceipt";
import { PollCard } from "@/components/trip/PollCard";
import { PackingChecklist } from "@/components/trip/PackingChecklist";
import { TicketWallet } from "@/components/trip/TicketWallet";
import { EntryRequirements } from "@/components/trip/EntryRequirements";
import { EmergencyCard } from "@/components/trip/EmergencyCard";
import { TripActions } from "@/components/trip/TripActions";

/**
 * Rendered per request: the page reflects writes made moments earlier, and
 * per-user state (votes, packing ticks, dismissed alerts) is resolved against
 * whoever is viewing.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const user = await getCurrentUser();
  const detail = await getTripDetail(slug, user.id);
  if (!detail) return { title: "Trip not found" };

  return {
    title: detail.trip.name,
    description: `${detail.trip.coverRoute} · ${detail.trip.destination}`,
  };
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { detail } = await loadTrip(slug);

  // One `now` for the whole render, so the countdown and every relative
  // timestamp agree with each other.
  const now = new Date();

  return (
    <PhoneFrame>
      <TripHeader trip={detail.trip} now={now} />

      <AlertBanner slug={slug} alerts={detail.alerts} />

      <main className="pb-6">
        <div className="px-5 pt-5">
          <Link
            href={`/trips/${slug}/edit`}
            className="
              inline-flex items-center gap-2 rounded-card border border-line
              bg-paper-hi px-3.5 py-2 text-sm font-semibold text-ink-text
              transition-colors hover:border-lagoon/40
              focus-visible:outline focus-visible:outline-2
              focus-visible:outline-offset-2 focus-visible:outline-lagoon-dark
            "
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            Edit this trip
          </Link>
        </div>

        <div className="pt-5">
          <DayPlan days={detail.days} />
        </div>

        <SectionDivider />
        <StayCard slug={slug} stay={detail.accommodation} />

        <SectionDivider />
        <TripMap label={detail.mapLabel} />

        {detail.weather.length > 0 ? (
          <>
            <SectionDivider />
            <WeatherWidget days={detail.weather} />
          </>
        ) : null}

        <SectionDivider />
        <BoardingPassList slug={slug} flights={detail.flights} />

        {detail.transport.length > 0 ? (
          <>
            <SectionDivider />
            <TransportList transport={detail.transport} />
          </>
        ) : null}

        <SectionDivider />
        <BudgetReceipt
          slug={slug}
          budget={detail.budget}
          members={detail.trip.members}
        />

        {detail.poll ? (
          <>
            <SectionDivider />
            <PollCard slug={slug} poll={detail.poll} />
          </>
        ) : null}

        {detail.packing.length > 0 ? (
          <>
            <SectionDivider />
            <PackingChecklist
              slug={slug}
              items={detail.packing}
              members={detail.trip.members}
            />
          </>
        ) : null}

        {detail.wallet.length > 0 ? (
          <>
            <SectionDivider />
            <TicketWallet tickets={detail.wallet} />
          </>
        ) : null}

        <SectionDivider />
        <EntryRequirements
          requirements={detail.entryRequirements}
          destination={detail.trip.destination}
        />

        {detail.emergencyContacts.length > 0 ? (
          <>
            <SectionDivider />
            <EmergencyCard contacts={detail.emergencyContacts} />
          </>
        ) : null}

        {detail.notifications.length > 0 ? (
          <>
            <SectionDivider />
            <ActivityFeed notifications={detail.notifications} now={now} />
          </>
        ) : null}

        <SectionDivider />
        <TripActions trip={detail.trip} days={detail.days} />
      </main>

      <ShortcutNav />
    </PhoneFrame>
  );
}
