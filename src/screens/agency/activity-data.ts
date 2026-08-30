import { supabase } from "../../lib/supabase";
import type { ItemKind } from "../trip/trip-data";

/** An agency's reusable library entry — built once, dropped into any client
 *  trip that visits the same place. Deliberately smaller than a `TripItem`:
 *  no time and no travel leg, since neither means anything outside a day. */
export interface AgencyActivity {
  id: string;
  agencyId: string;
  country: string;
  city: string;
  kind: ItemKind;
  title: string;
  place?: string;
  lat?: number;
  lng?: number;
  note?: string;
  /** Same base-currency convention as `TripItem.costEach` — converted to
   *  whatever the trip is showing when it's dropped in. */
  costEach?: number;
  photoUrl?: string;
  createdAt: string;
}

interface ActivityRow {
  id: string;
  agency_id: string;
  country: string;
  city: string;
  kind: string;
  title: string;
  place: string | null;
  lat: number | null;
  lng: number | null;
  note: string | null;
  cost_each: string | number | null;
  photo_url: string | null;
  created_at: string;
}

function fromRow(row: ActivityRow): AgencyActivity {
  return {
    id: row.id,
    agencyId: row.agency_id,
    country: row.country,
    city: row.city,
    kind: row.kind as ItemKind,
    title: row.title,
    place: row.place ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    note: row.note ?? undefined,
    costEach: row.cost_each === null || row.cost_each === "" ? undefined : Number(row.cost_each),
    photoUrl: row.photo_url ?? undefined,
    createdAt: row.created_at,
  };
}

/** RLS (is_agency_member) is what actually scopes this — every member sees
 *  the whole library, not just what they personally added. */
export async function loadAgencyActivities(agencyId: string): Promise<AgencyActivity[]> {
  const { data, error } = await supabase
    .from("agency_activities")
    .select("id, agency_id, country, city, kind, title, place, lat, lng, note, cost_each, photo_url, created_at")
    .eq("agency_id", agencyId)
    .order("country")
    .order("city")
    .order("title");
  if (error) throw error;
  return (data as ActivityRow[]).map(fromRow);
}

export type AgencyActivityDraft = Omit<AgencyActivity, "id" | "createdAt">;

/** Any agency member can add or edit — this is a shared team tool, not
 *  owner-gated like the brand. `id` present means editing in place. */
export async function saveAgencyActivity(
  draft: AgencyActivityDraft,
  id?: string,
): Promise<AgencyActivity> {
  const row = {
    agency_id: draft.agencyId,
    country: draft.country.trim(),
    city: draft.city.trim(),
    kind: draft.kind,
    title: draft.title.trim(),
    place: draft.place?.trim() || null,
    lat: draft.lat ?? null,
    lng: draft.lng ?? null,
    note: draft.note?.trim() || null,
    cost_each: draft.costEach ?? null,
    photo_url: draft.photoUrl?.trim() || null,
    updated_at: new Date().toISOString(),
  };
  const query = id
    ? supabase.from("agency_activities").update(row).eq("id", id)
    : supabase.from("agency_activities").insert(row);
  const { data, error } = await query
    .select("id, agency_id, country, city, kind, title, place, lat, lng, note, cost_each, photo_url, created_at")
    .single();
  if (error) throw error;
  return fromRow(data as ActivityRow);
}

export async function deleteAgencyActivity(id: string): Promise<void> {
  const { error } = await supabase.from("agency_activities").delete().eq("id", id);
  if (error) throw error;
}
