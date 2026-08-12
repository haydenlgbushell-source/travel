"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import type { TripMember } from "@/lib/types";
import { IDLE_STATE } from "@/lib/validation";
import {
  addMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/lib/actions/members";
import {
  DeleteButton,
  FormBanner,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/form/Fields";
import { useResetOnSuccess } from "@/components/form/useResetOnSuccess";

const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "organiser", label: "Organiser" },
];

export function AddMemberForm({ slug }: { slug: string }) {
  const [state, formAction] = useActionState(
    addMemberAction.bind(null, slug),
    IDLE_STATE,
  );

  const formRef = useResetOnSuccess(state);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <FormBanner state={state} />

      <div className="grid grid-cols-[1fr_88px] gap-3">
        <TextInput
          name="name"
          label="Name"
          placeholder="Priya"
          required
          defaultValue={state.values?.name}
          error={state.fieldErrors?.name}
        />
        <TextInput
          name="initials"
          label="Initials"
          placeholder="PR"
          maxLength={3}
          required
          defaultValue={state.values?.initials}
          error={state.fieldErrors?.initials}
        />
      </div>

      <SelectInput
        name="role"
        label="Role"
        options={ROLE_OPTIONS}
        defaultValue={state.values?.role ?? "member"}
        error={state.fieldErrors?.role}
      />

      <SubmitButton>
        <UserPlus size={14} aria-hidden="true" />
        Add to trip
      </SubmitButton>
    </form>
  );
}

export function MemberRow({
  slug,
  member,
  canRemove,
  isLastOrganiser,
}: {
  slug: string;
  member: TripMember;
  canRemove: boolean;
  isLastOrganiser: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-paper-hi px-4 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lagoon text-[11px] font-semibold text-paper-hi">
        {member.initials}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-text">
          {member.name}
        </p>
        <p className="text-xs text-muted">
          {member.role === "organiser" ? "Organiser" : "Member"}
          {isLastOrganiser ? " · the only one" : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/*
          Role changes submit on select rather than needing a save button —
          `requestSubmit` on the enclosing form keeps it a real form post.
        */}
        <form action={updateMemberRoleAction.bind(null, slug)}>
          <input type="hidden" name="memberId" value={member.id} />
          <label className="sr-only" htmlFor={`role-${member.id}`}>
            Role for {member.name}
          </label>
          <select
            id={`role-${member.id}`}
            name="role"
            defaultValue={member.role}
            disabled={isLastOrganiser}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className="
              rounded-pill border border-line bg-paper px-2 py-1 font-mono
              text-[10px] uppercase tracking-[0.1em] text-ink-text
              disabled:opacity-50
              focus-visible:outline focus-visible:outline-2
              focus-visible:outline-offset-1 focus-visible:outline-lagoon-dark
            "
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </form>

        {canRemove ? (
          <form action={removeMemberAction.bind(null, slug)}>
            <input type="hidden" name="memberId" value={member.id} />
            <DeleteButton
              compact
              confirm={`Remove ${member.name} from the trip? Anything they alone paid for is removed from the budget.`}
            >
              Remove
            </DeleteButton>
          </form>
        ) : null}
      </div>
    </div>
  );
}
