import "server-only";

import type {
  Accommodation,
  Budget,
  EmergencyContact,
  EntryRequirement,
  Expense,
  Flight,
  ItineraryEvent,
  MemberRole,
  PackingItem,
  Poll,
  PollOption,
  TransportItem,
  Trip,
  TripAlert,
  TripDay,
  TripDetail,
  TripNotification,
  TripStatus,
  TripSummary,
  WalletTicket,
  WeatherDay,
} from "@/lib/types";
import { BALI_TRIP } from "@/lib/mock-data";

/**
 * In-memory data layer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS DOES NOT PERSIST. The store is a module-level singleton: it survives
 * navigation within one running server, and resets whenever the process
 * restarts. On serverless hosting each instance gets its own copy, so two
 * requests can legitimately disagree. It exists so the write paths — forms,
 * validation, server actions, revalidation — can be built and reviewed for
 * real ahead of the database.
 *
 * The shape here is deliberately *normalised*, matching the planned Postgres
 * tables rather than the view model:
 *
 *   - votes live in their own table keyed by (poll, user), not as a count on
 *     the option
 *   - packing ticks are per (item, user), not a boolean on the item
 *   - alert dismissals are per (alert, user)
 *
 * `projectTripDetail` is the read query that joins all of that back into the
 * `TripDetail` the UI consumes. Swapping to Supabase replaces the bodies of
 * these functions; the signatures and the projection stay.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Storage row for a packing item — no `isDone`; that is per-user. */
type PackingItemRecord = Omit<PackingItem, "isDone">;

/** Storage row for a poll option — no `voteCount`; that is derived. */
type PollOptionRecord = Omit<PollOption, "voteCount">;

interface PollRecord {
  id: string;
  question: string;
  closesAt: string;
  options: PollOptionRecord[];
}

interface TripRecord {
  trip: Trip;
  /** Per-date headings shown above each day's timeline. */
  dayLabels: Record<string, string>;
  alerts: TripAlert[];
  notifications: TripNotification[];
  accommodation: Accommodation | null;
  flights: Flight[];
  transport: TransportItem[];
  events: ItineraryEvent[];
  budget: Budget;
  poll: PollRecord | null;
  packing: PackingItemRecord[];
  wallet: WalletTicket[];
  entryRequirements: EntryRequirement[];
  emergencyContacts: EmergencyContact[];
  weather: WeatherDay[];
  mapLabel: string;
}

interface Database {
  trips: Map<string, TripRecord>;
  /** poll_votes: pollId → (userId → optionId) */
  pollVotes: Map<string, Map<string, string>>;
  /** packing_checks: itemId → set of userIds */
  packingChecks: Map<string, Set<string>>;
  /** alert_dismissals: alertId → set of userIds */
  alertDismissals: Map<string, Set<string>>;
}

// ── Seeding ──────────────────────────────────────────────────────────────────

function seedFromDemo(): Database {
  const db: Database = {
    trips: new Map(),
    pollVotes: new Map(),
    packingChecks: new Map(),
    alertDismissals: new Map(),
  };

  const demo = BALI_TRIP;
  // The seed always carries these; the read model allows them to be absent.
  const demoPoll = demo.poll;
  const demoStay = demo.accommodation;

  db.trips.set(demo.trip.slug, {
    trip: structuredClone(demo.trip),
    dayLabels: Object.fromEntries(demo.days.map((day) => [day.date, day.label])),
    alerts: structuredClone(demo.alerts),
    notifications: structuredClone(demo.notifications),
    accommodation: demoStay ? structuredClone(demoStay) : null,
    flights: structuredClone(demo.flights),
    transport: structuredClone(demo.transport),
    events: demo.days.flatMap((day) => structuredClone(day.events)),
    budget: structuredClone(demo.budget),
    poll: demoPoll
      ? {
          id: demoPoll.id,
          question: demoPoll.question,
          closesAt: demoPoll.closesAt,
          options: demoPoll.options.map(({ id, label, detail }) => ({
            id,
            label,
            detail,
          })),
        }
      : null,
    // `isDone` is dropped here: it becomes a per-user check row below.
    packing: demo.packing.map((item) => ({
      id: item.id,
      category: item.category,
      label: item.label,
      assignedToMemberId: item.assignedToMemberId,
    })),
    wallet: structuredClone(demo.wallet),
    entryRequirements: structuredClone(demo.entryRequirements),
    emergencyContacts: structuredClone(demo.emergencyContacts),
    weather: structuredClone(demo.weather),
    mapLabel: demo.mapLabel,
  });

  // Turn the demo's vote counts into individual member votes, so the poll has a
  // real voter list. Hayden is left unvoted — the card should say "waiting on
  // you" for the demo user.
  if (demoPoll) {
    const voters = demo.trip.members.filter((m) => m.id !== "m-hayden");
    const votes = new Map<string, string>();
    let voterIndex = 0;
    for (const option of demoPoll.options) {
      for (let i = 0; i < option.voteCount && voterIndex < voters.length; i += 1) {
        votes.set(voters[voterIndex].id, option.id);
        voterIndex += 1;
      }
    }
    db.pollVotes.set(demoPoll.id, votes);
  }

  // Likewise, the demo's `isDone` flags become the demo user's own ticks.
  for (const item of demo.packing) {
    if (item.isDone) db.packingChecks.set(item.id, new Set(["m-hayden"]));
  }

  seedSecondaryTrips(db);
  return db;
}

/**
 * Two extra trips so the index reads as a platform, and so the empty states get
 * exercised: Lisbon is a bare trip someone just created, Queenstown is done.
 */
function seedSecondaryTrips(db: Database) {
  const emptyExtras = {
    dayLabels: {},
    alerts: [],
    notifications: [],
    accommodation: null,
    flights: [],
    transport: [],
    events: [],
    poll: null,
    packing: [],
    wallet: [],
    entryRequirements: [],
    emergencyContacts: [],
    weather: [],
  };

  db.trips.set("lisbon-birthday", {
    ...emptyExtras,
    trip: {
      id: "t-lisbon",
      slug: "lisbon-birthday",
      name: "Lisbon birthday weekend",
      destination: "Lisbon, Portugal",
      coverRoute: "LHR → LIS",
      startDate: "2027-03-19",
      endDate: "2027-03-23",
      organiserId: "m-hayden",
      status: "planning",
      members: [
        { id: "m-hayden", name: "Hayden", initials: "HB", role: "organiser" },
        { id: "m-priya", name: "Priya", initials: "PR", role: "member" },
        { id: "m-jules", name: "Jules", initials: "JS", role: "member" },
        { id: "m-mika", name: "Mika", initials: "MK", role: "member" },
        { id: "m-dana", name: "Dana", initials: "DN", role: "member" },
      ],
    },
    budget: { currency: "GBP", perPersonTargetCents: 60000, expenses: [] },
    mapLabel: "Nothing mapped yet",
  });

  db.trips.set("queenstown-ski", {
    ...emptyExtras,
    trip: {
      id: "t-queenstown",
      slug: "queenstown-ski",
      name: "Queenstown ski week",
      destination: "Queenstown, New Zealand",
      coverRoute: "MEL → ZQN",
      startDate: "2026-07-04",
      endDate: "2026-07-11",
      organiserId: "m-hayden",
      status: "complete",
      members: [
        { id: "m-hayden", name: "Hayden", initials: "HB", role: "organiser" },
        { id: "m-tom", name: "Tom", initials: "TM", role: "member" },
        { id: "m-alex", name: "Alex", initials: "AL", role: "member" },
      ],
    },
    budget: { currency: "NZD", perPersonTargetCents: 320000, expenses: [] },
    mapLabel: "Queenstown",
  });
}

/*
 * Held on globalThis so the dev server's module reloading doesn't wipe the
 * store on every edit — without this, each hot reload would reseed and any
 * changes made while clicking around would vanish.
 */
const globalForStore = globalThis as typeof globalThis & {
  __wayfareDb?: Database;
};

const db: Database = (globalForStore.__wayfareDb ??= seedFromDemo());

// ── Helpers ──────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MS_PER_DAY = 86_400_000;

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Every date from start to end inclusive, as ISO dates. */
function datesInRange(startIso: string, endIso: string): string[] {
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const dates: string[] = [];
  // Guard against an inverted or absurd range producing an unbounded loop.
  const span = Math.min(
    Math.round((end.getTime() - start.getTime()) / MS_PER_DAY),
    365,
  );
  for (let i = 0; i <= span; i += 1) {
    dates.push(new Date(start.getTime() + i * MS_PER_DAY).toISOString().slice(0, 10));
  }
  return dates;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function uniqueSlug(base: string): string {
  const root = base || "trip";
  if (!db.trips.has(root)) return root;

  let n = 2;
  while (db.trips.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}

// ── Read model ───────────────────────────────────────────────────────────────

function buildDays(record: TripRecord): TripDay[] {
  const byDate = new Map<string, ItineraryEvent[]>();
  for (const event of record.events) {
    const bucket = byDate.get(event.dayDate) ?? [];
    bucket.push(event);
    byDate.set(event.dayDate, bucket);
  }

  return datesInRange(record.trip.startDate, record.trip.endDate).map(
    (date, index) => {
      const d = new Date(`${date}T00:00:00Z`);
      const events = (byDate.get(date) ?? []).sort((a, b) =>
        a.time.localeCompare(b.time),
      );

      return {
        date,
        weekdayShort: WEEKDAYS[d.getUTCDay()],
        dayOfMonth: String(d.getUTCDate()),
        label: record.dayLabels[date] ?? `Day ${index + 1}`,
        events,
      };
    },
  );
}

function projectPoll(record: TripRecord, userId: string): Poll | null {
  if (!record.poll) return null;

  const votes = db.pollVotes.get(record.poll.id) ?? new Map<string, string>();
  const counts = new Map<string, number>();
  for (const optionId of votes.values()) {
    counts.set(optionId, (counts.get(optionId) ?? 0) + 1);
  }

  return {
    id: record.poll.id,
    question: record.poll.question,
    closesAt: record.poll.closesAt,
    totalVoters: record.trip.members.length,
    options: record.poll.options.map((option) => ({
      ...option,
      voteCount: counts.get(option.id) ?? 0,
    })),
    // Which option this user picked, so the card can show their own choice
    // rather than assuming they haven't voted.
    myVote: votes.get(userId) ?? null,
  };
}

/**
 * The read query. Joins the normalised rows into the view model, resolving
 * every per-user field against `userId`.
 */
export async function getTripDetail(
  slug: string,
  userId: string,
): Promise<TripDetail | null> {
  const record = db.trips.get(slug);
  if (!record) return null;

  return {
    trip: structuredClone(record.trip),
    days: buildDays(record),
    alerts: record.alerts.filter(
      (alert) => !db.alertDismissals.get(alert.id)?.has(userId),
    ),
    notifications: [...record.notifications].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
    accommodation: record.accommodation
      ? structuredClone(record.accommodation)
      : null,
    flights: [...record.flights],
    transport: [...record.transport],
    budget: structuredClone(record.budget),
    poll: projectPoll(record, userId),
    packing: record.packing.map((item) => ({
      ...item,
      isDone: db.packingChecks.get(item.id)?.has(userId) ?? false,
    })),
    wallet: [...record.wallet],
    entryRequirements: [...record.entryRequirements],
    emergencyContacts: [...record.emergencyContacts],
    weather: [...record.weather],
    mapLabel: record.mapLabel,
  };
}

export async function listTripsForUser(
  userId: string,
  now: Date = new Date(),
): Promise<TripSummary[]> {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  return [...db.trips.values()]
    .filter((record) => record.trip.members.some((m) => m.id === userId))
    .map((record) => ({
      id: record.trip.id,
      slug: record.trip.slug,
      name: record.trip.name,
      destination: record.trip.destination,
      coverRoute: record.trip.coverRoute,
      startDate: record.trip.startDate,
      endDate: record.trip.endDate,
      status: record.trip.status,
      memberInitials: record.trip.members.map((m) => m.initials),
      daysUntil: Math.round(
        (new Date(`${record.trip.startDate}T00:00:00Z`).getTime() - today) /
          MS_PER_DAY,
      ),
    }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/**
 * Authorisation check. Today it is a membership test against the store; under
 * Supabase the same rule becomes an RLS policy and this stays as the guard that
 * turns a denied row into a 404.
 */
export async function canEditTrip(
  slug: string,
  userId: string,
): Promise<boolean> {
  const record = db.trips.get(slug);
  return record?.trip.members.some((m) => m.id === userId) ?? false;
}

export async function getTripRecord(slug: string): Promise<TripRecord | null> {
  return db.trips.get(slug) ?? null;
}

// ── Trip writes ──────────────────────────────────────────────────────────────

export interface CreateTripInput {
  name: string;
  destination: string;
  coverRoute: string;
  startDate: string;
  endDate: string;
  currency: string;
  perPersonTargetCents: number;
}

export async function createTrip(
  input: CreateTripInput,
  organiser: { id: string; name: string; initials: string },
): Promise<string> {
  const slug = uniqueSlug(slugify(input.name));

  db.trips.set(slug, {
    trip: {
      id: newId("t"),
      slug,
      name: input.name,
      destination: input.destination,
      coverRoute: input.coverRoute,
      startDate: input.startDate,
      endDate: input.endDate,
      organiserId: organiser.id,
      status: "planning",
      members: [
        {
          id: organiser.id,
          name: organiser.name,
          initials: organiser.initials,
          role: "organiser",
        },
      ],
    },
    dayLabels: {},
    alerts: [],
    notifications: [],
    accommodation: null,
    flights: [],
    transport: [],
    events: [],
    budget: {
      currency: input.currency,
      perPersonTargetCents: input.perPersonTargetCents,
      expenses: [],
    },
    poll: null,
    packing: [],
    wallet: [],
    entryRequirements: [],
    emergencyContacts: [],
    weather: [],
    mapLabel: input.destination,
  });

  return slug;
}

export interface UpdateTripInput extends CreateTripInput {
  status: TripStatus;
  mapLabel: string;
}

export async function updateTrip(
  slug: string,
  input: UpdateTripInput,
): Promise<void> {
  const record = db.trips.get(slug);
  if (!record) return;

  record.trip = {
    ...record.trip,
    name: input.name,
    destination: input.destination,
    coverRoute: input.coverRoute,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
  };
  record.budget.currency = input.currency;
  record.budget.perPersonTargetCents = input.perPersonTargetCents;
  record.mapLabel = input.mapLabel;

  // Events stranded outside the new date range would silently disappear from
  // the timeline, so pull them back to the nearest end of the trip.
  const dates = datesInRange(input.startDate, input.endDate);
  if (dates.length > 0) {
    const first = dates[0];
    const last = dates[dates.length - 1];
    for (const event of record.events) {
      if (event.dayDate < first) event.dayDate = first;
      else if (event.dayDate > last) event.dayDate = last;
    }
  }
}

export async function deleteTrip(slug: string): Promise<void> {
  db.trips.delete(slug);
}

// ── Members ──────────────────────────────────────────────────────────────────

export async function addMember(
  slug: string,
  member: { name: string; initials: string; role: MemberRole },
): Promise<void> {
  const record = db.trips.get(slug);
  if (!record) return;

  record.trip.members.push({
    id: newId("m"),
    name: member.name,
    initials: member.initials.toUpperCase(),
    role: member.role,
  });
}

export async function updateMemberRole(
  slug: string,
  memberId: string,
  role: MemberRole,
): Promise<void> {
  const record = db.trips.get(slug);
  const member = record?.trip.members.find((m) => m.id === memberId);
  if (!record || !member) return;

  // A trip with no organiser has nobody who can invite or delete, so the last
  // one cannot demote themselves.
  if (
    role === "member" &&
    record.trip.members.filter((m) => m.role === "organiser").length === 1 &&
    member.role === "organiser"
  ) {
    return;
  }

  member.role = role;
  if (role === "organiser") record.trip.organiserId = memberId;
}

export async function removeMember(
  slug: string,
  memberId: string,
): Promise<void> {
  const record = db.trips.get(slug);
  if (!record) return;

  const remaining = record.trip.members.filter((m) => m.id !== memberId);
  if (remaining.length === 0) return;
  record.trip.members = remaining;

  // Expenses referencing the removed member would corrupt the split, so drop
  // them from every split list and delete anything they alone paid for.
  record.budget.expenses = record.budget.expenses
    .filter((expense) => expense.paidByMemberId !== memberId)
    .map((expense) => ({
      ...expense,
      splitAcrossMemberIds: expense.splitAcrossMemberIds.filter(
        (id) => id !== memberId,
      ),
    }))
    .filter((expense) => expense.splitAcrossMemberIds.length > 0);

  for (const item of record.packing) {
    if (item.assignedToMemberId === memberId) item.assignedToMemberId = undefined;
  }
  if (record.poll) db.pollVotes.get(record.poll.id)?.delete(memberId);
  for (const checks of db.packingChecks.values()) checks.delete(memberId);
}

// ── Accommodation ────────────────────────────────────────────────────────────

export async function upsertAccommodation(
  slug: string,
  input: Omit<Accommodation, "id" | "nights">,
): Promise<void> {
  const record = db.trips.get(slug);
  if (!record) return;

  const nights = Math.max(
    0,
    Math.round(
      (new Date(`${input.checkOut}T00:00:00Z`).getTime() -
        new Date(`${input.checkIn}T00:00:00Z`).getTime()) /
        MS_PER_DAY,
    ),
  );

  record.accommodation = {
    ...input,
    id: record.accommodation?.id ?? newId("acc"),
    nights,
  };
}

export async function deleteAccommodation(slug: string): Promise<void> {
  const record = db.trips.get(slug);
  if (record) record.accommodation = null;
}

// ── Flights ──────────────────────────────────────────────────────────────────

export async function upsertFlight(
  slug: string,
  flight: Omit<Flight, "id">,
  id?: string,
): Promise<void> {
  const record = db.trips.get(slug);
  if (!record) return;

  if (id) {
    const index = record.flights.findIndex((f) => f.id === id);
    if (index >= 0) record.flights[index] = { ...flight, id };
    return;
  }
  record.flights.push({ ...flight, id: newId("f") });
}

export async function deleteFlight(slug: string, id: string): Promise<void> {
  const record = db.trips.get(slug);
  if (record) record.flights = record.flights.filter((f) => f.id !== id);
}

// ── Transport ────────────────────────────────────────────────────────────────

export async function upsertTransport(
  slug: string,
  item: Omit<TransportItem, "id">,
  id?: string,
): Promise<void> {
  const record = db.trips.get(slug);
  if (!record) return;

  if (id) {
    const index = record.transport.findIndex((t) => t.id === id);
    if (index >= 0) record.transport[index] = { ...item, id };
    return;
  }
  record.transport.push({ ...item, id: newId("tr") });
}

export async function deleteTransport(slug: string, id: string): Promise<void> {
  const record = db.trips.get(slug);
  if (record) record.transport = record.transport.filter((t) => t.id !== id);
}

// ── Itinerary events ─────────────────────────────────────────────────────────

export async function upsertEvent(
  slug: string,
  event: Omit<ItineraryEvent, "id">,
  id?: string,
): Promise<void> {
  const record = db.trips.get(slug);
  if (!record) return;

  if (id) {
    const index = record.events.findIndex((e) => e.id === id);
    if (index >= 0) record.events[index] = { ...event, id };
    return;
  }
  record.events.push({ ...event, id: newId("e") });
}

export async function deleteEvent(slug: string, id: string): Promise<void> {
  const record = db.trips.get(slug);
  if (record) record.events = record.events.filter((e) => e.id !== id);
}

export async function setDayLabel(
  slug: string,
  date: string,
  label: string,
): Promise<void> {
  const record = db.trips.get(slug);
  if (!record) return;

  if (label.trim()) record.dayLabels[date] = label.trim();
  else delete record.dayLabels[date];
}

// ── Expenses ─────────────────────────────────────────────────────────────────

export async function upsertExpense(
  slug: string,
  expense: Omit<Expense, "id">,
  id?: string,
): Promise<void> {
  const record = db.trips.get(slug);
  if (!record) return;

  if (id) {
    const index = record.budget.expenses.findIndex((x) => x.id === id);
    if (index >= 0) record.budget.expenses[index] = { ...expense, id };
    return;
  }
  record.budget.expenses.push({ ...expense, id: newId("x") });
}

export async function deleteExpense(slug: string, id: string): Promise<void> {
  const record = db.trips.get(slug);
  if (record) {
    record.budget.expenses = record.budget.expenses.filter((x) => x.id !== id);
  }
}

// ── Packing ──────────────────────────────────────────────────────────────────

export async function addPackingItem(
  slug: string,
  item: { category: string; label: string; assignedToMemberId?: string },
): Promise<void> {
  const record = db.trips.get(slug);
  if (!record) return;
  record.packing.push({ ...item, id: newId("pk") });
}

export async function deletePackingItem(
  slug: string,
  id: string,
): Promise<void> {
  const record = db.trips.get(slug);
  if (!record) return;
  record.packing = record.packing.filter((item) => item.id !== id);
  db.packingChecks.delete(id);
}

/** Per-user tick. Returns the new state so the caller can report it. */
export async function togglePackingCheck(
  itemId: string,
  userId: string,
): Promise<boolean> {
  const checks = db.packingChecks.get(itemId) ?? new Set<string>();
  db.packingChecks.set(itemId, checks);

  if (checks.has(userId)) {
    checks.delete(userId);
    return false;
  }
  checks.add(userId);
  return true;
}

// ── Poll ─────────────────────────────────────────────────────────────────────

export async function upsertPoll(
  slug: string,
  input: { question: string; closesAt: string; optionLabels: string[] },
): Promise<void> {
  const record = db.trips.get(slug);
  if (!record) return;

  const pollId = record.poll?.id ?? newId("p");
  const existing = record.poll?.options ?? [];

  // Reuse ids for options whose label is unchanged, so edits elsewhere in the
  // poll don't silently discard votes already cast for them.
  const options: PollOptionRecord[] = input.optionLabels.map((label) => {
    const match = existing.find((option) => option.label === label);
    return match ?? { id: newId("po"), label };
  });

  const keptIds = new Set(options.map((option) => option.id));
  const votes = db.pollVotes.get(pollId);
  if (votes) {
    for (const [userId, optionId] of votes) {
      if (!keptIds.has(optionId)) votes.delete(userId);
    }
  }

  record.poll = { id: pollId, question: input.question, closesAt: input.closesAt, options };
}

export async function deletePoll(slug: string): Promise<void> {
  const record = db.trips.get(slug);
  if (!record?.poll) return;
  db.pollVotes.delete(record.poll.id);
  record.poll = null;
}

/** One vote per member; voting for the current choice clears it. */
export async function castVote(
  pollId: string,
  userId: string,
  optionId: string,
): Promise<void> {
  const votes = db.pollVotes.get(pollId) ?? new Map<string, string>();
  db.pollVotes.set(pollId, votes);

  if (votes.get(userId) === optionId) votes.delete(userId);
  else votes.set(userId, optionId);
}

// ── Alerts ───────────────────────────────────────────────────────────────────

export async function addAlert(
  slug: string,
  alert: Omit<TripAlert, "id">,
): Promise<void> {
  const record = db.trips.get(slug);
  if (record) record.alerts.push({ ...alert, id: newId("a") });
}

export async function dismissAlert(
  alertId: string,
  userId: string,
): Promise<void> {
  const dismissals = db.alertDismissals.get(alertId) ?? new Set<string>();
  db.alertDismissals.set(alertId, dismissals);
  dismissals.add(userId);
}

// ── Activity ─────────────────────────────────────────────────────────────────

/**
 * Append to the activity feed. Every mutation that the group would want to know
 * about calls this, which is why the feed on the trip page is live rather than
 * a fixed list.
 */
export async function recordActivity(
  slug: string,
  entry: Omit<TripNotification, "id" | "createdAt">,
): Promise<void> {
  const record = db.trips.get(slug);
  if (!record) return;

  record.notifications.unshift({
    ...entry,
    id: newId("n"),
    createdAt: new Date().toISOString(),
  });
  record.notifications = record.notifications.slice(0, 30);
}
