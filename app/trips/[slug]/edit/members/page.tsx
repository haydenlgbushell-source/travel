import type { Metadata } from "next";
import { loadTrip } from "@/lib/data/load";
import { EditShell, FormCard } from "@/components/edit/EditShell";
import { AddMemberForm, MemberRow } from "@/components/edit/MemberForms";

export const metadata: Metadata = { title: "People" };

export default async function MembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { detail } = await loadTrip(slug);

  const members = detail.trip.members;
  const organiserCount = members.filter((m) => m.role === "organiser").length;

  return (
    <EditShell
      title="People"
      meta={`${members.length} on this trip`}
      backHref={`/trips/${slug}/edit`}
      backLabel="Edit trip"
    >
      <div className="space-y-2">
        {members.map((member) => (
          <MemberRow
            key={member.id}
            slug={slug}
            member={member}
            canRemove={members.length > 1}
            isLastOrganiser={member.role === "organiser" && organiserCount === 1}
          />
        ))}
      </div>

      <div className="mt-6">
        <FormCard title="Add someone">
          <AddMemberForm slug={slug} />
        </FormCard>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        People are added by name for now. Once accounts are wired up this
        becomes an email invite, and the member row links to a real profile.
      </p>
    </EditShell>
  );
}
