/**
 * Domain types for the itinerary platform.
 *
 * These deliberately mirror the intended Supabase table shapes (snake_case
 * columns become camelCase here, ids stay opaque strings). When the data layer
 * lands, `lib/mock-data.ts` is replaced by Supabase queries returning these same
 * types — components should not need to change.
 *
 * Note: there is no `documents` type. The product does not accept uploads of
 * personal documents (passports, insurance, boarding-pass files), so no table,
 * no storage bucket, and no PII at rest.
 */

export type MemberRole = "organiser" | "member";

/** trip_members */
export interface TripMember {
  id: string;
  name: string;
  initials: string;
  role: MemberRole;
}

export type TripStatus = "planning" | "confirmed" | "live" | "complete";

/** trips */
export interface Trip {
  id: string;
  slug: string;
  name: string;
  destination: string;
  /** Airport-style route code shown in the hero, e.g. "SYD → DPS". */
  coverRoute: string;
  startDate: string;
  endDate: string;
  organiserId: string;
  status: TripStatus;
  members: TripMember[];
}

export type AlertTone = "urgent" | "info" | "success";

/** alerts */
export interface TripAlert {
  id: string;
  tone: AlertTone;
  title: string;
  body: string;
  dismissible: boolean;
}

export type NotificationKind =
  | "booking"
  | "payment"
  | "flight"
  | "member"
  | "plan";

/** notifications */
export interface TripNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** ISO 8601. Rendered as relative time against the trip's "now". */
  createdAt: string;
  actorInitials?: string;
}

/** accommodations */
export interface Accommodation {
  id: string;
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  reference: string;
  bookingUrl?: string;
  nights: number;
  guests: number;
  notes?: string;
}

export type FlightDirection = "outbound" | "return";
export type FlightStatus = "confirmed" | "on-time" | "delayed" | "cancelled";

/** flights */
export interface Flight {
  id: string;
  direction: FlightDirection;
  airline: string;
  flightNumber: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  departsAt: string;
  arrivesAt: string;
  durationLabel: string;
  status: FlightStatus;
  gate?: string;
  seatLabel?: string;
  reference: string;
}

export type TransportKind = "transfer" | "scooter" | "driver" | "ferry";
export type TransportStatus = "booked" | "pending" | "idea";

/** transport */
export interface TransportItem {
  id: string;
  kind: TransportKind;
  label: string;
  detail: string;
  status: TransportStatus;
  cost?: string;
}

export type EventTag =
  | "food"
  | "activity"
  | "travel"
  | "rest"
  | "booking"
  | "free";

/** itinerary_events */
export interface ItineraryEvent {
  id: string;
  /** ISO date (YYYY-MM-DD) — groups events into a day. */
  dayDate: string;
  time: string;
  title: string;
  subtitle?: string;
  tag: EventTag;
  isHighlight: boolean;
  location?: string;
}

/** A day of the trip, derived from trips.start_date + itinerary_events. */
export interface TripDay {
  date: string;
  /** "Thu", "Fri" … */
  weekdayShort: string;
  /** "14" */
  dayOfMonth: string;
  label: string;
  events: ItineraryEvent[];
}

export type ExpenseCategory =
  | "flights"
  | "stay"
  | "food"
  | "activities"
  | "transport"
  | "other";

/** expenses */
export interface Expense {
  id: string;
  category: ExpenseCategory;
  label: string;
  /** Minor units (cents) to keep money integer-safe. */
  amountCents: number;
  paidByMemberId: string;
  splitAcrossMemberIds: string[];
}

export interface Budget {
  currency: string;
  /** Minor units. Per-person target set by the organiser. */
  perPersonTargetCents: number;
  expenses: Expense[];
}

/** poll_options */
export interface PollOption {
  id: string;
  label: string;
  detail?: string;
  voteCount: number;
}

/** polls */
export interface Poll {
  id: string;
  question: string;
  closesAt: string;
  options: PollOption[];
  totalVoters: number;
}

/** packing_items */
export interface PackingItem {
  id: string;
  category: string;
  label: string;
  isDone: boolean;
  assignedToMemberId?: string;
}

/** A ticket the group already holds. Reference codes only — nothing uploaded. */
export interface WalletTicket {
  id: string;
  title: string;
  detail: string;
  reference: string;
  validOn: string;
  holderInitials: string[];
}

export interface EntryRequirement {
  id: string;
  label: string;
  detail: string;
  status: "required" | "recommended" | "not-required";
}

export interface EmergencyContact {
  id: string;
  label: string;
  value: string;
  detail?: string;
  href?: string;
}

export interface WeatherDay {
  label: string;
  /** Celsius. */
  high: number;
  low: number;
  condition: "sun" | "cloud" | "rain" | "storm";
  rainChance: number;
}

/**
 * Everything one trip page needs. In production this is the return type of a
 * single `getTrip(slug)` server function backed by Supabase.
 */
export interface TripDetail {
  trip: Trip;
  alerts: TripAlert[];
  notifications: TripNotification[];
  accommodation: Accommodation;
  flights: Flight[];
  transport: TransportItem[];
  days: TripDay[];
  budget: Budget;
  poll: Poll;
  packing: PackingItem[];
  wallet: WalletTicket[];
  entryRequirements: EntryRequirement[];
  emergencyContacts: EmergencyContact[];
  weather: WeatherDay[];
  mapLabel: string;
}

/** Row shape for the trips index — the platform's home screen. */
export interface TripSummary {
  id: string;
  slug: string;
  name: string;
  destination: string;
  coverRoute: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  memberInitials: string[];
  daysUntil: number | null;
}
