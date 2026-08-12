import type { Budget, TripMember } from "@/lib/types";
import { formatMoney, settleBalances, summariseBudget } from "@/lib/format";
import {
  Card,
  EmptyState,
  Overline,
  SectionHeading,
} from "@/components/shell/Card";

/**
 * Signature pattern 3 — the receipt.
 *
 * Ruled paper, monospace figures, right-aligned so the decimal points line up
 * like a till roll. The split maths is real (see `settleBalances`): each
 * expense divides across only the members it applies to, and the rounding
 * remainder lands on whoever paid, so the balances always sum to zero.
 */
export function BudgetReceipt({
  slug,
  budget,
  members,
}: {
  slug: string;
  budget: Budget;
  members: TripMember[];
}) {
  if (budget.expenses.length === 0) {
    return (
      <section id="budget" aria-labelledby="budget-heading">
        <SectionHeading title="Budget" meta="Nothing logged yet" />
        <h3 id="budget-heading" className="sr-only">
          Budget
        </h3>
        <EmptyState
          message="No expenses on this trip yet."
          href={`/trips/${slug}/edit/budget`}
          cta="Log an expense"
        />
      </section>
    );
  }

  const totals = summariseBudget(budget, members.length);
  const balances = settleBalances(budget, members);
  const currency = budget.currency;
  const underBudget = totals.varianceCents >= 0;

  return (
    <section id="budget" aria-labelledby="budget-heading">
      <SectionHeading
        title="Budget"
        meta={`${budget.expenses.length} entries · split ${members.length} ways`}
      />

      <div className="px-5">
        <Card className="overflow-hidden">
          <div className="bg-paper-hi px-4 py-4">
            <div className="flex items-baseline justify-between">
              <h3
                id="budget-heading"
                className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted"
              >
                Trip total
              </h3>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                {currency}
              </p>
            </div>

            <p className="mt-1 font-display text-3xl font-semibold leading-none text-ink">
              {formatMoney(totals.totalCents, currency)}
            </p>

            {/*
              Rows are exactly 28px so they sit on the ruled background's pitch
              — the rule lands under each line, like a till roll, instead of
              striking through it.
            */}
            <dl className="receipt-rules mt-5">
              {totals.byCategory.map((row) => (
                <div key={row.category} className="flex h-7 items-center gap-2">
                  <dt className="shrink-0 text-xs text-ink-text/80">{row.label}</dt>
                  <span
                    aria-hidden="true"
                    className="min-w-0 flex-1 border-b border-dotted border-line/70"
                  />
                  <dd className="shrink-0 font-mono text-xs font-semibold tabular-nums text-ink-text">
                    {formatMoney(row.amountCents, currency)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="px-4" aria-hidden="true">
            <div className="perf" />
          </div>

          <div className="grid grid-cols-2 gap-px bg-line/60 p-px">
            <div className="bg-paper-hi px-4 py-3">
              <Overline>Per person</Overline>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink-text">
                {formatMoney(totals.perPersonCents, currency)}
              </p>
            </div>
            <div className="bg-paper-hi px-4 py-3">
              <Overline>vs target</Overline>
              <p
                className={`mt-1 font-mono text-lg font-semibold tabular-nums ${
                  underBudget ? "text-palm" : "text-stamp"
                }`}
              >
                {underBudget ? "−" : "+"}
                {formatMoney(Math.abs(totals.varianceCents), currency)}
              </p>
            </div>
          </div>

          <div className="border-t border-line px-4 py-3">
            <Overline>Who owes who</Overline>
            <ul className="mt-2 space-y-1.5">
              {balances.map(({ member, netCents }) => {
                const settled = netCents === 0;
                const owedToThem = netCents > 0;

                return (
                  <li
                    key={member.id}
                    className="flex items-baseline justify-between gap-2 text-xs"
                  >
                    <span className="text-ink-text/85">
                      {member.name}
                      {member.role === "organiser" ? (
                        <span className="ml-1 text-[10px] text-muted">
                          (organiser)
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`font-mono font-semibold tabular-nums ${
                        settled
                          ? "text-muted"
                          : owedToThem
                            ? "text-palm"
                            : "text-stamp"
                      }`}
                    >
                      {settled
                        ? "settled"
                        : owedToThem
                          ? `is owed ${formatMoney(netCents, currency)}`
                          : `owes ${formatMoney(-netCents, currency)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      </div>
    </section>
  );
}
