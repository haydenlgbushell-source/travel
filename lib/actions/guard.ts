import "server-only";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { canEditTrip } from "@/lib/data/store";

/**
 * Every mutating action starts here.
 *
 * A user who isn't on the trip gets a 404 rather than a 403 — a trip they
 * aren't part of shouldn't be confirmed to exist. Under Supabase this pairs
 * with an RLS policy doing the same check in the database; the guard stays as
 * the thing that turns "no rows" into the right HTTP response.
 */
export async function requireTripAccess(slug: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!(await canEditTrip(slug, user.id))) notFound();
  return user;
}

/**
 * Refresh every route that renders this trip. The edit pages and the itinerary
 * read the same records, so a write in one has to invalidate the other.
 */
export function revalidateTrip(slug: string) {
  revalidatePath(`/trips/${slug}`);
  revalidatePath(`/trips/${slug}/edit`, "layout");
  revalidatePath("/");
}
