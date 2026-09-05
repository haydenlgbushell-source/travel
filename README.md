# Wayfare

Trip planning app. React + TypeScript + Vite.

## Implemented

- **Trip Setup — style picker** (`src/screens/trip-setup`): step 3 of trip
  creation, where the organiser picks the visual style ("Meridian",
  "Cherry Club", "Dispatch", "Postcard") the whole group will see. Four
  style cards each carry a miniature preview; picking one updates a
  full-size live phone preview on the right. Below the cards, a
  plain-language panel spells out what a style changes (colour, type,
  radius, label wording) and what it never touches (screens, bookings,
  money, permissions), plus a toggle for whether editors can change the
  style later too.

- **Trip page, mobile** (`src/screens/trip`): the trip itself, at phone width.
  A dark header with the countdown and an Airport-mode toggle, a scrolling day
  selector that flags days with a clash, and five tabs — Plan, Stay & travel,
  Money, Info, People. Plan carries the day's chips, any conflict note, the
  item cards (photo, rating, booking box, transit leg) and a day map; a
  suggested item stays dashed and tinted until an editor approves it. Airport
  mode replaces the tabs with times, places and booking refs on one dark card.
  The bottom bar opens a decisions sheet with the open votes.

  Editors can add, edit and remove items. The add sheet asks only what and
  when, offering times taken from the gaps in that day, and warns — without
  blocking — when a time lands near something already booked; take the
  warning and the day keeps a note about it. Day totals and the money bars
  are summed from the items, so adding a cost moves the numbers, and an
  unapproved suggestion stays out until an editor takes it. The plan is
  kept in `localStorage`, so it survives a refresh. "View as" on the People
  tab switches role — a prototype stand-in for what an invite would set.

- **Past trips and sharing** (`src/screens/trip`): a finished trip is saved
  from the Info tab, keeping the places rather than the timings — anything
  declined, unapproved, or never decided on is left out. A saved trip reads
  as recommendations, grouped into places to eat, where we stayed and things
  we did. Sharing picks which of those groups to include and produces either
  a link or plain text to paste into a chat. The link carries the list in its
  own fragment, so whoever opens it needs no account and there is no server
  in the loop; they land on a read-only view of the places.

- **Currency** (`money()` in `trip-data`): amounts are held in euros and
  converted for display against fixed indicative rates — no rate feed is
  called. The picker sits on the Money tab and the choice is remembered.

- **Theme system** (`src/theme`): the four style definitions, typed and
  exposed as `THEMES`, plus a `<ThemeProvider theme={...}>` that surfaces
  every token as a `--wf-*` CSS custom property (colour, radius, font
  family) and a `useTheme()` hook for the copy tokens (countdown wording,
  button labels, etc.) that aren't CSS. Any future screen renders themed
  chrome by wrapping it in a `ThemeProvider` and reading `useTheme()` /
  `var(--wf-*)` — it doesn't need to know the four styles exist.

## Develop

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## Deploy

Two live, pinned services — not resolved by name search, since the account
behind each has several other similarly-named projects:

- **Netlify**: site `wayfare-app`, id `6fea33b5-67f5-43d2-b209-52b993e8499e`
  (<https://app.netlify.com/projects/wayfare-app>), linked via
  `.netlify/state.json`. `netlify deploy`/`netlify build` from this
  directory resolve to it automatically; no `--site-id` needed.
- **Supabase**: project **Wayfare**, ref `elvctcbnnohjxiqonpbo`
  (ap-southeast-2), linked via `supabase/config.toml` — see
  `supabase/README.md`.

Deploys here are pushed via API rather than a git webhook, so merging to
`main` alone does not build a new deploy — trigger one from the Netlify
dashboard ("Trigger deploy" → "Deploy site") or `netlify deploy --site-id
6fea33b5-67f5-43d2-b209-52b993e8499e` after building.
