"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import * as store from "@/lib/data/store";
import {
  formToObject,
  parseForm,
  tripSchema,
  tripSettingsSchema,
  type ActionState,
} from "@/lib/validation";
import { requireTripAccess, revalidateTrip } from "./guard";

export async function createTripAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  const parsed = parseForm(tripSchema, formToObject(formData));
  if (!parsed.ok) return parsed.state;

  const slug = await store.createTrip(
    {
      name: parsed.data.name,
      destination: parsed.data.destination,
      coverRoute: parsed.data.coverRoute,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      currency: parsed.data.currency,
      perPersonTargetCents: parsed.data.perPersonTarget,
    },
    user,
  );

  await store.recordActivity(slug, {
    kind: "plan",
    title: `${user.name} created the trip`,
    body: `${parsed.data.name} · ${parsed.data.destination}`,
    actorInitials: user.initials,
  });

  revalidateTrip(slug);
  // Throws by design — nothing after this runs.
  redirect(`/trips/${slug}/edit`);
}

export async function updateTripSettingsAction(
  slug: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTripAccess(slug);

  const parsed = parseForm(tripSettingsSchema, formToObject(formData));
  if (!parsed.ok) return parsed.state;

  await store.updateTrip(slug, {
    name: parsed.data.name,
    destination: parsed.data.destination,
    coverRoute: parsed.data.coverRoute,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    currency: parsed.data.currency,
    perPersonTargetCents: parsed.data.perPersonTarget,
    status: parsed.data.status,
    mapLabel: parsed.data.mapLabel,
  });

  revalidateTrip(slug);
  return { ok: true, message: "Trip details saved." };
}

export async function deleteTripAction(slug: string): Promise<void> {
  await requireTripAccess(slug);
  await store.deleteTrip(slug);
  revalidateTrip(slug);
  redirect("/");
}
