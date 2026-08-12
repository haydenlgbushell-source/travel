"use client";

import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import type { ActionState } from "@/lib/validation";

const CONTROL_CLASSES = `
  w-full rounded-card border bg-paper px-3 py-2.5 text-sm text-ink-text
  placeholder:text-muted/70
  focus:outline-none focus-visible:outline focus-visible:outline-2
  focus-visible:outline-offset-1 focus-visible:outline-lagoon-dark
`;

function controlClass(hasError: boolean) {
  return `${CONTROL_CLASSES} ${hasError ? "border-stamp" : "border-line"}`;
}

export function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs font-medium text-stamp">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

interface BaseProps {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}

export function TextInput({
  name,
  label,
  error,
  hint,
  defaultValue,
  required,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  list,
}: BaseProps & {
  type?: string;
  inputMode?: "text" | "numeric" | "decimal";
  maxLength?: number;
  /** id of a <datalist> offering suggestions without restricting input. */
  list?: string;
}) {
  return (
    <Field label={label} name={name} error={error} hint={hint}>
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        list={list}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={controlClass(Boolean(error))}
      />
    </Field>
  );
}

export function TextareaInput({
  name,
  label,
  error,
  hint,
  defaultValue,
  required,
  placeholder,
  rows = 3,
}: BaseProps & { rows?: number }) {
  return (
    <Field label={label} name={name} error={error} hint={hint}>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`${controlClass(Boolean(error))} resize-y`}
      />
    </Field>
  );
}

export function SelectInput({
  name,
  label,
  error,
  hint,
  defaultValue,
  options,
}: BaseProps & { options: { value: string; label: string }[] }) {
  return (
    <Field label={label} name={name} error={error} hint={hint}>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={controlClass(Boolean(error))}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CheckboxInput({
  name,
  label,
  defaultChecked,
  value,
  hint,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  value?: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="
          mt-0.5 h-[18px] w-[18px] shrink-0 rounded-[5px] border-line bg-paper
          text-lagoon-dark accent-lagoon-dark
          focus-visible:outline focus-visible:outline-2
          focus-visible:outline-offset-2 focus-visible:outline-lagoon-dark
        "
      />
      <span className="min-w-0">
        <span className="block text-sm text-ink-text">{label}</span>
        {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

/**
 * Disabled while the action is in flight — `useFormStatus` reads the state of
 * the enclosing <form>, so this has to be a child of it rather than the same
 * component that renders it.
 */
export function SubmitButton({
  children = "Save",
  variant = "primary",
}: {
  children?: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();

  const styles =
    variant === "primary"
      ? "bg-lagoon-dark text-paper-hi hover:opacity-90"
      : "border border-line bg-paper-hi text-ink-text hover:border-lagoon/40";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`
        inline-flex items-center justify-center gap-2 rounded-card px-4 py-2.5
        text-sm font-semibold transition-opacity disabled:cursor-not-allowed
        disabled:opacity-60
        focus-visible:outline focus-visible:outline-2
        focus-visible:outline-offset-2 focus-visible:outline-lagoon-dark
        ${styles}
      `}
    >
      {pending ? (
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}

/**
 * Destructive submit. The confirm runs before the action fires; cancelling
 * prevents submission entirely.
 */
export function DeleteButton({
  confirm,
  children = "Delete",
  compact = false,
}: {
  confirm: string;
  children?: ReactNode;
  compact?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirm)) event.preventDefault();
      }}
      className={`
        inline-flex items-center justify-center gap-1.5 rounded-card border
        border-stamp/40 font-semibold text-stamp transition-colors
        hover:bg-stamp/10 disabled:opacity-60
        focus-visible:outline focus-visible:outline-2
        focus-visible:outline-offset-2 focus-visible:outline-stamp
        ${compact ? "px-2.5 py-1.5 text-xs" : "px-4 py-2.5 text-sm"}
      `}
    >
      {children}
    </button>
  );
}

/** Result banner for a completed action. */
export function FormBanner({ state }: { state: ActionState }) {
  if (!state.message) return null;

  const tone = state.ok
    ? "border-palm/30 bg-palm/10 text-palm"
    : "border-stamp/30 bg-stamp/10 text-stamp";
  const Icon = state.ok ? CheckCircle2 : AlertCircle;

  return (
    <p
      role="status"
      className={`flex items-center gap-2 rounded-card border px-3 py-2 text-xs font-medium ${tone}`}
    >
      <Icon size={14} className="shrink-0" aria-hidden="true" />
      {state.message}
    </p>
  );
}
