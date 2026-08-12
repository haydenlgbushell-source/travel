import type { Metadata } from "next";
import { loadTrip } from "@/lib/data/load";
import { EditShell, EmptyHint, FormCard } from "@/components/edit/EditShell";
import { AlertForm } from "@/components/edit/AlertForm";

export const metadata: Metadata = { title: "Alerts" };

const TONE_LABELS = {
  urgent: "Needs attention",
  info: "Heads up",
  success: "Good news",
} as const;

export default async function AlertsEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { detail } = await loadTrip(slug);

  return (
    <EditShell
      title="Alerts"
      meta="Pinned to the top of the trip"
      backHref={`/trips/${slug}/edit`}
      backLabel="Edit trip"
    >
      {detail.alerts.length === 0 ? (
        <EmptyHint>No alerts showing for you right now.</EmptyHint>
      ) : (
        <ul className="space-y-2">
          {detail.alerts.map((alert) => (
            <li
              key={alert.id}
              className="rounded-card border border-line bg-paper-hi px-4 py-3"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                {TONE_LABELS[alert.tone]}
              </p>
              <p className="mt-1 text-sm font-semibold text-ink-text">
                {alert.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                {alert.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <FormCard title="Post an alert">
          <AlertForm slug={slug} />
        </FormCard>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Dismissing an alert on the trip page only hides it for the person who
        dismissed it — which is why one you&rsquo;ve dismissed won&rsquo;t be
        listed here either.
      </p>
    </EditShell>
  );
}
