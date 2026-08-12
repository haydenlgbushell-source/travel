import "server-only";

import { notFound } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { getTripDetail, getTripRecord } from "@/lib/data/store";
import type { TripDetail } from "@/lib/types";

/**
 * Loader shared by every trip screen. A trip the viewer isn't a member of is a
 * 404, not a 403 — the same rule the mutating actions enforce.
 */
export async function loadTrip(slug: string): Promise<{
  user: CurrentUser;
  detail: TripDetail;
  mapLabel: string;
}> {
  const user = await getCurrentUser();
  const detail = await getTripDetail(slug, user.id);
  if (!detail || !detail.trip.members.some((m) => m.id === user.id)) notFound();

  const record = await getTripRecord(slug);
  return { user, detail, mapLabel: record?.mapLabel ?? "" };
}
