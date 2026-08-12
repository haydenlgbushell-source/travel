import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

/** Header shared by every editor screen. */
export function EditShell({
  title,
  meta,
  backHref,
  backLabel,
  children,
}: {
  title: string;
  meta?: string;
  backHref: string;
  backLabel: string;
  children: ReactNode;
}) {
  return (
    <>
      <header className="bg-ink px-5 pb-6 pt-5 text-paper">
        <Link
          href={backHref}
          className="
            -ml-2 inline-flex items-center gap-1 rounded-pill px-2 py-1 text-xs
            font-medium text-paper/70 transition-colors hover:text-paper
            focus-visible:outline focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-paper
          "
        >
          <ChevronLeft size={14} aria-hidden="true" />
          {backLabel}
        </Link>

        <h1 className="mt-4 font-display text-2xl font-semibold leading-tight">
          {title}
        </h1>
        {meta ? <p className="mt-1 text-sm text-paper/70">{meta}</p> : null}
      </header>

      <main className="px-5 py-6">{children}</main>
    </>
  );
}

/**
 * Collapsed row for an existing item. The edit form lives inside a `<details>`
 * so a list of twenty flights doesn't render twenty open forms, and it works
 * without JavaScript.
 */
export function EditableRow({
  summary,
  detail,
  children,
}: {
  summary: string;
  detail?: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-card border border-line bg-paper-hi">
      <summary
        className="
          flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3
          focus-visible:outline focus-visible:outline-2
          focus-visible:-outline-offset-2 focus-visible:outline-lagoon-dark
        "
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink-text">
            {summary}
          </span>
          {detail ? (
            <span className="mt-0.5 block truncate text-xs text-muted">
              {detail}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-lagoon-dark">
          <span className="group-open:hidden">Edit</span>
          <span className="hidden group-open:inline">Close</span>
        </span>
      </summary>

      <div className="border-t border-line px-4 py-4">{children}</div>
    </details>
  );
}

/** Placeholder shown when a section has nothing in it yet. */
export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-card border border-dashed border-line px-4 py-5 text-center text-sm text-muted">
      {children}
    </p>
  );
}

export function FormCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-line bg-paper-hi p-4">
      <h2 className="mb-3 font-display text-base font-semibold text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}
