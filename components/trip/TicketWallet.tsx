import type { WalletTicket } from "@/lib/types";
import { Card, Overline, SectionHeading } from "@/components/shell/Card";
import { GroupAvatars } from "./GroupAvatars";

/**
 * Tickets the group already holds — reference codes the organiser typed in, not
 * uploaded files. Nothing here is a personal document, so there is no storage
 * bucket behind it.
 *
 * The QR blocks are decorative CSS. Generating a real code from `reference` is
 * a later step and only makes sense where the vendor's code is actually the
 * reference string.
 */
export function TicketWallet({ tickets }: { tickets: WalletTicket[] }) {
  return (
    <section aria-labelledby="wallet-heading">
      <SectionHeading
        title="Ticket wallet"
        meta={`${tickets.length} held · reference codes only`}
      />

      <div className="space-y-3 px-5">
        <h3 id="wallet-heading" className="sr-only">
          Ticket wallet
        </h3>

        {tickets.map((ticket) => (
          <Card key={ticket.id} as="article" className="flex items-stretch overflow-hidden">
            <div className="min-w-0 flex-1 p-4">
              <Overline>{ticket.validOn}</Overline>
              <h4 className="mt-1 font-display text-sm font-semibold leading-snug text-ink">
                {ticket.title}
              </h4>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                {ticket.detail}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <GroupAvatars
                  size="sm"
                  members={ticket.holderInitials.map((initials) => ({
                    id: `${ticket.id}-${initials}`,
                    initials,
                    name: initials,
                  }))}
                />
                <p className="truncate font-mono text-[10px] font-semibold tracking-wide text-ink-text">
                  {ticket.reference}
                </p>
              </div>
            </div>

            <div className="flex w-[84px] shrink-0 items-center justify-center border-l border-dashed border-line bg-paper">
              <div
                className="qr-block h-12 w-12 rounded-[3px] opacity-70"
                role="img"
                aria-label={`Decorative code placeholder for ${ticket.title}`}
              />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
