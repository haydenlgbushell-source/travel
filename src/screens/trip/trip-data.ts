/** Trip content for the Chicago trip. Static for now — the screen reads it the
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
  /** A Wikipedia article whose lead image is a genuine photo of this place —
   *  resolved to `photoUrl` at runtime rather than hand-linked, so a wrong
   *  guess fails to the fill instead of showing the wrong picture. */
  wikiTitle?: string;
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
  { initials: "AN", name: "Ana Ferreira", role: "Organiser", note: "Holds the hotel and both flights" },
  { initials: "TM", name: "Tom Reid", role: "Editor", note: "Booked the Cubs tickets" },
  { initials: "JR", name: "Jo Rahman", role: "Editor", note: "Handles the museum passes" },
  { initials: "SB", name: "Sam Boyd", role: "Contributor", note: "Joined Tuesday" },
  { initials: "KE", name: "Kit Ellis", role: "Contributor", note: "Two suggestions waiting" },
];

export const TRIP = {
  name: "Chicago",
  dates: "14 – 19 August 2026",
  members: PEOPLE,
};

/** Authored without ids; `DAYS` stamps them on once at module load. */
type AuthoredDay = Omit<Day, "items"> & { items: Array<Omit<TripItem, "id">> };

const AUTHORED_DAYS: AuthoredDay[] = [
  {
    dow: "Fri",
    num: "14",
    label: "Landing and the Loop",
    fullDate: "Friday 14 August",
    weather: "84° · humid",
    mapArea: "The Loop",
    walk: "1.8 km",
    items: [
      {
        time: "14:20",
        title: "Land at O'Hare",
        kind: "Travel",
        note: "Immigration and customs are the slow part — allow an hour before anyone books a transfer.",
        place: "ORD · Terminal 5",
        meta: "BA296 · on time",
        costEach: 4.6,
        who: "All five",
        accent: ACCENT,
        transit: "Blue Line · 45 min · $5",
      },
      {
        time: "16:00",
        title: "Check in at Hotel Julian",
        kind: "Stay",
        note: "Rooftop bar opens at 16:00 too — check in first, bags go straight up with the bellhop.",
        place: "168 N Michigan Ave",
        meta: "Held under Ana",
        who: "All five",
        accent: GREEN,
        photo: "The Loop, Chicago",
        wikiTitle: "Chicago Loop",
        rating: "4.6",
        reviews: "3,412",
        price: "$$$",
        open: "Front desk 24 hours",
        mapsUrl: "https://maps.google.com/?q=Hotel+Julian+Chicago",
        bookingKind: "Confirmed",
        booking: [
          { label: "In", value: "16:00" },
          { label: "Ref", value: "KA-5521" },
        ],
        transit: "Walk · 12 min",
      },
      {
        time: "19:30",
        title: "Lou Malnati's Pizzeria",
        kind: "Eat",
        note: "Deep dish takes 45 minutes to bake — order it the second you sit down, before drinks even arrive.",
        place: "439 N Wells St",
        meta: "≈ $27 each",
        costEach: 25,
        who: "All five",
        accent: GREEN,
        photo: "Deep dish, straight from the oven",
        wikiTitle: "Chicago-style pizza",
        rating: "4.6",
        reviews: "9,240",
        price: "$$",
        open: "Until 22:00",
        mapsUrl: "https://maps.google.com/?q=Lou+Malnati%27s+Pizzeria+Wells+St+Chicago",
        bookingKind: "Table booked",
        booking: [
          { label: "Under", value: "Ana" },
          { label: "Party", value: "5" },
        ],
        transit: "Walk · 15 min",
      },
      {
        time: "21:30",
        title: "Chicago Riverwalk at night",
        kind: "Do",
        photo: "Riverwalk at dusk",
        wikiTitle: "Chicago Riverwalk",
        note: "Free, and the skyline lights up right after sunset — no reservations needed, just show up.",
        place: "Chicago Riverwalk",
        meta: "Free",
        who: "3 of 5 going",
        split: true,
        accent: AMBER,
        rating: "4.8",
        reviews: "22,150",
        price: "Free",
        open: "Always open",
        mapsUrl: "https://maps.google.com/?q=Chicago+Riverwalk",
      },
    ],
  },
  {
    dow: "Sat",
    num: "15",
    label: "Millennium Park and the Loop",
    fullDate: "Saturday 15 August",
    weather: "86° · sunny",
    mapArea: "Millennium Park",
    walk: "4.1 km",
    conflict:
      "The river cruise at 13:00 is a 15-minute walk from lunch, and the Art Institute queue can run long on a Saturday — leave slack before noon.",
    items: [
      {
        time: "09:30",
        title: "Art Institute of Chicago",
        kind: "Do",
        note: "Entry is timed at 09:30 and ours is paid — the members' line moves faster if the main queue backs up.",
        place: "111 S Michigan Ave",
        meta: "Paid · $28 each",
        costEach: 24,
        who: "All five",
        accent: GREEN,
        photo: "American Gothic gallery",
        wikiTitle: "Art Institute of Chicago",
        rating: "4.8",
        reviews: "42,300",
        price: "$28",
        open: "09:30–17:00",
        mapsUrl: "https://maps.google.com/?q=Art+Institute+of+Chicago",
        bookingKind: "Tickets held",
        booking: [
          { label: "Slot", value: "09:30" },
          { label: "Ref", value: "AI-77410" },
        ],
        transit: "Walk · 6 min",
      },
      {
        time: "12:00",
        title: "Billy Goat Tavern",
        kind: "Eat",
        photo: "Under Michigan Avenue",
        wikiTitle: "Billy Goat Tavern",
        note: "Cash is easier underground — the card machine at this location is often out of order.",
        place: "430 N Michigan Ave, Lower Level",
        meta: "≈ $14 each",
        costEach: 12.5,
        who: "All five",
        accent: AMBER,
        rating: "4.3",
        reviews: "6,840",
        price: "$",
        open: "Until 23:00",
        mapsUrl: "https://maps.google.com/?q=Billy+Goat+Tavern+Chicago",
        bookingKind: "Walk in",
        booking: [{ label: "Wait", value: "~10 min" }],
        transit: "Walk · 15 min · tight against the cruise",
        transitWarn: true,
      },
      {
        time: "13:00",
        title: "Chicago Architecture Center river cruise",
        kind: "Do",
        note: "Boards ten minutes before departure at the dock — arrive early or the slot is given away.",
        place: "Chicago's First Lady Cruises, Michigan Ave Bridge",
        meta: "Paid · $52 each",
        costEach: 47.7,
        who: "All five",
        accent: GREEN,
        photo: "River, from the water",
        wikiTitle: "Chicago Riverwalk",
        rating: "4.9",
        reviews: "15,670",
        price: "$52",
        open: "Departs hourly",
        mapsUrl: "https://maps.google.com/?q=Chicago+Architecture+Center+River+Cruise+dock",
        bookingKind: "Tickets held",
        booking: [
          { label: "Slot", value: "13:00" },
          { label: "Ref", value: "CAC-30281" },
        ],
        transit: "Walk · 8 min",
      },
      {
        time: "15:00",
        title: "Cloud Gate, Millennium Park",
        kind: "Do",
        photo: "The Bean",
        wikiTitle: "Cloud Gate",
        note: "Free, and best photographed from underneath looking straight up — the crowds thin out after 16:00.",
        place: "Millennium Park",
        meta: "Free",
        who: "All five",
        accent: AMBER,
        rating: "4.8",
        reviews: "88,400",
        price: "Free",
        open: "Always open",
        mapsUrl: "https://maps.google.com/?q=Cloud+Gate+Millennium+Park",
      },
      {
        time: "19:30",
        title: "Girl & the Goat",
        kind: "Eat",
        note: "One of the hardest reservations in the West Loop — ours is confirmed, but they hold it for fifteen minutes only.",
        place: "809 W Randolph St",
        meta: "≈ $58 each",
        costEach: 53,
        who: "All five",
        accent: GREEN,
        photo: "Open kitchen, West Loop",
        wikiTitle: "Girl & the Goat",
        rating: "4.6",
        reviews: "5,120",
        price: "$$$",
        open: "Until 23:00",
        mapsUrl: "https://maps.google.com/?q=Girl+%26+the+Goat+Chicago",
        bookingKind: "Table booked",
        booking: [
          { label: "Under", value: "Ana" },
          { label: "Party", value: "5" },
        ],
        transit: "Ride share · 15 min",
      },
    ],
  },
  {
    dow: "Sun",
    num: "16",
    label: "Museum Campus",
    fullDate: "Sunday 16 August",
    weather: "80° · clear",
    mapArea: "Museum Campus",
    walk: "3.6 km",
    conflict:
      "Shedd Aquarium closes at 17:00 and the Field Museum entry is timed at 14:00 — keep the gap tight if the Oceanarium show runs long.",
    items: [
      {
        time: "10:00",
        title: "Shedd Aquarium",
        kind: "Do",
        note: "Entry is timed and paid. The Oceanarium showcase runs on the hour — worth planning around.",
        place: "1200 S Lake Shore Dr",
        meta: "Paid · $45 each",
        costEach: 41,
        who: "All five",
        accent: GREEN,
        photo: "Oceanarium tank",
        wikiTitle: "Shedd Aquarium",
        rating: "4.7",
        reviews: "38,900",
        price: "$45",
        open: "09:00–17:00",
        mapsUrl: "https://maps.google.com/?q=Shedd+Aquarium",
        bookingKind: "Tickets held",
        booking: [
          { label: "Slot", value: "10:00" },
          { label: "Ref", value: "SH-19042" },
        ],
        transit: "Walk · 10 min",
      },
      {
        time: "14:00",
        title: "Field Museum",
        kind: "Do",
        note: "Sue the T. rex is straight ahead past the entrance — everyone photographs it first, so go left instead for the crowd-free version.",
        place: "1400 S Lake Shore Dr",
        meta: "Paid · $32 each",
        costEach: 29,
        who: "All five",
        accent: GREEN,
        photo: "Main hall, Field Museum",
        wikiTitle: "Field Museum of Natural History",
        rating: "4.8",
        reviews: "51,200",
        price: "$32",
        open: "09:00–17:00",
        mapsUrl: "https://maps.google.com/?q=Field+Museum+Chicago",
        bookingKind: "Tickets held",
        booking: [
          { label: "Slot", value: "14:00" },
          { label: "Ref", value: "FM-88231" },
        ],
        transit: "Walk · 12 min",
      },
      {
        time: "18:00",
        title: "Portillo's",
        kind: "Eat",
        photo: "Chicago-style hot dog",
        wikiTitle: "Chicago-style hot dog",
        note: "Order the Chicago-style hot dog exactly as it comes — asking for ketchup is genuinely frowned upon here.",
        place: "100 W Ontario St",
        meta: "≈ $13 each",
        costEach: 11.9,
        who: "All five",
        accent: AMBER,
        rating: "4.5",
        reviews: "19,300",
        price: "$",
        open: "Until 23:00",
        mapsUrl: "https://maps.google.com/?q=Portillo%27s+Ontario+St+Chicago",
        bookingKind: "Walk in",
        booking: [{ label: "Wait", value: "~15 min" }],
      },
    ],
  },
  {
    dow: "Mon",
    num: "17",
    label: "Wrigleyville and the North Side",
    fullDate: "Monday 17 August",
    weather: "83° · partly cloudy",
    mapArea: "Wrigleyville",
    walk: "2.9 km",
    items: [
      {
        time: "13:20",
        title: "Cubs game at Wrigley Field",
        kind: "Do",
        note: "Day game, first pitch 13:20 — gates open two hours earlier if anyone wants the full batting-practice experience.",
        place: "1060 W Addison St",
        meta: "≈ $65 each",
        costEach: 60,
        who: "All five",
        accent: GREEN,
        photo: "The ivy, from the bleachers",
        wikiTitle: "Wrigley Field",
        rating: "4.7",
        reviews: "24,700",
        price: "$65",
        open: "Gates 11:20",
        mapsUrl: "https://maps.google.com/?q=Wrigley+Field",
        bookingKind: "Tickets held",
        booking: [
          { label: "Section", value: "216" },
          { label: "Ref", value: "WF-40217" },
        ],
        transit: "Red Line · 20 min",
      },
      {
        time: "18:00",
        title: "Lincoln Park Zoo",
        kind: "Do",
        photo: "Free, since 1868",
        wikiTitle: "Lincoln Park Zoo",
        note: "Free, and open into the evening — the big cats are most active once it cools off.",
        place: "2001 N Clark St",
        meta: "Free",
        who: "3 of 5 going",
        split: true,
        accent: AMBER,
        rating: "4.7",
        reviews: "31,600",
        price: "Free",
        open: "Until 18:30",
        mapsUrl: "https://maps.google.com/?q=Lincoln+Park+Zoo",
      },
      {
        time: "20:00",
        title: "Pequod's Pizza",
        kind: "Eat",
        note: "The caramelised cheese crust is the whole point — ask for it well done at the counter before you're seated.",
        place: "2207 N Clybourn Ave",
        meta: "≈ $24 each",
        costEach: 22,
        who: "All five",
        accent: GREEN,
        photo: "The crust, caramelised",
        wikiTitle: "Chicago-style pizza",
        rating: "4.6",
        reviews: "8,410",
        price: "$$",
        open: "Until 23:00",
        mapsUrl: "https://maps.google.com/?q=Pequod%27s+Pizza+Chicago",
        bookingKind: "Table booked",
        booking: [
          { label: "Under", value: "Tom" },
          { label: "Party", value: "5" },
        ],
      },
      {
        time: "22:00",
        title: "Second City late show",
        kind: "Do",
        photo: "The mainstage",
        wikiTitle: "The Second City",
        note: "Kit found late tickets — need someone to say yes before they're gone.",
        place: "1616 N Wells St",
        meta: "≈ $38 each",
        costEach: 35,
        who: "Suggested",
        accent: AMBER,
        suggested: true,
        suggestedBy: "Kit",
        rating: "4.6",
        reviews: "12,200",
        price: "$38",
        open: "Doors 21:30",
        mapsUrl: "https://maps.google.com/?q=The+Second+City+Chicago",
      },
    ],
  },
  {
    dow: "Tue",
    num: "18",
    label: "West Loop and Wicker Park",
    fullDate: "Tuesday 18 August",
    weather: "85° · sunny",
    mapArea: "West Loop",
    walk: "5.2 km",
    conflict:
      "Au Cheval doesn't take reservations and the queue regularly runs over ninety minutes — put a name down before wandering off to Fulton Market.",
    items: [
      {
        time: "12:30",
        title: "Au Cheval",
        kind: "Eat",
        note: "No reservations. Put your name in, then explore Fulton Market — they'll text when the table's ready.",
        place: "800 W Randolph St",
        meta: "≈ $22 each",
        costEach: 20,
        who: "All five",
        accent: AMBER,
        rating: "4.6",
        reviews: "7,230",
        price: "$$",
        open: "Until 23:00",
        openWarn: true,
        mapsUrl: "https://maps.google.com/?q=Au+Cheval+Chicago",
        bookingKind: "Walk in",
        booking: [{ label: "Wait", value: "~75 min" }],
        transit: "Walk · 20 min · tight against the wait",
        transitWarn: true,
      },
      {
        time: "15:00",
        title: "Wicker Park and Bucktown",
        kind: "Do",
        photo: "Milwaukee Avenue",
        wikiTitle: "Wicker Park, Chicago",
        note: "Milwaukee Avenue has most of the vintage stores — worth an unhurried couple of hours.",
        place: "Wicker Park",
        meta: "Free",
        who: "All five",
        accent: AMBER,
        rating: "4.5",
        reviews: "4,980",
        price: "Free",
        open: "Shops until 19:00",
        mapsUrl: "https://maps.google.com/?q=Wicker+Park+Chicago",
      },
      {
        time: "20:00",
        title: "Last dinner — undecided",
        kind: "Eat",
        note: "Three restaurants in the vote: Girl & the Goat again, RPM Italian, or Smoque BBQ.",
        place: "Not set",
        meta: "Waiting on 3",
        who: "All five",
        accent: AMBER,
        bookingKind: "No table yet",
        booking: [
          { label: "Votes", value: "2 of 5" },
          { label: "Closes", value: "Mon 20:00" },
        ],
      },
    ],
  },
  {
    dow: "Wed",
    num: "19",
    label: "Home",
    fullDate: "Wednesday 19 August",
    weather: "81° · clear",
    mapArea: "The Loop to ORD",
    walk: "No walking",
    items: [
      {
        time: "09:00",
        title: "Checkout and airport transfer",
        kind: "Travel",
        note: "Two rideshares booked for 09:00. Bags can stay with the concierge if anyone wants a last coffee.",
        place: "Hotel Julian",
        meta: "$62 total",
        costEach: 11.4,
        who: "All five",
        accent: GREEN,
        bookingKind: "Cars booked",
        booking: [
          { label: "Pickup", value: "09:00" },
          { label: "Ref", value: "RS-8834" },
        ],
        transit: "Ride share · 35 min",
      },
      {
        time: "12:40",
        title: "BA297 to Gatwick",
        kind: "Travel",
        note: "Gate closes 12:10. Ana and Tom are in row 14, the rest in 22.",
        place: "ORD · Terminal 5",
        meta: "Bags ×3",
        who: "All five",
        accent: ACCENT,
        bookingKind: "Confirmed",
        booking: [
          { label: "Ref", value: "K7QX4R" },
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

/** Full label for the tab's accessible name, short one for the bottom bar
 *  where several items share the width of a phone. */
export const TABS = [
  { label: "Plan", short: "Plan" },
  { label: "Stay & travel", short: "Travel" },
  { label: "Money", short: "Money" },
  { label: "Info", short: "Info" },
  { label: "People", short: "People" },
];

/** Pins are laid out on a fixed spiral, capped so a long list still lands
 *  inside the canvas rather than drifting past its edge. */
export function pinPosition(i: number): { left: string; top: string } {
  const golden = 137.508 * i * (Math.PI / 180);
  const radius = Math.min(0.11 + 0.34 * Math.sqrt(i / 8), 0.42);
  return {
    left: `${(0.5 + radius * Math.cos(golden)) * 100}%`,
    top: `${(0.5 + radius * 0.82 * Math.sin(golden)) * 100}%`,
  };
}

export interface LocatedItem {
  item: TripItem;
  day: Day;
}

/** Everything worth putting a pin on, across the whole trip — a plan that
 *  never landed on a place has nothing to show. */
export function locatedItems(days: Day[]): LocatedItem[] {
  const out: LocatedItem[] = [];
  for (const day of days) {
    for (const item of day.items) {
      if (item.place && item.place !== "Not set") out.push({ item, day });
    }
  }
  return out;
}

/** A real link to open, even for an item that never got one of its own. */
export function mapsLink(item: TripItem): string {
  return item.mapsUrl ?? `https://maps.google.com/?q=${encodeURIComponent(`${item.title} ${item.place}`)}`;
}

/** Where the group is staying, and who to call if a phone is dead. */
export const EMERGENCY_NUMBER = "911";

export const STAY = {
  name: "Hotel Julian, The Loop",
  address: "168 N Michigan Ave, Chicago, IL 60601",
  phone: "+1 312-660-8615",
  facts: [
    { label: "Check in", value: "Fri 16:00" },
    { label: "Check out", value: "Wed 09:00" },
    { label: "Nights", value: "5" },
    { label: "Per person", value: "$612" },
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
    airline: "British Airways",
    number: "BA296",
    from: "LGW",
    to: "ORD",
    date: "Fri 14 Aug",
    ref: "K7QX4R",
    cells: [
      { label: "Depart", value: "11:05" },
      { label: "Arrive", value: "14:20" },
      { label: "Seats", value: "14A–14E" },
      { label: "Bags", value: "3 checked" },
    ],
    status: "Delayed 20 min",
    statusColor: "oklch(0.5 0.13 60)",
    statusBg: "oklch(0.96 0.04 60)",
    updatedShort: "Live · 40s ago",
    liveCells: [
      { label: "Now departs", value: "11:25" },
      { label: "Gate", value: "D42" },
      { label: "Terminal", value: "5" },
      { label: "Aircraft", value: "777-200" },
    ],
  },
  {
    airline: "British Airways",
    number: "BA297",
    from: "ORD",
    to: "LGW",
    date: "Wed 19 Aug",
    ref: "K7QX4R",
    cells: [
      { label: "Depart", value: "12:40" },
      { label: "Arrive", value: "02:10" },
      { label: "Seats", value: "22B–22F" },
      { label: "Bags", value: "3 checked" },
    ],
    status: "On time",
    statusColor: "oklch(0.42 0.11 155)",
    statusBg: "oklch(0.96 0.03 155)",
    updatedShort: "Live · 40s ago",
    liveCells: [
      { label: "Gate", value: "Opens 11:40" },
      { label: "Terminal", value: "5" },
      { label: "Aircraft", value: "777-200" },
      { label: "Check-in", value: "Desk 12" },
    ],
  },
];

/** Trip-level bookings, held in the app's base unit like everything else. */
export const BUDGET = {
  rows: [
    { label: "Flights", each: 560, total: 2800 },
    { label: "Hotel, five nights", each: 612, total: 3060 },
    { label: "Tickets and entries", each: 220, total: 1100 },
    { label: "Transport and transfers", each: 60, total: 300 },
    { label: "Food, so far", each: 208, total: 1040 },
  ],
  total: 8300,
  each: 1660,
  owes: [
    { who: "Tom owes Ana", amount: 280 },
    { who: "Kit owes Ana", amount: 190 },
    { who: "Sam owes Jo", amount: 65 },
  ],
};

export const INFO = [
  {
    label: "Entry",
    value: "ESTA or visa, valid passport",
    note: "Apply for ESTA at least 72 hours before you fly — it's linked to the passport, not the person, so everyone needs their own.",
  },
  {
    label: "Money",
    value: "US dollar · cards everywhere",
    note: "Tipping is expected — 18-20% at sit-down restaurants. A few food trucks and dive bars are cash only.",
  },
  {
    label: "Emergency",
    value: "911",
    note: "British Consulate-General, 625 N Michigan Ave. Ana has everyone's details written down.",
  },
  {
    label: "Getting around",
    value: "CTA 'L' and buses",
    note: "A 3-day Ventra pass is $20 and covers trains and buses. Tap a contactless card instead if you'd rather skip the pass.",
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
    text: "Saturday's river cruise — the 13:00 slot or wait for 15:00?",
    due: "Closes tonight 20:00",
    dueColor: "oklch(0.5 0.13 30)",
  },
  {
    text: "Tuesday's last dinner — three restaurants on the table",
    due: "Closes Monday 20:00",
    dueColor: "oklch(0.5 0.13 60)",
  },
  { text: "Hotel deposit, $180 from Tom", due: "Due 20 August", dueColor: "oklch(0.5 0.13 60)" },
];

export const DECISION_COUNT = 3;

/** Suggestions waiting on an editor, shown on the People tab. */
export const INBOX = [
  {
    title: "Second City late show",
    meta: "Kit · 2 hours ago · Mon 22:00",
    note: "Only works if we skip a slow morning Tuesday.",
    day: 3,
  },
  {
    title: "Alinea, if anyone wants to splurge",
    meta: "Sam · yesterday · Wed lunch",
    note: "Would mean swapping out the airport-day lunch entirely.",
    day: 5,
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

export const DEFAULT_CURRENCY = "USD";

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

/** Bumped whenever the seed itinerary changes materially (a different city,
 *  a different date range). A save tagged with an older version is someone's
 *  browser still holding the *previous* trip — Lisbon days under a Chicago
 *  header — so it gets discarded rather than shown back to them. */
const CONTENT_VERSION = "chicago-1";

export interface SavedState {
  days: Day[];
  resolved: Record<string, string>;
}

export function loadSaved(): SavedState | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as SavedState & { version?: string };
    if (parsed.version !== CONTENT_VERSION) return undefined;
    if (!Array.isArray(parsed.days) || parsed.days.length === 0) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function save(state: SavedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: CONTENT_VERSION }));
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
