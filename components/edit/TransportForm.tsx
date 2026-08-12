"use client";

import { useActionState } from "react";
import type { TransportItem } from "@/lib/types";
import { IDLE_STATE } from "@/lib/validation";
import { saveTransportAction } from "@/lib/actions/logistics";
import {
  FormBanner,
  SelectInput,
  SubmitButton,
  TextInput,
  TextareaInput,
} from "@/components/form/Fields";
import { useResetOnSuccess } from "@/components/form/useResetOnSuccess";

const KINDS = [
  { value: "transfer", label: "Transfer" },
  { value: "driver", label: "Driver" },
  { value: "ferry", label: "Boat / ferry" },
  { value: "scooter", label: "Scooter" },
];

const STATUSES = [
  { value: "booked", label: "Booked" },
  { value: "pending", label: "Pending" },
  { value: "idea", label: "Idea" },
];

export function TransportForm({
  slug,
  item,
}: {
  slug: string;
  item?: TransportItem;
}) {
  const [state, formAction] = useActionState(
    saveTransportAction.bind(null, slug, item?.id ?? null),
    IDLE_STATE,
  );
  const formRef = useResetOnSuccess(state, !item);

  const value = (field: string, fallback = "") =>
    state.values?.[field] ?? fallback;
  const error = (field: string) => state.fieldErrors?.[field];

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <FormBanner state={state} />

      <TextInput
        name="label"
        label="What is it"
        placeholder="Airport → Uluwatu"
        required
        defaultValue={value("label", item?.label)}
        error={error("label")}
      />

      <div className="grid grid-cols-2 gap-3">
        <SelectInput
          name="kind"
          label="Type"
          options={KINDS}
          defaultValue={value("kind", item?.kind ?? "transfer")}
          error={error("kind")}
        />
        <SelectInput
          name="status"
          label="Status"
          options={STATUSES}
          defaultValue={value("status", item?.status ?? "pending")}
          error={error("status")}
        />
      </div>

      <TextareaInput
        name="detail"
        label="Details"
        rows={2}
        placeholder="Private van, 4 pax + bags."
        defaultValue={value("detail", item?.detail)}
        error={error("detail")}
      />

      <TextInput
        name="cost"
        label="Cost"
        placeholder="$38 or $9 /day"
        hint="Free text — it's shown as typed."
        defaultValue={value("cost", item?.cost)}
        error={error("cost")}
      />

      <SubmitButton>{item ? "Save" : "Add transport"}</SubmitButton>
    </form>
  );
}
