# Wayfare

A platform for building personalised group trip itineraries. Anyone can create a
trip, invite the people they're travelling with, and plan flights, stays, days,
budget and packing in one shared place.

This repo currently holds the **production scaffold and full static shell**:
every screen of the design system is built as a real component against typed
mock data. There is no database and no auth yet — see [What's next](#whats-next).

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript, strict |
| Styling | Tailwind CSS 3, theme extended from the design tokens |
| Icons | `lucide-react` |
| Hosting | Netlify (`netlify.toml` + `@netlify/plugin-nextjs`) |
| Data (planned) | Supabase — Postgres + Auth |

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint
```

## Design system

The visual language is a "boarding pass / ticket stub" system on kraft paper.
Tokens live in `tailwind.config.ts` — use them rather than raw hex values.

```
ink #12332E · ink-soft #1B453E · ink-text #20241F
paper #F3E9D2 · paper-hi #FAF4E6 · line #DCCFAF · muted #6B6459
lagoon #1C7C8C · lagoon-dark #125866
papaya #FF7A45 · stamp #C2452D · palm #3F7D58
```

Type is split three ways on purpose, and the split is load-bearing:
**Fraunces** (display) for headings, prices and route codes; **IBM Plex Sans**
for body copy; **IBM Plex Mono** for anything with the character of a printed
record — flight codes, times, references, budget figures.

Four signature patterns carry the identity. They live in shared components so
they can't drift:

1. **Perforation divider** — `components/shell/SectionDivider.tsx`, backed by
   `.perf` / `.perf-v` in `app/globals.css`. Dashed rule with scalloped notches
   straddling each edge.
2. **Boarding pass** — `components/trip/BoardingPassList.tsx`. Info panel plus a
   torn-off barcode stub, split by a vertical perforation.
3. **Receipt** — `components/trip/BudgetReceipt.tsx`. Ruled paper at a 28px
   pitch with monospace, right-aligned figures sitting on the rules.
4. **Sticky shortcut nav** — `components/shell/ShortcutNav.tsx`. Scroll-spy via
   one `IntersectionObserver` over the sections carrying ids.

## Layout

```
app/
  page.tsx               Trips index — the platform home screen
  trips/[slug]/page.tsx  One trip, all sections
  not-found.tsx
components/
  shell/                 PhoneFrame, Card/Pill/Overline, SectionDivider, ShortcutNav
  trip/                  One component per itinerary section
lib/
  types.ts               Domain types, shaped to match the planned DB tables
  mock-data.ts           Demo seed — the single source of fabricated data
  format.ts              Dates, money, budget splitting
  ics.ts                 Calendar export (RFC 5545)
```

`lib/mock-data.ts` is the only module that invents data. Swapping it for
Supabase queries that return the same types from `lib/types.ts` is the whole
data migration — components shouldn't need to change.

## Decisions worth knowing

**No document uploads.** The original mockup had a document vault for passports,
insurance and boarding-pass files. That's out of scope for the product, so
there's no `documents` table, no Storage bucket and no PII at rest. The
shortcut nav's last slot points at reference info (entry requirements and
emergency contacts) instead. The ticket wallet holds reference codes the
organiser typed in — not uploaded files.

**Tabs actually filter.** In the mockup the day tabs were decorative and only
Day 1 existed. `components/trip/DayPlan.tsx` pairs the tabs with the timeline in
one client component, so selecting a day switches the content and "All days"
shows every day's highlights. All 8 days are populated.

**Interactive pieces work, but state is local.** Voting, packing checkboxes and
alert dismissal are real interactions held in React state — they reset on
reload. Each component documents the table it should write to instead.

**Placeholders announce themselves.** The map is drawn as a blueprint rather
than a fake map; the weather widget is labelled "seasonal averages, not a
forecast"; barcodes and QR blocks are CSS and carry accessible labels saying so.
Nothing pretends to be live data.

**Calendar export is real.** "Add to calendar" generates a valid `.ics` from the
itinerary in the browser — no server round-trip. Events use floating local times
so an 18:00 item reads 18:00 wherever you import it.

**Demo trip is dated 2026.** The mockup was "Bali 2025"; the seed trip is dated
September 2026 so the countdown and status logic have something real to compute.

## What's next

1. **Supabase schema + RLS.** Because this is multi-tenant, auth is foundational
   rather than a later step: every table's policy keys off `trip_members`, so a
   user only sees trips they belong to.

   ```
   trips             (id, slug, name, destination, cover_route,
                      start_date, end_date, organiser_id, status)
   trip_members      (trip_id, user_id, initials, role)
   accommodations    (trip_id, name, address, check_in, check_out, reference, booking_url)
   flights           (trip_id, direction, airline, flight_number, origin, destination,
                      departs_at, arrives_at, status, gate, reference)
   transport         (trip_id, kind, label, detail, status, cost)
   itinerary_events  (trip_id, day_date, time, title, subtitle, tag, is_highlight)
   expenses          (trip_id, category, label, amount_cents, paid_by, split_across)
   polls             (trip_id, question, closes_at)
   poll_options      (poll_id, label, detail)
   poll_votes        (poll_id, option_id, user_id)          -- counts derived, not stored
   packing_items     (trip_id, category, label, assigned_to)
   packing_checks    (item_id, user_id)                     -- per-user, not a flag on the item
   alerts            (trip_id, tone, title, body)
   notifications     (trip_id, kind, title, body, created_at)
   ```

2. **Write paths.** Every section is currently read-only. Creating a trip,
   inviting members and editing each section need forms and server actions.
3. **Real integrations.** Maps embed, weather API, flight status, QR generation
   where a vendor code exists.
