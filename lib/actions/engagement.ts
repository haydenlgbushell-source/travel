"use server";

import * as store from "@/lib/data/store";
import {
  alertSchema,
  formToObject,
  packingItemSchema,
  parseForm,
  pollSchema,
  type ActionState,
} from "@/lib/validation";
import { requireTripAccess, revalidateTrip } from "./guard";

// ── Poll ─────────────────────────────────────────────────────────────────────

export async function savePollAction(
  slug: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTripAccess(slug);

  const raw = formToObject(formData, ["options"]);
  raw.options = (raw.options as string[])
    .map((option) => option.trim())
    .filter(Boolean);

  const parsed = parseForm(pollSchema, raw);
  if (!parsed.ok) return parsed.state;

  await store.upsertPoll(slug, {
    question: parsed.data.question,
    closesAt: parsed.data.closesAt,
    optionLabels: parsed.data.options,
  });

  revalidateTrip(slug);
  return { ok: true, message: "Vote saved." };
}

export async function deletePollAction(slug: string): Promise<void> {
  await requireTripAccess(slug);
  await store.deletePoll(slug);
  revalidateTrip(slug);
}

/**
 * One vote per member, changeable until the poll closes. Voting for the option
 * you already picked clears your vote.
 */
export async function castVoteAction(
  slug: string,
  pollId: string,
  optionId: string,
): Promise<void> {
  const user = await requireTripAccess(slug);
  await store.castVote(pollId, user.id, optionId);
  revalidateTrip(slug);
}

// ── Packing ──────────────────────────────────────────────────────────────────

export async function addPackingItemAction(
  slug: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTripAccess(slug);

  const parsed = parseForm(packingItemSchema, formToObject(formData));
  if (!parsed.ok) return parsed.state;

  await store.addPackingItem(slug, {
    category: parsed.data.category,
    label: parsed.data.label,
    assignedToMemberId: parsed.data.assignedToMemberId || undefined,
  });

  revalidateTrip(slug);
  return { ok: true, message: "Added to the list." };
}

export async function deletePackingItemAction(
  slug: string,
  formData: FormData,
): Promise<void> {
  await requireTripAccess(slug);
  await store.deletePackingItem(slug, String(formData.get("itemId") ?? ""));
  revalidateTrip(slug);
}

/** Per-user tick, so two people can pack the same thing independently. */
export async function togglePackingCheckAction(
  slug: string,
  itemId: string,
): Promise<void> {
  const user = await requireTripAccess(slug);
  await store.togglePackingCheck(itemId, user.id);
  revalidateTrip(slug);
}

// ── Alerts ───────────────────────────────────────────────────────────────────

export async function addAlertAction(
  slug: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTripAccess(slug);

  const parsed = parseForm(alertSchema, formToObject(formData));
  if (!parsed.ok) return parsed.state;

  await store.addAlert(slug, { ...parsed.data, dismissible: true });
  revalidateTrip(slug);
  return { ok: true, message: "Alert posted to the group." };
}

/** Dismissal is per-user: it hides the alert for you, not for everyone. */
export async function dismissAlertAction(
  slug: string,
  alertId: string,
): Promise<void> {
  const user = await requireTripAccess(slug);
  await store.dismissAlert(alertId, user.id);
  revalidateTrip(slug);
}
