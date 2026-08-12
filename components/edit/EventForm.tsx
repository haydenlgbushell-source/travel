"use client";

import { useActionState } from "react";
import type { ItineraryEvent, TripDay } from "@/lib/types";
import { IDLE_STATE } from "@/lib/validation";
import { saveEventAction } from "@/lib/actions/itinerary";
import {
  CheckboxInput,
  FormBanner,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form/Fields";
import { useResetOnSuccess } from "@/components/form/useResetOnSuccess";

const TAGS = [
  { value: "activity", label: "Do" },
  { value: "food", label: "Food" },
  { value: "travel", label: "Travel" },
  { value: "booking", label: "Booked" },
  { value: "rest", label: "Rest" },
  { value: "free", label: "Free" },
];

export function EventForm({
  slug,
  days,
  defaultDate,
  event,
}: {
  slug: string;
  days: TripDay[];
  defaultDate: string;
  event?: ItineraryEvent;
}) {
  const [state, formAction] = useActionState(
    saveEventAction.bind(null, slug, event?.id ?? null),
    IDLE_STATE,
  );
  const formRef = useResetOnSuccess(state, !event);

  const value = (field: string, fallback = "") =>
    state.values?.[field] ?? fallback;
  const error = (field: string) => state.fieldErrors?.[field];

  const dayOptions = days.map((day) => ({
    value: day.date,
    label: `${day.weekdayShort} ${day.dayOfMonth} · ${day.label}`,
  }));

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <FormBanner state={state} />

      <TextInput
        name="title"
        label="What's happening"
        placeholder="Kecak fire dance"
        required
        defaultValue={value("title", event?.title)}
        error={error("title")}
      />

      <div className="grid grid-cols-[1fr_110px] gap-3">
        <SelectInput
          name="dayDate"
          label="Day"
          options={dayOptions}
          defaultValue={value("dayDate", event?.dayDate ?? defaultDate)}
          error={error("dayDate")}
        />
        <TextInput
          name="time"
          label="Time"
          type="time"
          required
          defaultValue={value("time", event?.time ?? "09:00")}
          error={error("time")}
        />
      </div>

      <TextInput
        name="subtitle"
        label="Detail"
        placeholder="Arrive 17:30 for seats"
        defaultValue={value("subtitle", event?.subtitle)}
        error={error("subtitle")}
      />

      <div className="grid grid-cols-2 gap-3">
        <SelectInput
          name="tag"
          label="Kind"
          options={TAGS}
          defaultValue={value("tag", event?.tag ?? "activity")}
          error={error("tag")}
        />
        <TextInput
          name="location"
          label="Where"
          placeholder="Uluwatu Temple"
          defaultValue={value("location", event?.location)}
          error={error("location")}
        />
      </div>

      <CheckboxInput
        name="isHighlight"
        label="Highlight of the day"
        hint="Highlights show on the overview tab."
        defaultChecked={event?.isHighlight}
      />

      <SubmitButton>{event ? "Save" : "Add to the plan"}</SubmitButton>
    </form>
  );
}
