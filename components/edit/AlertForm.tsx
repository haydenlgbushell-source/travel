"use client";

import { useActionState } from "react";
import { IDLE_STATE } from "@/lib/validation";
import { addAlertAction } from "@/lib/actions/engagement";
import {
  FormBanner,
  SelectInput,
  SubmitButton,
  TextInput,
  TextareaInput,
} from "@/components/form/Fields";
import { useResetOnSuccess } from "@/components/form/useResetOnSuccess";

const TONES = [
  { value: "urgent", label: "Needs attention" },
  { value: "info", label: "Heads up" },
  { value: "success", label: "Good news" },
];

export function AlertForm({ slug }: { slug: string }) {
  const [state, formAction] = useActionState(
    addAlertAction.bind(null, slug),
    IDLE_STATE,
  );
  const formRef = useResetOnSuccess(state);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <FormBanner state={state} />

      <TextInput
        name="title"
        label="Heading"
        placeholder="Tom hasn't paid the villa deposit"
        required
        defaultValue={state.values?.title}
        error={state.fieldErrors?.title}
      />

      <TextareaInput
        name="body"
        label="Detail"
        rows={2}
        placeholder="$420 due before 25 Aug or the host releases the booking."
        required
        defaultValue={state.values?.body}
        error={state.fieldErrors?.body}
      />

      <SelectInput
        name="tone"
        label="Tone"
        options={TONES}
        defaultValue={state.values?.tone ?? "info"}
        error={state.fieldErrors?.tone}
      />

      <SubmitButton>Post to the group</SubmitButton>
    </form>
  );
}
