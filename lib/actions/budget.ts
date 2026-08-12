"use server";

import * as store from "@/lib/data/store";
import {
  expenseSchema,
  formToObject,
  parseForm,
  type ActionState,
} from "@/lib/validation";
import { formatMoney } from "@/lib/format";
import { requireTripAccess, revalidateTrip } from "./guard";

export async function saveExpenseAction(
  slug: string,
  expenseId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireTripAccess(slug);

  const parsed = parseForm(
    expenseSchema,
    formToObject(formData, ["splitAcrossMemberIds"]),
  );
  if (!parsed.ok) return parsed.state;

  const record = await store.getTripRecord(slug);
  if (!record) return { ok: false, message: "Trip not found." };

  // Ids come from the form, so check they are actually on this trip before
  // storing them — a stale tab could otherwise attach a removed member.
  const memberIds = new Set(record.trip.members.map((m) => m.id));
  if (!memberIds.has(parsed.data.paidByMemberId)) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: { paidByMemberId: "That person isn't on this trip" },
    };
  }

  const split = parsed.data.splitAcrossMemberIds.filter((id) => memberIds.has(id));
  if (split.length === 0) {
    return {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: {
        splitAcrossMemberIds: "Split it across at least one person",
      },
    };
  }

  await store.upsertExpense(
    slug,
    {
      category: parsed.data.category,
      label: parsed.data.label,
      amountCents: parsed.data.amount,
      paidByMemberId: parsed.data.paidByMemberId,
      splitAcrossMemberIds: split,
    },
    expenseId ?? undefined,
  );

  if (!expenseId) {
    const payer = record.trip.members.find(
      (m) => m.id === parsed.data.paidByMemberId,
    );
    await store.recordActivity(slug, {
      kind: "payment",
      title: `${payer?.name ?? "Someone"} paid for ${parsed.data.label}`,
      body: `${formatMoney(parsed.data.amount, record.budget.currency)} across ${split.length} people.`,
      actorInitials: payer?.initials ?? user.initials,
    });
  }

  revalidateTrip(slug);
  return { ok: true, message: expenseId ? "Expense updated." : "Expense added." };
}

export async function deleteExpenseAction(
  slug: string,
  formData: FormData,
): Promise<void> {
  await requireTripAccess(slug);
  await store.deleteExpense(slug, String(formData.get("expenseId") ?? ""));
  revalidateTrip(slug);
}
