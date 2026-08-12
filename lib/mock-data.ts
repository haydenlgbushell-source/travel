import type {
  TripDetail,
  TripSummary,
  ItineraryEvent,
  TripDay,
} from "./types";

/**
 * Demo seed data.
 *
 * This file is the seam between the UI and the data layer: every component
 * reads from the types in `./types`, and this module is the only thing that
 * fabricates them. Replacing it with Supabase queries that return the same
 * shapes is the entire step-4 data migration.
 */

const MEMBERS = [
  { id: "m-hayden", name: "Hayden", initials: "HB", role: "organiser" as const },
  { id: "m-priya", name: "Priya", initials: "PR", role: "member" as const },
  { id: "m-tom", name: "Tom", initials: "TM", role: "member" as const },
  { id: "m-alex", name: "Alex", initials: "AL", role: "member" as const },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDay(date: string, label: string, events: ItineraryEvent[]): TripDay {
  // Parsed as UTC so the weekday never shifts with the viewer's timezone.
  const d = new Date(`${date}T00:00:00Z`);
  return {
    date,
    weekdayShort: WEEKDAYS[d.getUTCDay()],
    dayOfMonth: String(d.getUTCDate()),
    label,
    events,
  };
}

function ev(
  id: string,
  dayDate: string,
  time: string,
  title: string,
  tag: ItineraryEvent["tag"],
  opts: Partial<Pick<ItineraryEvent, "subtitle" | "isHighlight" | "location">> = {},
): ItineraryEvent {
  return {
    id,
    dayDate,
    time,
    title,
    tag,
    isHighlight: opts.isHighlight ?? false,
    subtitle: opts.subtitle,
    location: opts.location,
  };
}

const DAYS: TripDay[] = [
  toDay("2026-09-10", "Arrival", [
    ev("e-1", "2026-09-10", "06:20", "Land at Ngurah Rai (DPS)", "travel", {
      subtitle: "Immigration, then bags at carousel 4",
      location: "Denpasar",
    }),
    ev("e-2", "2026-09-10", "08:00", "Private transfer to Uluwatu", "travel", {
      subtitle: "Pre-booked — driver meets at arrivals",
      location: "≈ 45 min",
    }),
    ev("e-3", "2026-09-10", "11:00", "Villa check-in", "booking", {
      subtitle: "Early check-in confirmed with host",
      isHighlight: true,
      location: "Villa Kanina",
    }),
    ev("e-4", "2026-09-10", "13:30", "Lunch at Single Fin", "food", {
      subtitle: "Cliffside — go before the sunset crowd",
    }),
    ev("e-5", "2026-09-10", "18:00", "Kecak fire dance, Uluwatu Temple", "activity", {
      subtitle: "Tickets held — arrive 17:30 for seats",
      isHighlight: true,
    }),
  ]),
  toDay("2026-09-11", "Beach day", [
    ev("e-6", "2026-09-11", "07:30", "Surf lesson at Padang Padang", "activity", {
      subtitle: "Boards + instructor booked for 4",
      isHighlight: true,
    }),
    ev("e-7", "2026-09-11", "12:00", "Warung lunch", "food", {
      subtitle: "Nasi campur at Warung Local",
    }),
    ev("e-8", "2026-09-11", "15:00", "Free afternoon", "free", {
      subtitle: "Pool / nap / nothing at all",
    }),
    ev("e-9", "2026-09-11", "19:30", "Dinner — Bukit Cafe", "food"),
  ]),
  toDay("2026-09-12", "Islands", [
    ev("e-10", "2026-09-12", "07:00", "Fast boat to Nusa Penida", "travel", {
      subtitle: "Sanur harbour — passports not needed, ID only",
      isHighlight: true,
    }),
    ev("e-11", "2026-09-12", "10:00", "Kelingking Beach viewpoint", "activity"),
    ev("e-12", "2026-09-12", "12:30", "Snorkel at Crystal Bay", "activity", {
      subtitle: "Gear included in day-tour price",
    }),
    ev("e-13", "2026-09-12", "17:00", "Return boat to Sanur", "travel"),
  ]),
  toDay("2026-09-13", "Transfer north", [
    ev("e-14", "2026-09-13", "10:00", "Check out, drive to Ubud", "travel", {
      subtitle: "Stop at Tegenungan waterfall en route",
    }),
    ev("e-15", "2026-09-13", "14:00", "Ubud check-in", "booking", {
      isHighlight: true,
      location: "Adiwana Bisma",
    }),
    ev("e-16", "2026-09-13", "17:00", "Walk the Campuhan Ridge", "activity", {
      subtitle: "Golden hour, ~1hr loop",
    }),
    ev("e-17", "2026-09-13", "20:00", "Dinner — Locavore NXT", "food", {
      subtitle: "Reservation under Hayden, table for 4",
      isHighlight: true,
    }),
  ]),
  toDay("2026-09-14", "Rice fields", [
    ev("e-18", "2026-09-14", "05:00", "Mt Batur sunrise trek", "activity", {
      subtitle: "Pickup 02:00 — optional, 3 of 4 in",
      isHighlight: true,
    }),
    ev("e-19", "2026-09-14", "12:00", "Recovery brunch", "food"),
    ev("e-20", "2026-09-14", "15:00", "Tegallalang rice terraces", "activity"),
    ev("e-21", "2026-09-14", "19:00", "Night market, Gianyar", "food"),
  ]),
  toDay("2026-09-15", "Slow day", [
    ev("e-22", "2026-09-15", "09:00", "Yoga at The Yoga Barn", "activity", {
      subtitle: "Drop-in, pay at door",
    }),
    ev("e-23", "2026-09-15", "13:00", "Sacred Monkey Forest", "activity", {
      subtitle: "Hold your sunglasses",
    }),
    ev("e-24", "2026-09-15", "16:00", "Spa — 90 min balinese massage", "rest", {
      subtitle: "Booked for 4",
      isHighlight: true,
    }),
  ]),
  toDay("2026-09-16", "Water & temples", [
    ev("e-25", "2026-09-16", "08:00", "Tirta Empul water temple", "activity", {
      subtitle: "Sarongs provided — bring a change of clothes",
      isHighlight: true,
    }),
    ev("e-26", "2026-09-16", "12:00", "Lunch overlooking the valley", "food"),
    ev("e-27", "2026-09-16", "16:00", "Souvenir run, Ubud market", "free"),
    ev("e-28", "2026-09-16", "20:00", "Last-night dinner", "food", {
      subtitle: "Vote open — see the poll",
    }),
  ]),
  toDay("2026-09-17", "Departure", [
    ev("e-29", "2026-09-17", "09:00", "Check out, store bags", "booking"),
    ev("e-30", "2026-09-17", "11:00", "Transfer to DPS", "travel", {
      subtitle: "≈ 90 min with traffic — leave buffer",
    }),
    ev("e-31", "2026-09-17", "15:45", "Flight home, GA714", "travel", {
      isHighlight: true,
    }),
  ]),
];

export const BALI_TRIP: TripDetail = {
  trip: {
    id: "t-bali",
    slug: "bali-2026",
    name: "Bali 2026",
    destination: "Bali, Indonesia",
    coverRoute: "SYD → DPS",
    startDate: "2026-09-10",
    endDate: "2026-09-17",
    organiserId: "m-hayden",
    status: "confirmed",
    members: MEMBERS,
  },

  alerts: [
    {
      id: "a-1",
      tone: "urgent",
      title: "Tom hasn't paid the villa deposit",
      body: "$420 due before 25 Aug or the host releases the booking.",
      dismissible: true,
    },
  ],

  notifications: [
    {
      id: "n-1",
      kind: "booking",
      title: "Locavore NXT confirmed",
      body: "Table for 4 on 13 Sep, 20:00.",
      createdAt: "2026-08-11T09:20:00Z",
      actorInitials: "HB",
    },
    {
      id: "n-2",
      kind: "payment",
      title: "Priya paid for the fast boat",
      body: "$168 across 4 people — settle in the budget tab.",
      createdAt: "2026-08-10T22:05:00Z",
      actorInitials: "PR",
    },
    {
      id: "n-3",
      kind: "plan",
      title: "Alex added Mt Batur sunrise trek",
      body: "Added to Mon 14 Sep. Pickup is 02:00.",
      createdAt: "2026-08-09T14:40:00Z",
      actorInitials: "AL",
    },
    {
      id: "n-4",
      kind: "member",
      title: "Alex joined the trip",
      body: "Invited by Hayden.",
      createdAt: "2026-08-04T08:00:00Z",
      actorInitials: "AL",
    },
  ],

  accommodation: {
    id: "acc-1",
    name: "Villa Kanina, Uluwatu",
    address: "Jl. Pantai Bingin, Pecatu, Bali 80361",
    checkIn: "2026-09-10",
    checkOut: "2026-09-13",
    reference: "VK-8841-QR",
    bookingUrl: "https://example.com/booking/VK-8841-QR",
    nights: 3,
    guests: 4,
    notes: "Private pool, staffed breakfast. Second half of the trip is Ubud.",
  },

  flights: [
    {
      id: "f-out",
      direction: "outbound",
      airline: "Garuda Indonesia",
      flightNumber: "GA715",
      originCode: "SYD",
      originCity: "Sydney",
      destinationCode: "DPS",
      destinationCity: "Denpasar",
      departsAt: "2026-09-09T23:55:00+10:00",
      arrivesAt: "2026-09-10T06:20:00+08:00",
      durationLabel: "8h 25m",
      status: "confirmed",
      gate: "54",
      seatLabel: "31A–31D",
      reference: "QP4T2M",
    },
    {
      id: "f-ret",
      direction: "return",
      airline: "Garuda Indonesia",
      flightNumber: "GA714",
      originCode: "DPS",
      originCity: "Denpasar",
      destinationCode: "SYD",
      destinationCity: "Sydney",
      departsAt: "2026-09-17T15:45:00+08:00",
      arrivesAt: "2026-09-18T01:10:00+10:00",
      durationLabel: "7h 25m",
      status: "confirmed",
      seatLabel: "22A–22D",
      reference: "QP4T2M",
    },
  ],

  transport: [
    {
      id: "tr-1",
      kind: "transfer",
      label: "Airport → Uluwatu",
      detail: "Private van, 4 pax + bags. Driver meets at arrivals.",
      status: "booked",
      cost: "$38",
    },
    {
      id: "tr-2",
      kind: "driver",
      label: "Uluwatu → Ubud (day 4)",
      detail: "Full-day driver with waterfall stop.",
      status: "booked",
      cost: "$65",
    },
    {
      id: "tr-3",
      kind: "ferry",
      label: "Sanur → Nusa Penida return",
      detail: "Fast boat, 07:00 out / 17:00 back.",
      status: "booked",
      cost: "$42 pp",
    },
    {
      id: "tr-4",
      kind: "scooter",
      label: "Scooter hire in Ubud",
      detail: "2 scooters, 3 days. Needs an international licence.",
      status: "pending",
      cost: "$9 /day",
    },
  ],

  days: DAYS,

  budget: {
    currency: "AUD",
    perPersonTargetCents: 250000,
    expenses: [
      {
        id: "x-1",
        category: "flights",
        label: "Return flights SYD–DPS",
        amountCents: 356000,
        paidByMemberId: "m-hayden",
        splitAcrossMemberIds: MEMBERS.map((m) => m.id),
      },
      {
        id: "x-2",
        category: "stay",
        label: "Villa Kanina, 3 nights",
        amountCents: 168000,
        paidByMemberId: "m-hayden",
        splitAcrossMemberIds: MEMBERS.map((m) => m.id),
      },
      {
        id: "x-3",
        category: "stay",
        label: "Adiwana Bisma, 4 nights",
        amountCents: 192000,
        paidByMemberId: "m-priya",
        splitAcrossMemberIds: MEMBERS.map((m) => m.id),
      },
      {
        id: "x-4",
        category: "transport",
        label: "Fast boat, Nusa Penida",
        amountCents: 16800,
        paidByMemberId: "m-priya",
        splitAcrossMemberIds: MEMBERS.map((m) => m.id),
      },
      {
        id: "x-5",
        category: "activities",
        label: "Surf lessons ×4",
        amountCents: 22000,
        paidByMemberId: "m-tom",
        splitAcrossMemberIds: MEMBERS.map((m) => m.id),
      },
      {
        id: "x-6",
        category: "activities",
        label: "Mt Batur trek ×3",
        amountCents: 19500,
        paidByMemberId: "m-alex",
        splitAcrossMemberIds: ["m-hayden", "m-tom", "m-alex"],
      },
      {
        id: "x-7",
        category: "food",
        label: "Locavore NXT deposit",
        amountCents: 24000,
        paidByMemberId: "m-hayden",
        splitAcrossMemberIds: MEMBERS.map((m) => m.id),
      },
      {
        id: "x-8",
        category: "transport",
        label: "Drivers + transfers",
        amountCents: 10300,
        paidByMemberId: "m-tom",
        splitAcrossMemberIds: MEMBERS.map((m) => m.id),
      },
    ],
  },

  poll: {
    id: "p-1",
    question: "Where are we doing the last-night dinner?",
    closesAt: "2026-09-14T12:00:00Z",
    totalVoters: 4,
    // Seed only — the store replaces this with the real viewer's vote.
    myVote: null,
    options: [
      {
        id: "po-1",
        label: "Bridges Bali",
        detail: "River-valley terrace, tasting menu",
        voteCount: 2,
      },
      {
        id: "po-2",
        label: "Mozaic",
        detail: "Fine dining, need to book now",
        voteCount: 1,
      },
      {
        id: "po-3",
        label: "Night market crawl",
        detail: "Cheap, chaotic, memorable",
        voteCount: 0,
      },
    ],
  },

  packing: [
    { id: "pk-1", category: "Essentials", label: "Reef-safe sunscreen", isDone: true },
    { id: "pk-2", category: "Essentials", label: "Insect repellent", isDone: true },
    { id: "pk-3", category: "Essentials", label: "Power adapter (type C/F)", isDone: false },
    { id: "pk-4", category: "Essentials", label: "Rehydration sachets", isDone: false },
    { id: "pk-5", category: "Clothing", label: "Sarong (temple entry)", isDone: false },
    { id: "pk-6", category: "Clothing", label: "Rash vest", isDone: true },
    { id: "pk-7", category: "Clothing", label: "Warm layer for Batur summit", isDone: false },
    { id: "pk-8", category: "Group kit", label: "First-aid kit", isDone: true, assignedToMemberId: "m-priya" },
    { id: "pk-9", category: "Group kit", label: "Dry bag", isDone: false, assignedToMemberId: "m-tom" },
    { id: "pk-10", category: "Group kit", label: "Portable speaker", isDone: false, assignedToMemberId: "m-alex" },
  ],

  wallet: [
    {
      id: "w-1",
      title: "Kecak Fire Dance",
      detail: "Uluwatu Temple — general admission ×4",
      reference: "KEC-2026-0910-4",
      validOn: "10 Sep, 18:00",
      holderInitials: ["HB", "PR", "TM", "AL"],
    },
    {
      id: "w-2",
      title: "Nusa Penida day tour",
      detail: "Fast boat + island transport ×4",
      reference: "NP-FB-77213",
      validOn: "12 Sep, 07:00",
      holderInitials: ["HB", "PR", "TM", "AL"],
    },
    {
      id: "w-3",
      title: "Mt Batur sunrise trek",
      detail: "Guided, includes breakfast ×3",
      reference: "BAT-SR-4419",
      validOn: "14 Sep, 02:00",
      holderInitials: ["HB", "TM", "AL"],
    },
  ],

  entryRequirements: [
    {
      id: "er-1",
      label: "Passport validity",
      detail: "Must be valid at least 6 months beyond arrival, with a blank page.",
      status: "required",
    },
    {
      id: "er-2",
      label: "Visa on arrival (e-VOA)",
      detail: "IDR 500,000 for 30 days. Apply online before you fly to skip the queue.",
      status: "required",
    },
    {
      id: "er-3",
      label: "Bali tourist levy",
      detail: "IDR 150,000 per person, paid once via the Love Bali portal.",
      status: "required",
    },
    {
      id: "er-4",
      label: "Customs declaration",
      detail: "Electronic form, submit within 3 days of arrival. QR shown at customs.",
      status: "required",
    },
    {
      id: "er-5",
      label: "Travel insurance",
      detail: "Not checked at the border, but scooter injuries are the #1 claim here.",
      status: "recommended",
    },
    {
      id: "er-6",
      label: "Onward ticket",
      detail: "Rarely asked for on a VOA, but airlines can request it at check-in.",
      status: "recommended",
    },
  ],

  emergencyContacts: [
    {
      id: "ec-1",
      label: "Emergency services (Indonesia)",
      value: "112",
      detail: "Police, fire, ambulance",
      href: "tel:112",
    },
    {
      id: "ec-2",
      label: "BIMC Hospital, Nusa Dua",
      value: "+62 361 3000 911",
      detail: "24h, English-speaking, handles insurance directly",
      href: "tel:+623613000911",
    },
    {
      id: "ec-3",
      label: "Australian Consulate-General, Bali",
      value: "+62 361 2000 100",
      detail: "Jl. Tantular 32, Renon, Denpasar",
      href: "tel:+623612000100",
    },
    {
      id: "ec-4",
      label: "Tourist police",
      value: "+62 361 224 111",
      href: "tel:+62361224111",
    },
  ],

  weather: [
    { label: "Thu", high: 30, low: 24, condition: "sun", rainChance: 10 },
    { label: "Fri", high: 30, low: 24, condition: "sun", rainChance: 5 },
    { label: "Sat", high: 29, low: 24, condition: "cloud", rainChance: 25 },
    { label: "Sun", high: 29, low: 23, condition: "rain", rainChance: 60 },
    { label: "Mon", high: 30, low: 23, condition: "sun", rainChance: 15 },
  ],

  mapLabel: "Uluwatu · Nusa Penida · Ubud",
};

/** Second demo trip, so the index reads as a platform rather than one itinerary. */
const LISBON_TRIP_SUMMARY: TripSummary = {
  id: "t-lisbon",
  slug: "lisbon-birthday",
  name: "Lisbon birthday weekend",
  destination: "Lisbon, Portugal",
  coverRoute: "LHR → LIS",
  startDate: "2027-03-19",
  endDate: "2027-03-23",
  status: "planning",
  memberInitials: ["HB", "PR", "JS", "MK", "DN"],
  daysUntil: null,
};

const QUEENSTOWN_TRIP_SUMMARY: TripSummary = {
  id: "t-queenstown",
  slug: "queenstown-ski",
  name: "Queenstown ski week",
  destination: "Queenstown, New Zealand",
  coverRoute: "MEL → ZQN",
  startDate: "2026-07-04",
  endDate: "2026-07-11",
  status: "complete",
  memberInitials: ["HB", "TM", "AL"],
  daysUntil: null,
};

function daysBetween(from: Date, to: Date): number {
  const MS_PER_DAY = 86_400_000;
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / MS_PER_DAY);
}

export function getTripSummaries(now: Date = new Date()): TripSummary[] {
  const bali: TripSummary = {
    id: BALI_TRIP.trip.id,
    slug: BALI_TRIP.trip.slug,
    name: BALI_TRIP.trip.name,
    destination: BALI_TRIP.trip.destination,
    coverRoute: BALI_TRIP.trip.coverRoute,
    startDate: BALI_TRIP.trip.startDate,
    endDate: BALI_TRIP.trip.endDate,
    status: BALI_TRIP.trip.status,
    memberInitials: BALI_TRIP.trip.members.map((m) => m.initials),
    daysUntil: daysBetween(now, new Date(`${BALI_TRIP.trip.startDate}T00:00:00Z`)),
  };

  const lisbon: TripSummary = {
    ...LISBON_TRIP_SUMMARY,
    daysUntil: daysBetween(now, new Date(`${LISBON_TRIP_SUMMARY.startDate}T00:00:00Z`)),
  };

  return [bali, lisbon, QUEENSTOWN_TRIP_SUMMARY];
}

export function getTrip(slug: string): TripDetail | null {
  return slug === BALI_TRIP.trip.slug ? BALI_TRIP : null;
}

export function getAllTripSlugs(): string[] {
  return [BALI_TRIP.trip.slug];
}
