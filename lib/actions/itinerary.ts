"use server";

import * as store from "@/lib/data/store";
import {
  eventSchema,
  formToObject,
  parseForm,
  type ActionState,
} from "@/lib/validation";
import { requireTripAccess, revalidateTrip } from "./guard";

export async function saveEventAction(
  slug: string,
  eventId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireTripAccess(slug);

  const parsed = parseForm(eventSchema, formToObject(formData));
  if (!parsed.ok) return parsed.state;

  await store.upsertEvent(
    slug,
    {
      dayDate: parsed.data.dayDate,
      time: parsed.data.time,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || undefined,
      tag: parsed.data.tag,
      location: parsed.data.location || undefined,
      isHighlight: parsed.data.isHighlight,
    },
    eventId ?? undefined,
  );

  if (!eventId) {
    await store.recordActivity(slug, {
      kind: "plan",
      title: `${user.name} added ${parsed.data.title}`,
      body: `${parsed.data.dayDate} at ${parsed.data.time}.`,
      actorInitials: user.initials,
    });
  }

  revalidateTrip(slug);
  return { ok: true, message: eventId ? "Item updated." : "Item added." };
}

export async function deleteEventAction(
  slug: string,
  formData: FormData,
): Promise<void> {
  await requireTripAccess(slug);
  await store.deleteEvent(slug, String(formData.get("eventId") ?? ""));
  revalidateTrip(slug);
}

export async function setDayLabelAction(
  slug: string,
  formData: FormData,
): Promise<void> {
  await requireTripAccess(slug);

  const date = String(formData.get("date") ?? "");
  const label = String(formData.get("label") ?? "").slice(0, 40);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

  await store.setDayLabel(slug, date, label);
  revalidateTrip(slug);
}
