"use client";

import { useActionState } from "react";
import type { Flight } from "@/lib/types";
import { IDLE_STATE } from "@/lib/validation";
import { saveFlightAction } from "@/lib/actions/logistics";
import {
  FormBanner,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form/Fields";
import { useResetOnSuccess } from "@/components/form/useResetOnSuccess";

const DIRECTIONS = [
  { value: "outbound", label: "Outbound" },
  { value: "return", label: "Return" },
];

const STATUSES = [
  { value: "confirmed", label: "Confirmed" },
  { value: "on-time", label: "On time" },
  { value: "delayed", label: "Delayed" },
  { value: "cancelled", label: "Cancelled" },
];

/** `datetime-local` wants "YYYY-MM-DDTHH:MM" — trim any offset off seeded values. */
function toLocalInput(value: string | undefined): string | undefined {
  return value?.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)?.[0];
}

export function FlightForm({
  slug,
  flight,
}: {
  slug: string;
  flight?: Flight;
}) {
  const [state, formAction] = useActionState(
    saveFlightAction.bind(null, slug, flight?.id ?? null),
    IDLE_STATE,
  );
  // Only the "add" variant clears itself; an edit form keeps showing the record.
  const formRef = useResetOnSuccess(state, !flight);

  const value = (field: string, fallback = "") =>
    state.values?.[field] ?? fallback;
  const error = (field: string) => state.fieldErrors?.[field];

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <FormBanner state={state} />

      <div className="grid grid-cols-2 gap-3">
        <SelectInput
          name="direction"
          label="Direction"
          options={DIRECTIONS}
          defaultValue={value("direction", flight?.direction ?? "outbound")}
          error={error("direction")}
        />
        <SelectInput
          name="status"
          label="Status"
          options={STATUSES}
          defaultValue={value("status", flight?.status ?? "confirmed")}
          error={error("status")}
        />
      </div>

      <div className="grid grid-cols-[1fr_110px] gap-3">
        <TextInput
          name="airline"
          label="Airline"
          placeholder="Garuda Indonesia"
          required
          defaultValue={value("airline", flight?.airline)}
          error={error("airline")}
        />
        <TextInput
          name="flightNumber"
          label="Flight no."
          placeholder="GA715"
          required
          maxLength={10}
          defaultValue={value("flightNumber", flight?.flightNumber)}
          error={error("flightNumber")}
        />
      </div>

      <div className="grid grid-cols-[80px_1fr] gap-3">
        <TextInput
          name="originCode"
          label="From"
          placeholder="SYD"
          maxLength={3}
          required
          defaultValue={value("originCode", flight?.originCode)}
          error={error("originCode")}
        />
        <TextInput
          name="originCity"
          label="City"
          placeholder="Sydney"
          required
          defaultValue={value("originCity", flight?.originCity)}
          error={error("originCity")}
        />
      </div>

      <div className="grid grid-cols-[80px_1fr] gap-3">
        <TextInput
          name="destinationCode"
          label="To"
          placeholder="DPS"
          maxLength={3}
          required
          defaultValue={value("destinationCode", flight?.destinationCode)}
          error={error("destinationCode")}
        />
        <TextInput
          name="destinationCity"
          label="City"
          placeholder="Denpasar"
          required
          defaultValue={value("destinationCity", flight?.destinationCity)}
          error={error("destinationCity")}
        />
      </div>

      <TextInput
        name="departsAt"
        label="Departs"
        type="datetime-local"
        required
        hint="Local time at the departure airport."
        defaultValue={value("departsAt", toLocalInput(flight?.departsAt))}
        error={error("departsAt")}
      />

      <TextInput
        name="arrivesAt"
        label="Arrives"
        type="datetime-local"
        required
        hint="Local time at the arrival airport."
        defaultValue={value("arrivesAt", toLocalInput(flight?.arrivesAt))}
        error={error("arrivesAt")}
      />

      <div className="grid grid-cols-3 gap-3">
        <TextInput
          name="gate"
          label="Gate"
          placeholder="54"
          maxLength={8}
          defaultValue={value("gate", flight?.gate)}
          error={error("gate")}
        />
        <TextInput
          name="seatLabel"
          label="Seats"
          placeholder="31A–31D"
          defaultValue={value("seatLabel", flight?.seatLabel)}
          error={error("seatLabel")}
        />
        <TextInput
          name="reference"
          label="Booking ref"
          placeholder="QP4T2M"
          defaultValue={value("reference", flight?.reference)}
          error={error("reference")}
        />
      </div>

      <SubmitButton>{flight ? "Save flight" : "Add flight"}</SubmitButton>
    </form>
  );
}
