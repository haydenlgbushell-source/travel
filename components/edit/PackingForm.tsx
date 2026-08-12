"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import type { TripMember } from "@/lib/types";
import { IDLE_STATE } from "@/lib/validation";
import { addPackingItemAction } from "@/lib/actions/engagement";
import {
  FormBanner,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form/Fields";
import { useResetOnSuccess } from "@/components/form/useResetOnSuccess";

export function AddPackingItemForm({
  slug,
  members,
  categories,
}: {
  slug: string;
  members: TripMember[];
  categories: string[];
}) {
  const [state, formAction] = useActionState(
    addPackingItemAction.bind(null, slug),
    IDLE_STATE,
  );
  const formRef = useResetOnSuccess(state);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <FormBanner state={state} />

      <TextInput
        name="label"
        label="Item"
        placeholder="Reef-safe sunscreen"
        required
        defaultValue={state.values?.label}
        error={state.fieldErrors?.label}
      />

      <TextInput
        name="category"
        label="Group"
        list="packing-categories"
        placeholder="Essentials"
        required
        defaultValue={state.values?.category ?? categories[0] ?? "Essentials"}
        error={state.fieldErrors?.category}
      />
      {/* Existing groups as suggestions, while still allowing a new one. */}
      <datalist id="packing-categories">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <SelectInput
        name="assignedToMemberId"
        label="Assigned to"
        options={[
          { value: "", label: "Everyone packs their own" },
          ...members.map((m) => ({ value: m.id, label: m.name })),
        ]}
        defaultValue={state.values?.assignedToMemberId ?? ""}
        error={state.fieldErrors?.assignedToMemberId}
      />

      <SubmitButton>
        <Plus size={14} aria-hidden="true" />
        Add item
      </SubmitButton>
    </form>
  );
}
