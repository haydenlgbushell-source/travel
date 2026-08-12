import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllTripSlugs, getTrip } from "@/lib/mock-data";
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

export function generateStaticParams() {
  return getAllTripSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = getTrip(slug);
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
  const detail = getTrip(slug);
  if (!detail) notFound();

  /*
   * One `now` for the whole render. Relative timestamps and the countdown are
   * derived from it, so server and client agree and nothing flickers on
   * hydrate. Once trips are user-owned this comes from the request, not module
   * scope.
   */
  const now = new Date();

  return (
    <PhoneFrame>
      <TripHeader trip={detail.trip} now={now} />

      <AlertBanner alerts={detail.alerts} />

      <main className="pb-6">
        <div className="pt-5">
          <DayPlan days={detail.days} />
        </div>

        <SectionDivider />
        <StayCard stay={detail.accommodation} />

        <SectionDivider />
        <TripMap label={detail.mapLabel} />

        <SectionDivider />
        <WeatherWidget days={detail.weather} />

        <SectionDivider />
        <BoardingPassList flights={detail.flights} />

        <SectionDivider />
        <TransportList transport={detail.transport} />

        <SectionDivider />
        <BudgetReceipt budget={detail.budget} members={detail.trip.members} />

        <SectionDivider />
        <PollCard poll={detail.poll} />

        <SectionDivider />
        <PackingChecklist items={detail.packing} members={detail.trip.members} />

        <SectionDivider />
        <TicketWallet tickets={detail.wallet} />

        <SectionDivider />
        <EntryRequirements
          requirements={detail.entryRequirements}
          destination={detail.trip.destination}
        />

        <SectionDivider />
        <EmergencyCard contacts={detail.emergencyContacts} />

        <SectionDivider />
        <ActivityFeed notifications={detail.notifications} now={now} />

        <SectionDivider />
        <TripActions trip={detail.trip} days={detail.days} />
      </main>

      <ShortcutNav />
    </PhoneFrame>
  );
}
