import type { ReactNode } from "react";

/**
 * The base ticket-stub card. Everything in the itinerary sits on one of these
 * so the kraft/paper texture stays consistent.
 */
export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
}) {
  return (
    <Tag
      className={`rounded-card border border-line bg-paper-hi shadow-card ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Small uppercase label used above figures and in card headers. */
export function Overline({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`font-mono text-[10px] uppercase tracking-[0.14em] text-muted ${className}`}
    >
      {children}
    </span>
  );
}

type PillTone = "neutral" | "lagoon" | "palm" | "stamp" | "papaya";

const PILL_TONES: Record<PillTone, string> = {
  neutral: "bg-line/50 text-ink-text",
  lagoon: "bg-lagoon/12 text-lagoon-dark",
  palm: "bg-palm/15 text-palm",
  stamp: "bg-stamp/12 text-stamp",
  papaya: "bg-papaya/15 text-[#8A3A1A]",
};

export function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: PillTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] ${PILL_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Section header used above each block of the itinerary. The `id` lands on the
 * enclosing <section> instead, so the shortcut nav's scroll-spy has one
 * observable target per section.
 */
export function SectionHeading({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-5">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold leading-tight text-ink">
          {title}
        </h2>
        {meta ? <p className="mt-0.5 text-xs text-muted">{meta}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
