"use client";

import { useOptimistic, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { TripAlert } from "@/lib/types";
import { dismissAlertAction } from "@/lib/actions/engagement";

const TONES = {
  urgent: {
    wrap: "border-stamp/30 bg-stamp/10 text-stamp",
    icon: AlertTriangle,
  },
  info: {
    wrap: "border-lagoon/30 bg-lagoon/10 text-lagoon-dark",
    icon: Info,
  },
  success: {
    wrap: "border-palm/30 bg-palm/10 text-palm",
    icon: CheckCircle2,
  },
} as const;

/**
 * Dismissal writes an `alert_dismissals` row for this user, so it sticks across
 * devices and doesn't hide the alert from anyone else. The optimistic update
 * removes it immediately; if the action fails React restores it.
 */
export function AlertBanner({
  slug,
  alerts,
}: {
  slug: string;
  alerts: TripAlert[];
}) {
  const [, startTransition] = useTransition();
  const [visible, dismiss] = useOptimistic(alerts, (current, id: string) =>
    current.filter((alert) => alert.id !== id),
  );

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 px-5 pt-5">
      {visible.map((alert) => {
        const tone = TONES[alert.tone];
        const Icon = tone.icon;

        return (
          <div
            key={alert.id}
            role="status"
            className={`flex items-start gap-2.5 rounded-card border px-3.5 py-3 ${tone.wrap}`}
          >
            <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug">{alert.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-text/80">
                {alert.body}
              </p>
            </div>
            {alert.dismissible ? (
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    dismiss(alert.id);
                    await dismissAlertAction(slug, alert.id);
                  })
                }
                aria-label={`Dismiss alert: ${alert.title}`}
                className="
                  -mr-1 -mt-1 shrink-0 rounded-full p-1 opacity-60
                  transition-opacity hover:opacity-100
                  focus-visible:outline focus-visible:outline-2
                  focus-visible:outline-offset-1 focus-visible:outline-current
                "
              >
                <X size={14} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
