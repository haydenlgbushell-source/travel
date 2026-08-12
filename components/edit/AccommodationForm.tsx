"use client";

import { useActionState } from "react";
import type { Accommodation } from "@/lib/types";
import { IDLE_STATE } from "@/lib/validation";
import {
  deleteAccommodationAction,
  saveAccommodationAction,
} from "@/lib/actions/logistics";
import {
  DeleteButton,
  FormBanner,
  SubmitButton,
  TextInput,
  TextareaInput,
} from "@/components/form/Fields";

export function AccommodationForm({
  slug,
  stay,
}: {
  slug: string;
  stay: Accommodation | null;
}) {
  const [state, formAction] = useActionState(
    saveAccommodationAction.bind(null, slug),
    IDLE_STATE,
  );

  const value = (field: string, fallback = "") =>
    state.values?.[field] ?? fallback;
  const error = (field: string) => state.fieldErrors?.[field];

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <FormBanner state={state} />

        <TextInput
          name="name"
          label="Place"
          placeholder="Villa Kanina, Uluwatu"
          required
          defaultValue={value("name", stay?.name)}
          error={error("name")}
        />

        <TextInput
          name="address"
          label="Address"
          placeholder="Jl. Pantai Bingin, Pecatu"
          required
          defaultValue={value("address", stay?.address)}
          error={error("address")}
        />

        <div className="grid grid-cols-2 gap-3">
          <TextInput
            name="checkIn"
            label="Check in"
            type="date"
            required
            defaultValue={value("checkIn", stay?.checkIn)}
            error={error("checkIn")}
          />
          <TextInput
            name="checkOut"
            label="Check out"
            type="date"
            required
            defaultValue={value("checkOut", stay?.checkOut)}
            error={error("checkOut")}
          />
        </div>

        <div className="grid grid-cols-[1fr_88px] gap-3">
          <TextInput
            name="reference"
            label="Booking reference"
            placeholder="VK-8841-QR"
            defaultValue={value("reference", stay?.reference)}
            error={error("reference")}
          />
          <TextInput
            name="guests"
            label="Guests"
            type="number"
            inputMode="numeric"
            required
            defaultValue={value("guests", String(stay?.guests ?? 2))}
            error={error("guests")}
          />
        </div>

        <TextInput
          name="bookingUrl"
          label="Booking link"
          type="url"
          placeholder="https://…"
          defaultValue={value("bookingUrl", stay?.bookingUrl)}
          error={error("bookingUrl")}
        />

        <TextareaInput
          name="notes"
          label="Notes"
          placeholder="Private pool, staffed breakfast."
          defaultValue={value("notes", stay?.notes)}
          error={error("notes")}
        />

        <SubmitButton>{stay ? "Save changes" : "Add the stay"}</SubmitButton>
      </form>

      {stay ? (
        <form action={deleteAccommodationAction.bind(null, slug)}>
          <DeleteButton confirm={`Remove ${stay.name} from the trip?`}>
            Remove this stay
          </DeleteButton>
        </form>
      ) : null}
    </div>
  );
}
