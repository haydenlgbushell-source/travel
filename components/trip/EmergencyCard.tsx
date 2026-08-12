import { Phone } from "lucide-react";
import type { EmergencyContact } from "@/lib/types";
import { Card, SectionHeading } from "@/components/shell/Card";

export function EmergencyCard({ contacts }: { contacts: EmergencyContact[] }) {
  return (
    <section aria-labelledby="emergency-heading">
      <SectionHeading title="If something goes wrong" meta="Tap to call" />

      <div className="px-5">
        <Card className="divide-y divide-line">
          <h3 id="emergency-heading" className="sr-only">
            Emergency contacts
          </h3>

          {contacts.map((contact) => {
            const content = (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-ink-text">
                    {contact.label}
                  </p>
                  {contact.detail ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      {contact.detail}
                    </p>
                  ) : null}
                </div>
                <p className="shrink-0 font-mono text-xs font-semibold tracking-wide text-lagoon-dark">
                  {contact.value}
                </p>
              </>
            );

            return (
              <div key={contact.id}>
                {contact.href ? (
                  <a
                    href={contact.href}
                    className="
                      flex items-center gap-3 px-4 py-3 transition-colors
                      hover:bg-paper focus-visible:outline focus-visible:outline-2
                      focus-visible:-outline-offset-2 focus-visible:outline-lagoon-dark
                    "
                  >
                    <Phone
                      size={14}
                      className="shrink-0 text-stamp"
                      aria-hidden="true"
                    />
                    {content}
                  </a>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Phone
                      size={14}
                      className="shrink-0 text-stamp"
                      aria-hidden="true"
                    />
                    {content}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      </div>
    </section>
  );
}
