"use server";

import * as store from "@/lib/data/store";
import {
  formToObject,
  memberSchema,
  parseForm,
  type ActionState,
} from "@/lib/validation";
import { requireTripAccess, revalidateTrip } from "./guard";

export async function addMemberAction(
  slug: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireTripAccess(slug);

  const parsed = parseForm(memberSchema, formToObject(formData));
  if (!parsed.ok) return parsed.state;

  await store.addMember(slug, parsed.data);
  await store.recordActivity(slug, {
    kind: "member",
    title: `${parsed.data.name} joined the trip`,
    body: `Invited by ${user.name}.`,
    actorInitials: parsed.data.initials,
  });

  revalidateTrip(slug);
  return { ok: true, message: `${parsed.data.name} added.` };
}

export async function updateMemberRoleAction(
  slug: string,
  formData: FormData,
): Promise<void> {
  await requireTripAccess(slug);

  const memberId = String(formData.get("memberId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (role !== "organiser" && role !== "member") return;

  await store.updateMemberRole(slug, memberId, role);
  revalidateTrip(slug);
}

export async function removeMemberAction(
  slug: string,
  formData: FormData,
): Promise<void> {
  await requireTripAccess(slug);

  const memberId = String(formData.get("memberId") ?? "");
  await store.removeMember(slug, memberId);
  revalidateTrip(slug);
}
