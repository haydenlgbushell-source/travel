"use client";

import { useActionState } from "react";
import type { Trip } from "@/lib/types";
import { IDLE_STATE } from "@/lib/validation";
import { createTripAction, updateTripSettingsAction } from "@/lib/actions/trips";
import {
  FormBanner,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form/Fields";

const STATUS_OPTIONS = [
  { value: "planning", label: "Planning" },
  { value: "confirmed", label: "Confirmed" },
  { value: "live", label: "In progress" },
  { value: "complete", label: "Complete" },
];

interface Existing {
  trip: Trip;
  currency: string;
  perPersonTarget: string;
  mapLabel: string;
}

export function TripForm({ existing }: { existing?: Existing }) {
  const action = existing
    ? updateTripSettingsAction.bind(null, existing.trip.slug)
    : createTripAction;

  const [state, formAction] = useActionState(action, IDLE_STATE);

  // On a rejected submit, show what the user typed rather than resetting to
  // the stored values.
  const value = (field: string, fallback = "") =>
    state.values?.[field] ?? fallback;
  const error = (field: string) => state.fieldErrors?.[field];

  return (
    <form action={formAction} className="space-y-4">
      <FormBanner state={state} />

      <TextInput
        name="name"
        label="Trip name"
        placeholder="Bali 2026"
        required
        defaultValue={value("name", existing?.trip.name)}
        error={error("name")}
      />

      <TextInput
        name="destination"
        label="Destination"
        placeholder="Bali, Indonesia"
        required
        defaultValue={value("destination", existing?.trip.destination)}
        error={error("destination")}
      />

      <TextInput
        name="coverRoute"
        label="Route code"
        placeholder="SYD → DPS"
        required
        maxLength={24}
        hint="Shown large at the top of the trip."
        defaultValue={value("coverRoute", existing?.trip.coverRoute)}
        error={error("coverRoute")}
      />

      <div className="grid grid-cols-2 gap-3">
        <TextInput
          name="startDate"
          label="Start"
          type="date"
          required
          defaultValue={value("startDate", existing?.trip.startDate)}
          error={error("startDate")}
        />
        <TextInput
          name="endDate"
          label="End"
          type="date"
          required
          defaultValue={value("endDate", existing?.trip.endDate)}
          error={error("endDate")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextInput
          name="currency"
          label="Currency"
          placeholder="AUD"
          maxLength={3}
          required
          defaultValue={value("currency", existing?.currency ?? "AUD")}
          error={error("currency")}
        />
        <TextInput
          name="perPersonTarget"
          label="Budget each"
          inputMode="decimal"
          placeholder="2500"
          required
          defaultValue={value("perPersonTarget", existing?.perPersonTarget ?? "")}
          error={error("perPersonTarget")}
        />
      </div>

      {existing ? (
        <>
          <SelectInput
            name="status"
            label="Status"
            options={STATUS_OPTIONS}
            defaultValue={value("status", existing.trip.status)}
            error={error("status")}
          />
          <TextInput
            name="mapLabel"
            label="Map caption"
            placeholder="Uluwatu · Ubud"
            defaultValue={value("mapLabel", existing.mapLabel)}
            error={error("mapLabel")}
          />
        </>
      ) : null}

      <SubmitButton>{existing ? "Save changes" : "Create trip"}</SubmitButton>
    </form>
  );
}
