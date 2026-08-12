import type { Budget, Expense, TripMember } from "./types";

/**
 * Formatting + derived-value helpers.
 *
 * Everything here is pure and timezone-explicit: dates in the domain are stored
 * as ISO strings and rendered in UTC or with their own offset, so a server
 * render and a client hydrate always produce the same string.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "10 Sep" */
export function formatShortDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "10–17 Sep 2026", collapsing the month when both ends share it. */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  const sameMonth =
    start.getUTCMonth() === end.getUTCMonth() &&
    start.getUTCFullYear() === end.getUTCFullYear();

  if (sameMonth) {
    return `${start.getUTCDate()}–${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
  }
  return `${formatShortDate(startIso)} – ${formatShortDate(endIso)} ${end.getUTCFullYear()}`;
}

/**
 * Local wall-clock time of a timestamp that carries its own offset — i.e. the
 * time shown on the departure board at that airport, not the viewer's time.
 */
export function formatOffsetTime(isoWithOffset: string): string {
  const match = isoWithOffset.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "--:--";
}

/** Date portion of an offset-carrying timestamp: "10 Sep". */
export function formatOffsetDate(isoWithOffset: string): string {
  const match = isoWithOffset.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";
  const [, , month, day] = match;
  return `${Number(day)} ${MONTHS[Number(month) - 1]}`;
}

/** "3d ago", "4h ago", "just now" — relative to a fixed reference. */
export function formatRelativeTime(isoTimestamp: string, now: Date): string {
  const diffMs = now.getTime() - new Date(isoTimestamp).getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return `${Math.floor(days / 7)}w ago`;
}

/** Minor units → "$1,234.50" style, no cents when the amount is whole. */
export function formatMoney(amountCents: number, currency: string): string {
  const whole = amountCents % 100 === 0;
  const value = (amountCents / 100).toLocaleString("en-AU", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });
  return `${currency === "AUD" ? "$" : ""}${value}`;
}

export interface BudgetTotals {
  totalCents: number;
  perPersonCents: number;
  targetCents: number;
  /** Positive = under budget. */
  varianceCents: number;
  byCategory: { category: Expense["category"]; label: string; amountCents: number }[];
}

const CATEGORY_LABELS: Record<Expense["category"], string> = {
  flights: "Flights",
  stay: "Accommodation",
  food: "Food & drink",
  activities: "Activities",
  transport: "Transport",
  other: "Other",
};

export function summariseBudget(budget: Budget, memberCount: number): BudgetTotals {
  const totalCents = budget.expenses.reduce((sum, x) => sum + x.amountCents, 0);
  const perPersonCents = memberCount > 0 ? Math.round(totalCents / memberCount) : 0;

  const totals = new Map<Expense["category"], number>();
  for (const expense of budget.expenses) {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amountCents);
  }

  const byCategory = [...totals.entries()]
    .map(([category, amountCents]) => ({
      category,
      label: CATEGORY_LABELS[category],
      amountCents,
    }))
    .sort((a, b) => b.amountCents - a.amountCents);

  return {
    totalCents,
    perPersonCents,
    targetCents: budget.perPersonTargetCents,
    varianceCents: budget.perPersonTargetCents - perPersonCents,
    byCategory,
  };
}

export interface MemberBalance {
  member: TripMember;
  paidCents: number;
  owesCents: number;
  /** Positive = the group owes them. */
  netCents: number;
}

/**
 * Even split across each expense's `splitAcrossMemberIds`.
 * Rounding remainder lands on the payer so the balances always sum to zero.
 */
export function settleBalances(budget: Budget, members: TripMember[]): MemberBalance[] {
  const paid = new Map<string, number>();
  const owed = new Map<string, number>();

  for (const expense of budget.expenses) {
    paid.set(expense.paidByMemberId, (paid.get(expense.paidByMemberId) ?? 0) + expense.amountCents);

    const shares = expense.splitAcrossMemberIds;
    if (shares.length === 0) continue;

    const share = Math.floor(expense.amountCents / shares.length);
    const remainder = expense.amountCents - share * shares.length;

    for (const memberId of shares) {
      owed.set(memberId, (owed.get(memberId) ?? 0) + share);
    }
    if (remainder > 0) {
      owed.set(
        expense.paidByMemberId,
        (owed.get(expense.paidByMemberId) ?? 0) + remainder,
      );
    }
  }

  return members.map((member) => {
    const paidCents = paid.get(member.id) ?? 0;
    const owesCents = owed.get(member.id) ?? 0;
    return { member, paidCents, owesCents, netCents: paidCents - owesCents };
  });
}

/** Countdown copy for a trip that hasn't started, has, or is done. */
export function tripCountdownLabel(
  startIso: string,
  endIso: string,
  now: Date,
): string {
  const MS_PER_DAY = 86_400_000;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = new Date(`${startIso}T00:00:00Z`).getTime();
  const end = new Date(`${endIso}T00:00:00Z`).getTime();

  if (today > end) return "Trip complete";
  if (today >= start) {
    const dayNumber = Math.round((today - start) / MS_PER_DAY) + 1;
    return `Day ${dayNumber} — you're there`;
  }

  const daysToGo = Math.round((start - today) / MS_PER_DAY);
  if (daysToGo === 1) return "1 day to go";
  if (daysToGo < 31) return `${daysToGo} days to go`;
  return `${Math.round(daysToGo / 7)} weeks to go`;
}
