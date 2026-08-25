import { supabase } from "../../lib/supabase";
import { eventFromTripRow, upsertEvent, type EventDetails } from "../trip-setup/event-data";
import { daysForRange, loadTripContent, saveTripContent } from "../trip/trip-data";

export interface Agency {
  id: string;
  name: string;
  role: "Owner" | "Agent";
}

export const TRIP_STATUSES = [
  "Draft",
  "Quoted",
  "Confirmed",
  "Travelling",
  "Completed",
  "Cancelled",
] as const;

export type TripStatus = (typeof TRIP_STATUSES)[number];

/** The agency's own view of a client trip — who it's for, where it is in the
 *  pipeline, and what it's worth. Deliberately a separate table from `trips`
 *  so a client holding an access code (who can read the trip itself) can't
 *  read any of this. */
export interface TripAgencyDetails {
  tripId: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  status: TripStatus;
  costPrice?: number;
  sellPrice?: number;
  currency: string;
  notes?: string;
  archivedAt?: string;
}

export interface AgencyAgent {
  accountId: string;
  name?: string;
  mobile: string;
  role: "Owner" | "Agent";
  joinedAt: string;
}

interface TripRow {
  id: string;
  name: string;
  dates: string;
  start_date: string;
  end_date: string;
  destination: string | null;
  lat: number | null;
  lng: number | null;
  from_example: boolean;
  agency_id?: string | null;
  theme_key: string;
}

interface AgencyRpcRow {
  id: string;
  name: string;
  role: string;
}

interface DetailsRow {
  trip_id: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  status: string;
  cost_price: string | number | null;
  sell_price: string | number | null;
  currency: string;
  notes: string | null;
  archived_at: string | null;
}

interface AgentRpcRow {
  account_id: string;
  name: string | null;
  mobile: string | null;
  role: string;
  joined_at: string;
}

/** numeric(12,2) comes back from PostgREST as a string, so a plain cast
 *  would quietly produce "1200.00" where a number is expected. */
function toNumber(value: string | number | null): number | undefined {
  if (value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function detailsFromRow(row: DetailsRow): TripAgencyDetails {
  return {
    tripId: row.trip_id,
    clientName: row.client_name ?? undefined,
    clientEmail: row.client_email ?? undefined,
    clientPhone: row.client_phone ?? undefined,
    status: row.status as TripStatus,
    costPrice: toNumber(row.cost_price),
    sellPrice: toNumber(row.sell_price),
    currency: row.currency,
    notes: row.notes ?? undefined,
    archivedAt: row.archived_at ?? undefined,
  };
}

/** Agency access is granted, not self-served — an account only has one once
 *  the admin has designated it as an agency's Owner, or an Owner has added
 *  them as an Agent. This just reads whether that's true for the signed-in
 *  account; it never creates one. */
export async function loadMyAgency(): Promise<Agency | undefined> {
  const { data, error } = await supabase.rpc("my_agency");
  if (error) throw error;
  const row = (data as AgencyRpcRow[])[0];
  return row ? { id: row.id, name: row.name, role: row.role as Agency["role"] } : undefined;
}

/** Every trip tagged to this agency — RLS (has_agency_access) is what
 *  actually scopes this to agencies the caller belongs to, same as
 *  event-data.ts's loadEvents() relies on trip_members for personal ones. */
export async function loadAgencyTrips(agencyId: string): Promise<EventDetails[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("id, name, dates, start_date, end_date, destination, lat, lng, from_example, agency_id, theme_key")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as TripRow[]).map(eventFromTripRow);
}

/** Fetched for the whole list at once rather than per card — one request
 *  instead of one per trip, and the page needs every row anyway to filter
 *  and total by status. */
export async function loadAgencyTripDetails(
  tripIds: string[],
): Promise<Map<string, TripAgencyDetails>> {
  if (tripIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("trip_agency_details")
    .select("trip_id, client_name, client_email, client_phone, status, cost_price, sell_price, currency, notes, archived_at")
    .in("trip_id", tripIds);
  if (error) throw error;
  const rows = (data as DetailsRow[]).map(detailsFromRow);
  return new Map(rows.map((d) => [d.tripId, d]));
}

/** A trip that's never had its details opened has no row yet, so this is an
 *  upsert rather than an update — the first save creates it. */
export async function saveTripAgencyDetails(details: TripAgencyDetails): Promise<void> {
  const { error } = await supabase.from("trip_agency_details").upsert({
    trip_id: details.tripId,
    client_name: details.clientName?.trim() || null,
    client_email: details.clientEmail?.trim() || null,
    client_phone: details.clientPhone?.trim() || null,
    status: details.status,
    cost_price: details.costPrice ?? null,
    sell_price: details.sellPrice ?? null,
    currency: details.currency,
    notes: details.notes?.trim() || null,
    archived_at: details.archivedAt ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function loadAgencyAgents(agencyId: string): Promise<AgencyAgent[]> {
  const { data, error } = await supabase.rpc("agency_agents_with_names", {
    p_agency_id: agencyId,
  });
  if (error) throw error;
  return (data as AgentRpcRow[]).map((r) => ({
    accountId: r.account_id,
    name: r.name ?? undefined,
    mobile: r.mobile ?? "",
    role: r.role as AgencyAgent["role"],
    joinedAt: r.joined_at,
  }));
}

/** Owner-only, enforced in the RPC. Returns the new colleague's name so the
 *  caller can confirm who was actually added — a mistyped mobile that
 *  happens to exist would otherwise add a stranger silently. */
export async function addAgencyAgent(agencyId: string, mobile: string): Promise<string> {
  const { data, error } = await supabase.rpc("agency_add_agent", {
    p_agency_id: agencyId,
    p_mobile: mobile.replace(/[^\d]/g, ""),
  });
  if (error) throw error;
  return String(data ?? mobile);
}

export async function removeAgencyAgent(agencyId: string, accountId: string): Promise<void> {
  const { error } = await supabase.rpc("agency_remove_agent", {
    p_agency_id: agencyId,
    p_account_id: accountId,
  });
  if (error) throw error;
}

/** Rebuilds a past itinerary against new dates for a new client — the single
 *  thing an agent does most, and until now the only way was to retype it.
 *
 *  The day scaffolding (weekday, date label, weather slot) is regenerated
 *  from the new range via the same daysForRange the trip page uses, and only
 *  the planned items are carried across, day by day. That keeps a copy
 *  correct when the new trip is a different length: extra days come out
 *  empty, and a shorter trip drops the tail rather than leaving items
 *  stranded on dates that don't exist. Item ids are preserved so the saved
 *  approve/decline verdicts in `resolved` still line up. */
export async function duplicateTripForClient(
  source: EventDetails,
  accountId: string,
  next: { name: string; startDate: string; endDate: string; dates: string },
): Promise<EventDetails> {
  const copy: EventDetails = {
    ...source,
    id: crypto.randomUUID(),
    name: next.name,
    startDate: next.startDate,
    endDate: next.endDate,
    dates: next.dates,
    /* A copy is a real trip of its own, never still flagged as the
       built-in example even when copied from it. */
    fromExample: false,
  };
  await upsertEvent(accountId, copy, true);

  const content = await loadTripContent(source.id);
  if (content) {
    const scaffold = daysForRange(next.startDate, next.endDate);
    const days = scaffold.map((day, i) => {
      const from = content.days[i];
      return from ? { ...day, items: from.items, conflict: from.conflict } : day;
    });
    await saveTripContent(copy.id, { days, resolved: content.resolved });
  }
  return copy;
}
