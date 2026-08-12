"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import type { Poll } from "@/lib/types";
import { IDLE_STATE } from "@/lib/validation";
import { deletePollAction, savePollAction } from "@/lib/actions/engagement";
import {
  DeleteButton,
  Field,
  FormBanner,
  SubmitButton,
  TextInput,
} from "@/components/form/Fields";

const MAX_OPTIONS = 6;

export function PollForm({ slug, poll }: { slug: string; poll: Poll | null }) {
  const [state, formAction] = useActionState(
    savePollAction.bind(null, slug),
    IDLE_STATE,
  );

  // Option rows are dynamic, so they're the one part of the form held in state
  // rather than left uncontrolled.
  const [options, setOptions] = useState<string[]>(() =>
    poll && poll.options.length > 0
      ? poll.options.map((option) => option.label)
      : ["", ""],
  );

  const error = (field: string) => state.fieldErrors?.[field];

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <FormBanner state={state} />

        <TextInput
          name="question"
          label="Question"
          placeholder="Where are we doing the last-night dinner?"
          required
          defaultValue={state.values?.question ?? poll?.question}
          error={error("question")}
        />

        <TextInput
          name="closesAt"
          label="Closes"
          type="date"
          required
          defaultValue={
            state.values?.closesAt ?? poll?.closesAt.slice(0, 10)
          }
          error={error("closesAt")}
        />

        <Field
          label="Options"
          name="options"
          error={error("options") ?? error("options.0") ?? error("options.1")}
          hint="Renaming an option clears the votes cast for it."
        >
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  name="options"
                  value={option}
                  onChange={(event) =>
                    setOptions((current) =>
                      current.map((v, i) =>
                        i === index ? event.target.value : v,
                      ),
                    )
                  }
                  placeholder={`Option ${index + 1}`}
                  aria-label={`Option ${index + 1}`}
                  className="
                    w-full rounded-card border border-line bg-paper px-3 py-2.5
                    text-sm text-ink-text placeholder:text-muted/70
                    focus:outline-none focus-visible:outline focus-visible:outline-2
                    focus-visible:outline-offset-1 focus-visible:outline-lagoon-dark
                  "
                />
                {options.length > 2 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setOptions((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                    aria-label={`Remove option ${index + 1}`}
                    className="
                      shrink-0 rounded-card border border-line p-2 text-muted
                      transition-colors hover:border-stamp/40 hover:text-stamp
                      focus-visible:outline focus-visible:outline-2
                      focus-visible:outline-offset-2 focus-visible:outline-stamp
                    "
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {options.length < MAX_OPTIONS ? (
            <button
              type="button"
              onClick={() => setOptions((current) => [...current, ""])}
              className="
                mt-2 inline-flex items-center gap-1.5 text-xs font-semibold
                text-lagoon-dark underline-offset-2 hover:underline
                focus-visible:outline focus-visible:outline-2
                focus-visible:outline-offset-2 focus-visible:outline-lagoon-dark
              "
            >
              <Plus size={13} aria-hidden="true" />
              Add another option
            </button>
          ) : null}
        </Field>

        <SubmitButton>{poll ? "Save vote" : "Start the vote"}</SubmitButton>
      </form>

      {poll ? (
        <form action={deletePollAction.bind(null, slug)}>
          <DeleteButton confirm="Delete this vote and every vote cast?">
            Delete the vote
          </DeleteButton>
        </form>
      ) : null}
    </div>
  );
}
