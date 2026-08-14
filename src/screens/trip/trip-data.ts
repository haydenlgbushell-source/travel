/** Trip content for the Lisbon trip. Static for now — the screen reads it the
 *  way it will eventually read the API, so swapping the source is a one-file job. */

/** Item status colours. These are semantic (route / confirmed / needs attention)
 *  rather than brand, so they stay fixed across styles. */
export const ACCENT = "oklch(0.52 0.13 285)";
export const AMBER = "oklch(0.58 0.13 60)";
export const GREEN = "oklch(0.52 0.11 155)";

export type Role = "Organiser" | "Editor" | "Contributor";

export interface Person {
  initials: string;
  name: string;
  role: Role;
  note: string;
}

export interface BookingFact {
  label: string;
  value: string;
}

export type ItemKind = "Eat" | "Stay" | "Do" | "Travel";

export const ITEM_KINDS: ItemKind[] = ["Eat", "Stay", "Do", "Travel"];

/** What the kinds are called when a saved trip is read back as somebody
 *  else's recommendations. */
export const KIND_HEADINGS: Record<ItemKind, string> = {
  Eat: "Places to eat",
  Stay: "Where we stayed",
  Do: "Things we did",
  Travel: "Getting around",
};

export interface TripItem {
  /** Stable across inserts and reordering — approvals are keyed off it. */
  id: string;
  kind: ItemKind;
  time: string;
  title: string;
  note: string;
  place: string;
  meta: string;
  /** Per person, in euros. Drives the day total and the money bars. */
  costEach?: number;
  who: string;
  accent: string;
  /** Set when the item is only going ahead for part of the group. */
  split?: boolean;
  transit?: string;
  transitWarn?: boolean;
  /** Caption for the photo block. */
  photo?: string;
  /** Link to an actual picture of the place; absent falls back to the fill. */
  photoUrl?: string;
  rating?: string;
  reviews?: string;
  price?: string;
  open?: string;
  openWarn?: boolean;
  mapsUrl?: string;
  bookingKind?: string;
  booking?: BookingFact[];
  suggested?: boolean;
  suggestedBy?: string;
}

export interface Day {
  dow: string;
  num: string;
  label: string;
  fullDate: string;
  weather: string;
  mapArea: string;
  walk: string;
  /** Authored clash for the day. */
  conflict?: string;
  /** Clashes the group created themselves, added as items land. */
  flags?: string[];
  items: TripItem[];
}

export const PEOPLE: Person[] = [
  { initials: "AN", name: "Ana Ferreira", role: "Organiser", note: "Holds the villa and both flights" },
  { initials: "TM", name: "Tom Reid", role: "Editor", note: "Added the Sintra legs" },
  { initials: "JR", name: "Jo Rahman", role: "Editor", note: "Handles the tickets" },
  { initials: "SB", name: "Sam Boyd", role: "Contributor", note: "Joined Tuesday" },
  { initials: "KE", name: "Kit Ellis", role: "Contributor", note: "Two suggestions waiting" },
];

export const TRIP = {
  name: "Lisbon",
  dates: "4 – 8 June 2026",
  members: PEOPLE,
};

/** Authored without ids; `DAYS` stamps them on once at module load. */
type AuthoredDay = Omit<Day, "items"> & { items: Array<Omit<TripItem, "id">> };

const AUTHORED_DAYS: AuthoredDay[] = [
  {
    dow: "Thu",
    num: "04",
    label: "Landing and Alfama",
    fullDate: "Thursday 4 June",
    weather: "24° · clear",
    mapArea: "Alfama",
    walk: "2.1 km",
    items: [
      {
        time: "14:20",
        title: "Land at Humberto Delgado",
        kind: "Travel",
        note: "Passport control is the slow part — allow 40 minutes before anyone books a transfer.",
        place: "LIS · Terminal 1",
        meta: "TP1235 · on time",
        costEach: 1.8,
        who: "All five",
        accent: ACCENT,
        transit: "Metro red then green · 35 min · €1.80",
      },
      {
        time: "16:00",
        title: "Check in at Casa Bela",
        kind: "Stay",
        note: "Roof key is at the desk. Two rooms are on the third floor with no lift.",
        place: "Rua dos Remédios 48",
        meta: "Held under Ana",
        who: "All five",
        accent: GREEN,
        photo: "Villa exterior · Alfama",
        rating: "4.8",
        reviews: "612",
        price: "€€",
        open: "Desk 08:00–22:00",
        mapsUrl: "https://maps.google.com/?q=Rua+dos+Remedios+48+Lisboa",
        bookingKind: "Confirmed",
        booking: [
          { label: "In", value: "16:00" },
          { label: "Ref", value: "CB-4471" },
        ],
        transit: "Walk · 3 min",
      },
      {
        time: "19:30",
        title: "Taberna Sal Grosso",
        kind: "Eat",
        note: "Small room, no bar to wait at. They hold the table fifteen minutes, no longer.",
        place: "Calçada do Forte 22",
        meta: "≈ €32 each",
        costEach: 32,
        who: "All five",
        accent: GREEN,
        photo: "Restaurant interior",
        rating: "4.6",
        reviews: "2,184",
        price: "€€",
        open: "Until 23:00",
        mapsUrl: "https://maps.google.com/?q=Taberna+Sal+Grosso+Lisboa",
        bookingKind: "Table booked",
        booking: [
          { label: "Under", value: "Ana" },
          { label: "Party", value: "5" },
        ],
        transit: "Walk uphill · 10 min",
      },
      {
        time: "22:00",
        title: "Miradouro das Portas do Sol",
        kind: "Do",
        note: "Nothing planned after — first night, keep it loose.",
        place: "Largo Portas do Sol",
        meta: "Free",
        who: "3 of 5 going",
        split: true,
        accent: AMBER,
        rating: "4.7",
        reviews: "18,940",
        price: "Free",
        open: "Always open",
        mapsUrl: "https://maps.google.com/?q=Miradouro+das+Portas+do+Sol",
      },
    ],
  },
  {
    dow: "Fri",
    num: "05",
    label: "Belém and the river",
    fullDate: "Friday 5 June",
    weather: "26° · light wind",
    mapArea: "Belém",
    walk: "3.4 km",
    conflict:
      "Lunch at 12:30 is a 25-minute tram ride from the 18:00 ferry. The ferry vote closes tonight and the crossing only runs to 23:30.",
    items: [
      {
        time: "09:15",
        title: "Tram 15E from Cais do Sodré",
        kind: "Travel",
        note: "Buy the 24-hour Carris pass at the kiosk. Paying the driver costs three times as much.",
        place: "Cais do Sodré",
        meta: "€6.80 each",
        costEach: 6.8,
        who: "All five",
        accent: ACCENT,
        transit: "Tram · 22 min to Belém",
      },
      {
        time: "10:00",
        title: "Mosteiro dos Jerónimos",
        kind: "Do",
        note: "Entry is timed at 10:00 and ours is paid. The long queue at the door is for walk-ups.",
        place: "Praça do Império",
        meta: "Paid · €12 each",
        costEach: 12,
        who: "All five",
        accent: GREEN,
        photo: "Monastery cloister",
        rating: "4.7",
        reviews: "94,210",
        price: "€12",
        open: "09:30–18:00",
        mapsUrl: "https://maps.google.com/?q=Mosteiro+dos+Jeronimos",
        bookingKind: "Tickets held",
        booking: [
          { label: "Slot", value: "10:00" },
          { label: "Ref", value: "JR-88210" },
        ],
        transit: "Walk · 6 min",
      },
      {
        time: "12:30",
        title: "Pastéis de Belém",
        kind: "Eat",
        note: "No reservations. The room at the back moves faster than the takeaway queue.",
        place: "Rua de Belém 84",
        meta: "≈ €8 each",
        costEach: 8,
        who: "All five",
        accent: AMBER,
        photo: "Pastéis counter",
        rating: "4.5",
        reviews: "61,430",
        price: "€",
        open: "Busiest 12–14",
        openWarn: true,
        mapsUrl: "https://maps.google.com/?q=Pasteis+de+Belem",
        bookingKind: "Walk in",
        booking: [{ label: "Wait", value: "~15 min" }],
        transit: "Tram back · 25 min · tight against the ferry",
        transitWarn: true,
      },
      {
        time: "18:00",
        title: "Sunset ferry to Cacilhas",
        kind: "Do",
        note: "Whether we eat over the river or come back is still a vote. Ferries every 20 minutes until 23:30.",
        place: "Cais do Sodré terminal",
        meta: "€1.55 each",
        costEach: 1.55,
        who: "Waiting on 3",
        accent: AMBER,
        photo: "River crossing at dusk",
        rating: "4.4",
        reviews: "3,102",
        price: "€1.55",
        open: "Every 20 min",
        mapsUrl: "https://maps.google.com/?q=Cais+do+Sodre+ferry+terminal",
      },
      {
        time: "21:00",
        title: "Ponto Final, Cacilhas",
        kind: "Eat",
        note: "Tables sit on the water on the far side. Only works if the ferry vote lands on staying over.",
        place: "Rua do Ginjal 72",
        meta: "≈ €30 each",
        costEach: 30,
        who: "Suggested",
        accent: AMBER,
        suggested: true,
        suggestedBy: "Kit",
        rating: "4.5",
        reviews: "5,640",
        price: "€€",
        open: "Closed Mondays",
        mapsUrl: "https://maps.google.com/?q=Ponto+Final+Cacilhas",
      },
    ],
  },
  {
    dow: "Sat",
    num: "06",
    label: "Sintra, all day",
    fullDate: "Saturday 6 June",
    weather: "21° · cloud",
    mapArea: "Sintra",
    walk: "5.8 km",
    conflict:
      "Regaleira closes at 20:00 and the last comfortable train is 20:11. A 15:00 start leaves no room if Pena runs over.",
    items: [
      {
        time: "08:05",
        title: "Train from Rossio",
        kind: "Travel",
        note: "Forty minutes. Later trains fill up and the 434 bus queue doubles by ten.",
        place: "Rossio station",
        meta: "€4.60 return",
        costEach: 4.6,
        who: "All five",
        accent: ACCENT,
        transit: "Bus 434 · 15 min",
      },
      {
        time: "10:00",
        title: "Pena Palace",
        kind: "Do",
        note: "Timed at 10:00. If the queue looks long, do the park first and the rooms after noon.",
        place: "Estrada da Pena",
        meta: "Paid · €20 each",
        costEach: 20,
        who: "All five",
        accent: GREEN,
        photo: "Pena Palace terrace",
        rating: "4.6",
        reviews: "112,880",
        price: "€20",
        open: "09:30–18:30",
        mapsUrl: "https://maps.google.com/?q=Pena+Palace+Sintra",
        bookingKind: "Tickets held",
        booking: [
          { label: "Slot", value: "10:00" },
          { label: "Ref", value: "PP-30514" },
        ],
        transit: "Bus 434 down · 12 min",
      },
      {
        time: "15:00",
        title: "Quinta da Regaleira",
        kind: "Do",
        note: "Nothing booked after this. The last comfortable train back is 20:11.",
        place: "R. Barbosa du Bocage",
        meta: "≈ €14 each",
        costEach: 14,
        who: "4 of 5 going",
        split: true,
        accent: AMBER,
        photo: "Initiation well",
        rating: "4.7",
        reviews: "44,160",
        price: "€14",
        open: "Closes 20:00",
        openWarn: true,
        mapsUrl: "https://maps.google.com/?q=Quinta+da+Regaleira",
      },
    ],
  },
  {
    dow: "Sun",
    num: "07",
    label: "Market and the last night",
    fullDate: "Sunday 7 June",
    weather: "25° · clear",
    mapArea: "Graça",
    walk: "1.6 km",
    conflict:
      "Feira da Ladra runs Tuesdays and Saturdays only. On a Sunday the square is empty — move it or drop it.",
    items: [
      {
        time: "10:30",
        title: "Feira da Ladra",
        kind: "Do",
        note: "Cash for most stalls, and it thins out badly after two.",
        place: "Campo de Santa Clara",
        meta: "Free",
        who: "Optional",
        accent: AMBER,
        photo: "Market stalls",
        rating: "4.3",
        reviews: "9,870",
        price: "Free",
        open: "Tue and Sat only",
        openWarn: true,
        mapsUrl: "https://maps.google.com/?q=Feira+da+Ladra+Lisboa",
      },
      {
        time: "20:00",
        title: "Last dinner — undecided",
        kind: "Eat",
        note: "Three restaurants in the vote: Ramiro, Cervejaria Liberdade, A Cevicheria.",
        place: "Not set",
        meta: "Waiting on 3",
        who: "All five",
        accent: AMBER,
        bookingKind: "No table yet",
        booking: [
          { label: "Votes", value: "2 of 5" },
          { label: "Closes", value: "Fri 20:00" },
        ],
      },
    ],
  },
  {
    dow: "Mon",
    num: "08",
    label: "Home",
    fullDate: "Monday 8 June",
    weather: "23° · clear",
    mapArea: "Alfama to LIS",
    walk: "No walking",
    items: [
      {
        time: "08:30",
        title: "Checkout and airport transfer",
        kind: "Travel",
        note: "Two taxis booked for 08:30. Bags can stay at the desk if anyone wants a last coffee.",
        place: "Casa Bela",
        meta: "€28 total",
        costEach: 5.6,
        who: "All five",
        accent: GREEN,
        bookingKind: "Cars booked",
        booking: [
          { label: "Pickup", value: "08:30" },
          { label: "Ref", value: "TX-7719" },
        ],
        transit: "Taxi · 25 min",
      },
      {
        time: "11:40",
        title: "TP1234 to Gatwick",
        kind: "Travel",
        note: "Gate closes 11:10. Ana and Tom are in row 14, the rest in 22.",
        place: "LIS · Terminal 1",
        meta: "Bags ×3",
        who: "All five",
        accent: ACCENT,
        bookingKind: "Confirmed",
        booking: [
          { label: "Ref", value: "K4RB2Q" },
          { label: "Seats", value: "22B–22F" },
        ],
      },
    ],
  },
];

export const DAYS: Day[] = AUTHORED_DAYS.map((day, d) => ({
  ...day,
  items: day.items.map((item, i) => ({ ...item, id: `d${d}-i${i}` })),
}));

export const TABS = ["Plan", "Stay & travel", "Money", "Info", "People"];

/** Pin positions on the day map, as [left, top]. */
export const PIN_POS: Array<[string, string]> = [
  ["16%", "24%"],
  ["44%", "16%"],
  ["32%", "58%"],
  ["66%", "42%"],
  ["56%", "72%"],
];

export const STAY = {
  name: "Casa Bela, Alfama",
  address: "Rua dos Remédios 48, 1100-443 Lisboa",
  facts: [
    { label: "Check in", value: "Thu 16:00" },
    { label: "Check out", value: "Mon 10:00" },
    { label: "Nights", value: "4" },
    { label: "Per person", value: "€148" },
  ],
};

export interface Flight {
  airline: string;
  number: string;
  from: string;
  to: string;
  date: string;
  ref: string;
  cells: BookingFact[];
  status: string;
  statusColor: string;
  statusBg: string;
  updatedShort: string;
  liveCells: BookingFact[];
}

export const FLIGHTS: Flight[] = [
  {
    airline: "TAP Air Portugal",
    number: "TP1235",
    from: "LGW",
    to: "LIS",
    date: "Thu 4 June",
    ref: "K4RB2Q",
    cells: [
      { label: "Depart", value: "11:05" },
      { label: "Arrive", value: "14:20" },
      { label: "Seats", value: "14A–14E" },
      { label: "Bags", value: "3 checked" },
    ],
    status: "Delayed 25 min",
    statusColor: "oklch(0.5 0.13 60)",
    statusBg: "oklch(0.96 0.04 60)",
    updatedShort: "Live · 40s ago",
    liveCells: [
      { label: "Now departs", value: "11:30" },
      { label: "Gate", value: "B42" },
      { label: "Terminal", value: "North" },
      { label: "Aircraft", value: "A320neo" },
    ],
  },
  {
    airline: "TAP Air Portugal",
    number: "TP1234",
    from: "LIS",
    to: "LGW",
    date: "Mon 8 June",
    ref: "K4RB2Q",
    cells: [
      { label: "Depart", value: "11:40" },
      { label: "Arrive", value: "14:55" },
      { label: "Seats", value: "22B–22F" },
      { label: "Bags", value: "3 checked" },
    ],
    status: "On time",
    statusColor: "oklch(0.42 0.11 155)",
    statusBg: "oklch(0.96 0.03 155)",
    updatedShort: "Live · 40s ago",
    liveCells: [
      { label: "Gate", value: "Opens 10:40" },
      { label: "Terminal", value: "1" },
      { label: "Aircraft", value: "A321" },
      { label: "Check-in", value: "Desk 14" },
    ],
  },
];

/** Trip-level bookings, held in euros like everything else. */
export const BUDGET = {
  rows: [
    { label: "Flights", each: 184, total: 920 },
    { label: "Casa Bela, four nights", each: 148, total: 740 },
    { label: "Tickets and entries", each: 46, total: 230 },
    { label: "Transport and transfers", each: 19, total: 95 },
    { label: "Food, so far", each: 40, total: 200 },
  ],
  total: 2185,
  each: 437,
  owes: [
    { who: "Tom owes Ana", amount: 96 },
    { who: "Kit owes Ana", amount: 72 },
    { who: "Sam owes Jo", amount: 24 },
  ],
};

export const INFO = [
  {
    label: "Entry",
    value: "Passport, no visa",
    note: "Six months validity from the return date. Nothing to apply for in advance.",
  },
  {
    label: "Money",
    value: "Euro · cards everywhere",
    note: "The flea market and a few tascas are cash only. One ATM run on the first night covers it.",
  },
  {
    label: "Emergency",
    value: "112",
    note: "British consulate, Rua de São Bernardo 33. Ana has everyone's details written down.",
  },
  {
    label: "Getting around",
    value: "Metro and tram",
    note: "24-hour Carris pass is €6.80 and covers trams. Buy at any metro kiosk, not on board.",
  },
];

export const ROLE_RULES = [
  { role: "Organiser", detail: "Owns the trip, the money view and who else can do what." },
  {
    role: "Editor",
    detail: "Adds and changes plan items directly, approves suggestions, books things.",
  },
  { role: "Contributor", detail: "Suggests items and votes. Suggestions wait for an editor." },
];

export const DECISIONS = [
  {
    text: "Friday's sunset ferry — eat across the river or come back?",
    due: "Closes tonight 20:00",
    dueColor: "oklch(0.5 0.13 30)",
  },
  {
    text: "Sunday dinner — three restaurants on the table",
    due: "Closes Friday 20:00",
    dueColor: "oklch(0.5 0.13 60)",
  },
  { text: "Villa deposit, €84 from Tom", due: "Due 25 August", dueColor: "oklch(0.5 0.13 60)" },
];

export const DECISION_COUNT = 3;

/** Suggestions waiting on an editor, shown on the People tab. */
export const INBOX = [
  {
    title: "Ponto Final, Cacilhas",
    meta: "Kit · 2 hours ago · Fri 21:00",
    note: "Only works if the ferry vote lands on staying over the river.",
    day: 1,
  },
  {
    title: "Time Out Market, before the flight",
    meta: "Sam · yesterday · Mon 09:00",
    note: "Would need the taxis moved 30 minutes earlier.",
    day: 4,
  },
];

export const ROLE_COLORS: Record<Role, { ink: string; bg: string }> = {
  Organiser: { ink: "oklch(0.45 0.13 285)", bg: "oklch(0.96 0.03 285)" },
  Editor: { ink: "oklch(0.42 0.11 155)", bg: "oklch(0.96 0.03 155)" },
  Contributor: { ink: "oklch(0.48 0.12 60)", bg: "oklch(0.96 0.04 60)" },
};


/* ---------- times ---------- */

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function byTime(a: TripItem, b: TripItem): number {
  return toMinutes(a.time) - toMinutes(b.time);
}

const END_OF_DAY = 23 * 60 + 59;

export interface Slot {
  time: string;
  caption: string;
}

/** The day already knows where its holes are: offer the gaps big enough to
 *  put something in, rather than opening on an empty clock. Nothing is ever
 *  proposed past midnight — that would sort to the top of the wrong day. */
export function suggestSlots(items: TripItem[]): Slot[] {
  if (items.length === 0) {
    return [
      { time: "09:00", caption: "morning" },
      { time: "13:00", caption: "afternoon" },
      { time: "19:30", caption: "evening" },
    ];
  }

  const sorted = [...items].sort(byTime);
  const slots: Slot[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const start = toMinutes(sorted[i].time);
    const end = toMinutes(sorted[i + 1].time);
    if (end - start >= 150) {
      const mid = Math.round((start + end) / 2 / 5) * 5;
      slots.push({ time: toTime(mid), caption: `after ${sorted[i].title}` });
    }
  }

  const last = sorted[sorted.length - 1];
  const afterLast = toMinutes(last.time) + 90;
  if (afterLast <= END_OF_DAY) {
    slots.push({ time: toTime(afterLast), caption: `after ${last.title}` });
  }

  return slots.slice(0, 3);
}

/** A booked thing within an hour of the new time is worth mentioning — but
 *  it is the organiser's call, so this never blocks the add. */
export function clashAt(
  time: string,
  items: TripItem[],
  ignoreId?: string,
): TripItem | undefined {
  const at = toMinutes(time);
  return items.find(
    (item) =>
      item.id !== ignoreId &&
      item.booking !== undefined &&
      Math.abs(toMinutes(item.time) - at) < 60,
  );
}

/* ---------- money ---------- */

/** An unapproved suggestion is not money anyone has agreed to spend, so it
 *  stays out of the total until an editor takes it. */
export function dayTotal(day: Day, resolved: Record<string, string>): number {
  return day.items.reduce((sum, item) => {
    const counts = !item.suggested || resolved[item.id] === "approved";
    return counts ? sum + (item.costEach ?? 0) : sum;
  }, 0);
}

/* ---------- currency ---------- */

export interface Currency {
  code: string;
  label: string;
  /** Units per euro. Indicative and fixed — nothing here calls a rate feed. */
  perEuro: number;
}

export const CURRENCIES: Currency[] = [
  { code: "EUR", label: "Euro", perEuro: 1 },
  { code: "GBP", label: "Pound", perEuro: 0.85 },
  { code: "USD", label: "US dollar", perEuro: 1.09 },
  { code: "AUD", label: "Australian dollar", perEuro: 1.65 },
  { code: "NZD", label: "NZ dollar", perEuro: 1.79 },
  { code: "CAD", label: "Canadian dollar", perEuro: 1.48 },
  { code: "JPY", label: "Yen", perEuro: 170 },
  { code: "CHF", label: "Swiss franc", perEuro: 0.94 },
];

export const DEFAULT_CURRENCY = "EUR";

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/** Amounts are held in euros; the chosen currency is a display conversion. */
export function money(amountInEuros: number, code: string): string {
  const currency = getCurrency(code);
  const converted = amountInEuros * currency.perEuro;
  const whole = currency.code === "JPY";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: whole ? 0 : converted % 1 === 0 ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(converted);
}

/* ---------- editing ---------- */

export interface DraftItem {
  kind: ItemKind;
  title: string;
  photoUrl: string;
  time: string;
  place: string;
  note: string;
  booked: boolean;
  costEach: string;
}

export function draftFrom(item: TripItem): DraftItem {
  return {
    kind: item.kind,
    title: item.title,
    photoUrl: item.photoUrl ?? "",
    time: item.time,
    place: item.place === "Not set" ? "" : item.place,
    note: item.note,
    booked: item.booking !== undefined,
    costEach: item.costEach === undefined ? "" : String(item.costEach),
  };
}

let addedCount = 0;

function fields(draft: DraftItem) {
  const cost = Number.parseFloat(draft.costEach);
  const costEach = Number.isFinite(cost) && cost >= 0 ? cost : undefined;
  return {
    kind: draft.kind,
    time: draft.time,
    title: draft.title.trim(),
    photoUrl: draft.photoUrl.trim() || undefined,
    note: draft.note.trim(),
    place: draft.place.trim() || "Not set",
    costEach,
    meta: draft.booked ? "Booked" : "Nothing booked yet",
    accent: draft.booked ? GREEN : AMBER,
    bookingKind: draft.booked ? "Confirmed" : undefined,
    booking: draft.booked ? [{ label: "At", value: draft.time }] : undefined,
  };
}

/** Turn what the sheet collected into a full item, inferring the rest: an
 *  unbooked plan reads as unsettled, a booked one as confirmed. */
export function buildItem(draft: DraftItem, suggested: boolean): TripItem {
  addedCount += 1;
  return {
    id: `added-${addedCount}-${Date.now()}`,
    who: suggested ? "Suggested" : "All five",
    suggested: suggested || undefined,
    suggestedBy: suggested ? "you" : undefined,
    ...fields(draft),
  };
}

/** Editing keeps everything the sheet does not ask about — rating, photo,
 *  transit leg, booking ref — so an authored item survives a small change. */
export function applyDraft(item: TripItem, draft: DraftItem): TripItem {
  const next = fields(draft);
  return {
    ...item,
    ...next,
    meta: item.costEach !== next.costEach || !item.meta ? next.meta : item.meta,
    booking: draft.booked ? (item.booking ?? next.booking) : undefined,
    bookingKind: draft.booked ? (item.bookingKind ?? next.bookingKind) : undefined,
  };
}

/* ---------- persistence ---------- */

const STORAGE_KEY = "wayfare.trip.v1";

export interface SavedState {
  days: Day[];
  resolved: Record<string, string>;
}

export function loadSaved(): SavedState | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as SavedState;
    if (!Array.isArray(parsed.days) || parsed.days.length === 0) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function save(state: SavedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode or a full quota — the trip still works, it just won't keep. */
  }
}

export function clearSaved(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to do */
  }
}

/* ---------- saved trips ---------- */

export interface SavedPlace {
  id: string;
  kind: ItemKind;
  title: string;
  place: string;
  note: string;
  rating?: string;
  photoUrl?: string;
  costEach?: number;
  day: string;
}

export interface PastTrip {
  id: string;
  name: string;
  dates: string;
  savedAt: string;
  places: SavedPlace[];
}

/** What a finished trip is worth keeping: the places, not the timings. A
 *  declined suggestion or one nobody approved never happened, so it is left
 *  out. */
export function archive(
  name: string,
  dates: string,
  days: Day[],
  resolved: Record<string, string>,
): PastTrip {
  const places: SavedPlace[] = [];
  for (const day of days) {
    for (const item of day.items) {
      const happened =
        resolved[item.id] !== "declined" &&
        (!item.suggested || resolved[item.id] === "approved") &&
        /* Something that never landed on a place is not a recommendation. */
        item.place !== "Not set";
      if (!happened) continue;
      places.push({
        id: item.id,
        kind: item.kind,
        title: item.title,
        place: item.place,
        note: item.note,
        rating: item.rating,
        photoUrl: item.photoUrl,
        costEach: item.costEach,
        day: day.label,
      });
    }
  }
  return {
    id: `trip-${Date.now()}`,
    name,
    dates,
    savedAt: new Date().toISOString(),
    places,
  };
}

const PAST_KEY = "wayfare.past.v1";

export function loadPastTrips(): PastTrip[] {
  try {
    const raw = localStorage.getItem(PAST_KEY);
    const parsed = raw ? (JSON.parse(raw) as PastTrip[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePastTrips(trips: PastTrip[]): void {
  try {
    localStorage.setItem(PAST_KEY, JSON.stringify(trips));
  } catch {
    /* private mode or a full quota */
  }
}

const CURRENCY_KEY = "wayfare.currency.v1";

export function loadCurrency(): string {
  try {
    return localStorage.getItem(CURRENCY_KEY) ?? DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

export function saveCurrency(code: string): void {
  try {
    localStorage.setItem(CURRENCY_KEY, code);
  } catch {
    /* nothing to do */
  }
}

/* ---------- sharing ---------- */

/** A shared list travels inside the link itself, so there is no server and
 *  nothing to sign in to at the other end. Keys are short because the whole
 *  payload has to fit in a URL. */
interface SharePayload {
  n: string;
  d: string;
  f?: string;
  p: Array<{ k: ItemKind; t: string; l?: string; o?: string; r?: string; g?: string }>;
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeShare(trip: PastTrip, kinds: ItemKind[], from: string): string {
  const payload: SharePayload = {
    n: trip.name,
    d: trip.dates,
    f: from || undefined,
    p: trip.places
      .filter((place) => kinds.includes(place.kind))
      .map((place) => ({
        k: place.kind,
        t: place.title,
        l: place.place === "Not set" ? undefined : place.place,
        o: place.note || undefined,
        r: place.rating,
        g: place.photoUrl,
      })),
  };
  return toBase64Url(JSON.stringify(payload));
}

export interface SharedList {
  name: string;
  dates: string;
  from?: string;
  places: Array<{
    kind: ItemKind;
    title: string;
    place?: string;
    note?: string;
    rating?: string;
    photoUrl?: string;
  }>;
}

export function decodeShare(encoded: string): SharedList | undefined {
  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as SharePayload;
    if (!payload?.n || !Array.isArray(payload.p)) return undefined;
    return {
      name: payload.n,
      dates: payload.d,
      from: payload.f,
      places: payload.p.map((x) => ({
        kind: x.k,
        title: x.t,
        place: x.l,
        note: x.o,
        rating: x.r,
        photoUrl: x.g,
      })),
    };
  } catch {
    return undefined;
  }
}

/** The same list as something you can paste into a chat. */
export function shareText(trip: PastTrip, kinds: ItemKind[], from: string): string {
  const lines = [`${trip.name} · ${trip.dates}${from ? ` · from ${from}` : ""}`];
  for (const kind of ITEM_KINDS) {
    if (!kinds.includes(kind)) continue;
    const places = trip.places.filter((p) => p.kind === kind);
    if (places.length === 0) continue;
    lines.push("", KIND_HEADINGS[kind].toUpperCase());
    for (const place of places) {
      lines.push(`· ${place.title}${place.place !== "Not set" ? ` — ${place.place}` : ""}`);
      if (place.note) lines.push(`  ${place.note}`);
    }
  }
  return lines.join("\n");
}

/** Whether a link points straight at a picture, as opposed to a page that
 *  merely contains one. */
export function looksLikeImage(url: string): boolean {
  return (
    /^data:image\//i.test(url) ||
    /^blob:/i.test(url) ||
    /\.(jpe?g|png|gif|webp|avif|svg)(\?|#|$)/i.test(url)
  );
}
