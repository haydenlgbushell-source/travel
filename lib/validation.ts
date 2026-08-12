import { z } from "zod";

/**
 * Input schemas for every write path.
 *
 * These run on the server inside the action, never only in the browser: HTML
 * validation attributes are there to help someone filling the form in, not to
 * be trusted. Field names match the `name` attributes so `parseForm` can map
 * errors straight back onto inputs.
 */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker");

const time = z.string().regex(/^\d{2}:\d{2}$/, "Use the time picker");

const trimmed = (max: number) => z.string().trim().max(max);

/** "1234.50" or "1234" → 123450 cents. Rejects anything else. */
const moneyToCents = z
  .string()
  .trim()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, "Enter an amount like 1250 or 1250.50")
  .transform((value) => Math.round(Number(value) * 100));

const dateRange = <T extends { startDate: string; endDate: string }>(
  schema: z.ZodType<T>,
) =>
  schema.refine((value) => value.endDate >= value.startDate, {
    message: "End date can't be before the start date",
    path: ["endDate"],
  });

export const tripSchema = dateRange(
  z.object({
    name: trimmed(80).min(2, "Give the trip a name"),
    destination: trimmed(80).min(2, "Where are you going?"),
    coverRoute: trimmed(24).min(2, "Something like SYD → DPS"),
    startDate: isoDate,
    endDate: isoDate,
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Three-letter code, e.g. AUD"),
    perPersonTarget: moneyToCents,
  }),
);

export const tripSettingsSchema = dateRange(
  z.object({
    name: trimmed(80).min(2, "Give the trip a name"),
    destination: trimmed(80).min(2, "Where are you going?"),
    coverRoute: trimmed(24).min(2, "Something like SYD → DPS"),
    startDate: isoDate,
    endDate: isoDate,
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Three-letter code, e.g. AUD"),
    perPersonTarget: moneyToCents,
    status: z.enum(["planning", "confirmed", "live", "complete"]),
    mapLabel: trimmed(80),
  }),
);

export const memberSchema = z.object({
  name: trimmed(60).min(2, "Who are you adding?"),
  initials: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{1,3}$/, "One to three letters"),
  role: z.enum(["organiser", "member"]),
});

export const accommodationSchema = z
  .object({
    name: trimmed(80).min(2, "Name the place"),
    address: trimmed(160).min(2, "Add an address"),
    checkIn: isoDate,
    checkOut: isoDate,
    reference: trimmed(40),
    bookingUrl: z
      .union([z.literal(""), z.string().trim().url("Needs to be a full URL")])
      .optional(),
    guests: z.coerce.number().int().min(1, "At least one").max(64),
    notes: trimmed(400).optional(),
  })
  .refine((value) => value.checkOut > value.checkIn, {
    message: "Check-out has to be after check-in",
    path: ["checkOut"],
  });

const airportCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Three-letter airport code");

export const flightSchema = z
  .object({
    direction: z.enum(["outbound", "return"]),
    airline: trimmed(60).min(2, "Which airline?"),
    flightNumber: trimmed(10).min(2, "e.g. GA715"),
    originCode: airportCode,
    originCity: trimmed(60).min(2, "Departing from where?"),
    destinationCode: airportCode,
    destinationCity: trimmed(60).min(2, "Arriving where?"),
    departsAt: z.string().min(1, "When does it leave?"),
    arrivesAt: z.string().min(1, "When does it land?"),
    status: z.enum(["confirmed", "on-time", "delayed", "cancelled"]),
    gate: trimmed(8).optional(),
    seatLabel: trimmed(24).optional(),
    reference: trimmed(20),
  })
  .refine((value) => value.destinationCode !== value.originCode, {
    message: "Origin and destination can't match",
    path: ["destinationCode"],
  });

export const transportSchema = z.object({
  kind: z.enum(["transfer", "scooter", "driver", "ferry"]),
  label: trimmed(80).min(2, "What is it?"),
  detail: trimmed(200),
  status: z.enum(["booked", "pending", "idea"]),
  cost: trimmed(20).optional(),
});

export const eventSchema = z.object({
  dayDate: isoDate,
  time,
  title: trimmed(90).min(2, "What's happening?"),
  subtitle: trimmed(160).optional(),
  tag: z.enum(["food", "activity", "travel", "rest", "booking", "free"]),
  location: trimmed(80).optional(),
  isHighlight: z.coerce.boolean().default(false),
});

export const expenseSchema = z.object({
  category: z.enum(["flights", "stay", "food", "activities", "transport", "other"]),
  label: trimmed(80).min(2, "What was it for?"),
  amount: moneyToCents,
  paidByMemberId: z.string().min(1, "Who paid?"),
  splitAcrossMemberIds: z
    .array(z.string())
    .min(1, "Split it across at least one person"),
});

export const packingItemSchema = z.object({
  category: trimmed(40).min(1, "Which group?"),
  label: trimmed(80).min(2, "What needs packing?"),
  assignedToMemberId: z.string().optional(),
});

export const pollSchema = z.object({
  question: trimmed(140).min(4, "What's the question?"),
  closesAt: isoDate,
  options: z
    .array(trimmed(80).min(1))
    .min(2, "A vote needs at least two options")
    .max(6, "Six options is plenty"),
});

export const alertSchema = z.object({
  tone: z.enum(["urgent", "info", "success"]),
  title: trimmed(90).min(2, "What's the heading?"),
  body: trimmed(240).min(2, "Add a bit of detail"),
});

// ── Form plumbing ────────────────────────────────────────────────────────────

export interface ActionState {
  ok: boolean;
  message?: string;
  /** Keyed by field name, matching the input's `name` attribute. */
  fieldErrors?: Record<string, string>;
  /** What the user typed, so a rejected form doesn't come back blank. */
  values?: Record<string, string>;
}

export const IDLE_STATE: ActionState = { ok: false };

/**
 * Run a schema over FormData and flatten Zod's issues into one message per
 * field — which is all the form UI shows.
 */
export function parseForm<T>(
  schema: z.ZodType<T>,
  raw: Record<string, unknown>,
): { ok: true; data: T } | { ok: false; state: ActionState } {
  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "form";
    fieldErrors[key] ??= issue.message;
  }

  // Echo back only the scalar fields; array inputs are re-derived from the DB.
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") values[key] = value;
  }

  return {
    ok: false,
    state: {
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors,
      values,
    },
  };
}

/** FormData → plain object, with `getAll` for the fields declared as arrays. */
export function formToObject(
  formData: FormData,
  arrayFields: string[] = [],
): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (arrayFields.includes(key)) continue;
    if (typeof value === "string") raw[key] = value;
  }
  for (const field of arrayFields) {
    raw[field] = formData.getAll(field).filter((v) => typeof v === "string");
  }
  return raw;
}
