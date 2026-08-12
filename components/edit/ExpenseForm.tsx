"use client";

import { useActionState } from "react";
import type { Expense, TripMember } from "@/lib/types";
import { IDLE_STATE } from "@/lib/validation";
import { saveExpenseAction } from "@/lib/actions/budget";
import {
  CheckboxInput,
  Field,
  FormBanner,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form/Fields";
import { useResetOnSuccess } from "@/components/form/useResetOnSuccess";

const CATEGORIES = [
  { value: "stay", label: "Accommodation" },
  { value: "flights", label: "Flights" },
  { value: "food", label: "Food & drink" },
  { value: "activities", label: "Activities" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
];

export function ExpenseForm({
  slug,
  members,
  currency,
  expense,
}: {
  slug: string;
  members: TripMember[];
  currency: string;
  expense?: Expense;
}) {
  const [state, formAction] = useActionState(
    saveExpenseAction.bind(null, slug, expense?.id ?? null),
    IDLE_STATE,
  );
  const formRef = useResetOnSuccess(state, !expense);

  const value = (field: string, fallback = "") =>
    state.values?.[field] ?? fallback;
  const error = (field: string) => state.fieldErrors?.[field];

  // New expenses default to splitting across everyone, which is the common case.
  const splitIds = expense?.splitAcrossMemberIds ?? members.map((m) => m.id);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <FormBanner state={state} />

      <TextInput
        name="label"
        label="What was it for"
        placeholder="Villa Kanina, 3 nights"
        required
        defaultValue={value("label", expense?.label)}
        error={error("label")}
      />

      <div className="grid grid-cols-[1fr_120px] gap-3">
        <SelectInput
          name="category"
          label="Category"
          options={CATEGORIES}
          defaultValue={value("category", expense?.category ?? "other")}
          error={error("category")}
        />
        <TextInput
          name="amount"
          label={`Amount (${currency})`}
          inputMode="decimal"
          placeholder="1680"
          required
          defaultValue={value(
            "amount",
            expense ? (expense.amountCents / 100).toFixed(2) : "",
          )}
          error={error("amount")}
        />
      </div>

      <SelectInput
        name="paidByMemberId"
        label="Paid by"
        options={members.map((m) => ({ value: m.id, label: m.name }))}
        defaultValue={value("paidByMemberId", expense?.paidByMemberId ?? members[0]?.id)}
        error={error("paidByMemberId")}
      />

      <Field
        label="Split across"
        name="splitAcrossMemberIds"
        error={error("splitAcrossMemberIds")}
        hint="Only the people ticked here owe a share."
      >
        <div className="space-y-2 rounded-card border border-line bg-paper px-3 py-3">
          {members.map((member) => (
            <CheckboxInput
              key={member.id}
              name="splitAcrossMemberIds"
              value={member.id}
              label={member.name}
              defaultChecked={splitIds.includes(member.id)}
            />
          ))}
        </div>
      </Field>

      <SubmitButton>{expense ? "Save" : "Add expense"}</SubmitButton>
    </form>
  );
}
