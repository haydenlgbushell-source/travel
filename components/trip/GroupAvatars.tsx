import type { TripMember } from "@/lib/types";

const AVATAR_TONES = [
  "bg-lagoon text-paper-hi",
  "bg-papaya text-[#3A1608]",
  "bg-palm text-paper-hi",
  "bg-stamp text-paper-hi",
  "bg-ink-soft text-paper-hi",
];

/**
 * Overlapping initials chips. In production the initials and any avatar image
 * come from the Supabase profiles row joined through `trip_members`.
 */
export function GroupAvatars({
  members,
  size = "md",
  max = 5,
  /** Surface the stack sits on — the separating ring has to match it. */
  surface = "paper",
}: {
  members: Pick<TripMember, "id" | "initials" | "name">[];
  size?: "sm" | "md";
  max?: number;
  surface?: "paper" | "ink";
}) {
  const shown = members.slice(0, max);
  const overflow = members.length - shown.length;

  const dimensions =
    size === "sm" ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[11px]";
  const ring = surface === "ink" ? "border-ink" : "border-paper-hi";

  return (
    <ul className="flex items-center -space-x-2">
      {shown.map((member, index) => (
        <li key={member.id}>
          <span
            title={member.name}
            className={`
              flex items-center justify-center rounded-full border-2 ${ring}
              font-mono font-semibold tracking-tight
              ${dimensions} ${AVATAR_TONES[index % AVATAR_TONES.length]}
            `}
          >
            {member.initials}
          </span>
          <span className="sr-only">{member.name}</span>
        </li>
      ))}
      {overflow > 0 ? (
        <li>
          <span
            className={`
              flex items-center justify-center rounded-full border-2 ${ring}
              bg-paper font-mono font-semibold text-ink ${dimensions}
            `}
          >
            +{overflow}
          </span>
        </li>
      ) : null}
    </ul>
  );
}
