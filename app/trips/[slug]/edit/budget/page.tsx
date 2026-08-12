import type { Metadata } from "next";
import { loadTrip } from "@/lib/data/load";
import { deleteExpenseAction } from "@/lib/actions/budget";
import { formatMoney } from "@/lib/format";
import {
  EditShell,
  EditableRow,
  EmptyHint,
  FormCard,
} from "@/components/edit/EditShell";
import { ExpenseForm } from "@/components/edit/ExpenseForm";
import { DeleteButton } from "@/components/form/Fields";

export const metadata: Metadata = { title: "Budget" };

export default async function BudgetEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { detail } = await loadTrip(slug);

  const { currency, expenses } = detail.budget;
  const members = detail.trip.members;
  const memberName = new Map(members.map((m) => [m.id, m.name]));

  return (
    <EditShell
      title="Budget"
      meta={`${expenses.length} expenses in ${currency}`}
      backHref={`/trips/${slug}/edit`}
      backLabel="Edit trip"
    >
      <div className="space-y-2">
        {expenses.length === 0 ? (
          <EmptyHint>
            Nothing logged yet. Add what people have already paid for.
          </EmptyHint>
        ) : (
          expenses.map((expense) => (
            <EditableRow
              key={expense.id}
              summary={`${expense.label} · ${formatMoney(expense.amountCents, currency)}`}
              detail={`${memberName.get(expense.paidByMemberId) ?? "Someone"} paid · split ${expense.splitAcrossMemberIds.length} ways`}
            >
              <ExpenseForm
                slug={slug}
                members={members}
                currency={currency}
                expense={expense}
              />

              <div className="mt-4 border-t border-line pt-4">
                <form action={deleteExpenseAction.bind(null, slug)}>
                  <input type="hidden" name="expenseId" value={expense.id} />
                  <DeleteButton compact confirm={`Delete "${expense.label}"?`}>
                    Delete
                  </DeleteButton>
                </form>
              </div>
            </EditableRow>
          ))
        )}
      </div>

      <div className="mt-6">
        <FormCard title="Add an expense">
          <ExpenseForm slug={slug} members={members} currency={currency} />
        </FormCard>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Each expense splits evenly across the people ticked. The rounding
        remainder goes to whoever paid, so the balances on the trip page always
        sum to zero.
      </p>
    </EditShell>
  );
}
