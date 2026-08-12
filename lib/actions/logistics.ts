"use server";

import * as store from "@/lib/data/store";
import {
  accommodationSchema,
  flightSchema,
  formToObject,
  parseForm,
  transportSchema,
  type ActionState,
} from "@/lib/validation";
import { requireTripAccess, revalidateTrip } from "./guard";

// ── Accommodation ────────────────────────────────────────────────────────────

export async function saveAccommodationAction(
  slug: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireTripAccess(slug);

  const parsed = parseForm(accommodationSchema, formToObject(formData));
  if (!parsed.ok) return parsed.state;

  const existing = (await store.getTripRecord(slug))?.accommodation ?? null;

  await store.upsertAccommodation(slug, {
    name: parsed.data.name,
    address: parsed.data.address,
    checkIn: parsed.data.checkIn,
    checkOut: parsed.data.checkOut,
    reference: parsed.data.reference,
    bookingUrl: parsed.data.bookingUrl || undefined,
    guests: parsed.data.guests,
    notes: parsed.data.notes || undefined,
  });

  await store.recordActivity(slug, {
    kind: "booking",
    title: existing ? "Accommodation updated" : "Accommodation added",
    body: `${parsed.data.name} · ${parsed.data.guests} guests.`,
    actorInitials: user.initials,
  });

  revalidateTrip(slug);
  return { ok: true, message: "Stay saved." };
}

export async function deleteAccommodationAction(slug: string): Promise<void> {
  await requireTripAccess(slug);
  await store.deleteAccommodation(slug);
  revalidateTrip(slug);
}

// ── Flights ──────────────────────────────────────────────────────────────────

/**
 * `departsAt` / `arrivesAt` come from `datetime-local` inputs, so they carry no
 * offset: "2026-09-09T23:55" means 23:55 on the departure board, which is the
 * only reading that makes sense for a flight. The formatters read the wall
 * clock straight out of the string, so seeded values that do carry an offset
 * render identically.
 */
export async function saveFlightAction(
  slug: string,
  flightId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireTripAccess(slug);

  const parsed = parseForm(flightSchema, formToObject(formData));
  if (!parsed.ok) return parsed.state;

  await store.upsertFlight(
    slug,
    {
      direction: parsed.data.direction,
      airline: parsed.data.airline,
      flightNumber: parsed.data.flightNumber.toUpperCase(),
      originCode: parsed.data.originCode,
      originCity: parsed.data.originCity,
      destinationCode: parsed.data.destinationCode,
      destinationCity: parsed.data.destinationCity,
      departsAt: parsed.data.departsAt,
      arrivesAt: parsed.data.arrivesAt,
      durationLabel: describeDuration(parsed.data.departsAt, parsed.data.arrivesAt),
      status: parsed.data.status,
      gate: parsed.data.gate || undefined,
      seatLabel: parsed.data.seatLabel || undefined,
      reference: parsed.data.reference,
    },
    flightId ?? undefined,
  );

  await store.recordActivity(slug, {
    kind: "flight",
    title: flightId ? "Flight updated" : "Flight added",
    body: `${parsed.data.originCode} → ${parsed.data.destinationCode} on ${parsed.data.flightNumber.toUpperCase()}.`,
    actorInitials: user.initials,
  });

  revalidateTrip(slug);
  return { ok: true, message: flightId ? "Flight updated." : "Flight added." };
}

export async function deleteFlightAction(
  slug: string,
  formData: FormData,
): Promise<void> {
  await requireTripAccess(slug);
  await store.deleteFlight(slug, String(formData.get("flightId") ?? ""));
  revalidateTrip(slug);
}

/**
 * Both timestamps are wall-clock in their own city, so the difference is only
 * meaningful when they share a timezone. Rather than guess an offset from an
 * airport code, show nothing when the result would be nonsense.
 */
function describeDuration(departsAt: string, arrivesAt: string): string {
  const start = Date.parse(`${departsAt}Z`);
  const end = Date.parse(`${arrivesAt}Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return "";

  const minutes = Math.round((end - start) / 60_000);
  if (minutes <= 0 || minutes > 60 * 24) return "";

  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

// ── Transport ────────────────────────────────────────────────────────────────

export async function saveTransportAction(
  slug: string,
  transportId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTripAccess(slug);

  const parsed = parseForm(transportSchema, formToObject(formData));
  if (!parsed.ok) return parsed.state;

  await store.upsertTransport(
    slug,
    {
      kind: parsed.data.kind,
      label: parsed.data.label,
      detail: parsed.data.detail,
      status: parsed.data.status,
      cost: parsed.data.cost || undefined,
    },
    transportId ?? undefined,
  );

  revalidateTrip(slug);
  return {
    ok: true,
    message: transportId ? "Transport updated." : "Transport added.",
  };
}

export async function deleteTransportAction(
  slug: string,
  formData: FormData,
): Promise<void> {
  await requireTripAccess(slug);
  await store.deleteTransport(slug, String(formData.get("transportId") ?? ""));
  revalidateTrip(slug);
}
