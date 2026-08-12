import type { Metadata } from "next";
import { loadTrip } from "@/lib/data/load";
import { EditShell, FormCard } from "@/components/edit/EditShell";
import { PollForm } from "@/components/edit/PollForm";

export const metadata: Metadata = { title: "Group vote" };

export default async function PollEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { detail } = await loadTrip(slug);

  const votesCast =
    detail.poll?.options.reduce((sum, option) => sum + option.voteCount, 0) ?? 0;

  return (
    <EditShell
      title="Group vote"
      meta={
        detail.poll
          ? `${votesCast} of ${detail.poll.totalVoters} have voted`
          : "Settle something as a group"
      }
      backHref={`/trips/${slug}/edit`}
      backLabel="Edit trip"
    >
      <FormCard title={detail.poll ? "Edit the vote" : "Start a vote"}>
        <PollForm slug={slug} poll={detail.poll} />
      </FormCard>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        One vote each, changeable until it closes. A trip runs one vote at a
        time — voting itself happens on the trip page.
      </p>
    </EditShell>
  );
}
