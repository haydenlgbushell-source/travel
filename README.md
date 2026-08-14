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
