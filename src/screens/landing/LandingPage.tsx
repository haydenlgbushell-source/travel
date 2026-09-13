import type { ReactNode } from "react";
import { getTheme, ThemeProvider, Wordmark } from "../../theme";
import { ItemCard } from "../trip/ItemCard";
import { HamburgerIcon, InfoIcon, MapIcon, PlanIcon, SearchIcon, TravelIcon } from "../trip/NavIcons";
import { PEOPLE, type TripItem } from "../trip/trip-data";
import "../trip/trip-page.css";
import "./landing.css";

const THEME = getTheme("postcard");

/** The Clare Valley cellar-door day from the real "Ramble 2026" trip
 *  (Sydney to Adelaide, run in Postcard) — same field shapes TripItem
 *  expects, photos swapped for the copies already checked into
 *  public/trip-photos, so this renders through the actual ItemCard rather
 *  than a lookalike. */
const RAMBLE_DAY: { label: string; items: TripItem[] } = {
  label: "Clare Valley — cellar door day",
  items: [
    {
      id: "i86",
      kind: "Do",
      time: "11:00",
      title: "Sevenhill Cellars",
      note: "Stop for a look at the oldest winery in the valley, est. 1851. Note: group tastings for 6+ need 48hrs notice. sevenhill.com.au",
      place: "Sevenhill, SA",
      meta: "Group tastings need 48hrs notice",
      lat: -33.8931,
      lng: 138.6386,
      who: "All six",
      accent: "oklch(0.58 0.13 60)",
      photo: "Sevenhill, SA",
      photoUrl: "/trip-photos/sevenhill-cellars.jpg",
      mapsUrl: "https://maps.google.com/?q=Sevenhill%20Cellars%20Sevenhill%2C%20SA",
    },
    {
      id: "i39",
      kind: "Eat",
      time: "14:30",
      title: "Skillogalee — tasting menu lunch",
      note: "Tasting menu lunch, ~2 hours. Note: the historic sandstone restaurant is undergoing renovation — currently running from the Barrel House in the vineyards. skillogalee.com.au",
      place: "Clare, SA",
      meta: "~2 hours",
      lat: -33.8339,
      lng: 138.6106,
      who: "All six",
      accent: "oklch(0.52 0.11 155)",
      photo: "Clare Valley vines",
      photoUrl: "/trip-photos/skillogalee.jpg",
      mapsUrl: "https://maps.google.com/?q=Skillogalee%20Clare%2C%20SA",
      bookingKind: "Confirmed",
      booking: [
        { label: "Lunch", value: "24 Sep" },
        { label: "Time", value: "2:30pm" },
      ],
    },
  ],
};

/** Real calendar days around 24 Sep 2026, the date above — Tue–Sat, with
 *  Thursday (the cellar-door day) selected, same shape TripPage's own day
 *  strip builds from `daysForRange`. */
const RAMBLE_DAYS = [
  { dow: "Tue", num: "22" },
  { dow: "Wed", num: "23" },
  { dow: "Thu", num: "24" },
  { dow: "Fri", num: "25" },
  { dow: "Sat", num: "26" },
];

type Feature = {
  title: string;
  body: string;
  icon: ReactNode;
};

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const FEATURES: Feature[] = [
  {
    title: "Everyone sees the same plan",
    body: "One itinerary for the whole group — friends, family or a work trip. Editors can add, move and tweak, and it updates for everyone straight away.",
    icon: <Icon path="M4 7h16M4 12h16M4 17h10" />,
  },
  {
    title: "Bookings that don't clash",
    body: "Add a restaurant or a flight and it flags anything already booked nearby — a gentle warning, not a wall, so the day still keeps a note about it.",
    icon: <Icon path="M12 6v6l4 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />,
  },
  {
    title: "Split the cost, no spreadsheet",
    body: "Every item's price rolls up into a day total and a running trip tab, shown in whatever currency you'd like to see it in.",
    icon: <Icon path="M12 3v18M7 7.5c0-1.9 2-3 5-3s5 1.1 5 3-2 2.5-5 3-5 1.1-5 3 2 3 5 3 5-1.1 5-3" />,
  },
  {
    title: "Works with no signal",
    body: "Airport mode puts every time, place and booking reference on one dark screen you can read — or screenshot — the moment wifi disappears.",
    icon: <Icon path="M12 20h.01M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 14 0M2 9.5a15 15 0 0 1 20 0" />,
  },
  {
    title: "A look everyone likes",
    body: "Four visual styles for the trip — from this warm, paper-and-teal Postcard look to something sharper for a boys' trip. Pick one, the plan stays the same.",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
        <path
          d="M12 21a9 9 0 1 1 0-18c4.5 0 8 3 8 6.5 0 2-1.5 3-3 3h-1.7a1.8 1.8 0 0 0-1 3.3c.4.3.7.8.7 1.3 0 1-1 1-1 1.9 0 1-1 1.9-2 1.9Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="7.5" cy="10.5" r="1.15" fill="currentColor" />
        <circle cx="11" cy="7" r="1.15" fill="currentColor" />
        <circle cx="15.5" cy="8" r="1.15" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Keep the good bits for next time",
    body: "Save a finished trip as recommendations — the places you'd actually go back to — and share it as a link. Whoever opens it needs no account.",
    icon: <Icon path="M12 21s-7-4.4-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.6-9.5 9-9.5 9Z" />,
  },
];

const STYLES = [
  { key: "meridian", label: "Meridian", swatch: "#14171A" },
  { key: "cherry", label: "Cherry Club", swatch: "#8E1F35" },
  { key: "dispatch", label: "Dispatch", swatch: "#1D211F" },
  { key: "postcard", label: "Postcard", swatch: "#12484B" },
];

/** A full iPhone-shaped screen, built out of the same markup and CSS
 *  classes (`.trip-page`, `.item__*`) and the same `ItemCard`/`Wordmark`
 *  components TripPage itself renders — not a lookalike drawn from
 *  scratch, so the header, day strip, cards and bottom nav are pixel-for-
 *  pixel what the app actually looks like, holding the real Ramble day
 *  from above. Static: no handlers fire, nothing is actually tappable. */
function PhonePreview() {
  return (
    <div className="iphone" aria-hidden="true">
      <div className="iphone__notch" />
      <div
        className="trip-page"
        style={{
          height: "100%",
          maxWidth: "none",
          margin: 0,
          background: "var(--wf-bg)",
          color: "var(--wf-ink)",
          pointerEvents: "none",
        }}
      >
        <div className="trip-page__head" style={{ background: "var(--wf-head-bg)", color: "var(--wf-head-ink)" }}>
          <div className="trip-page__head-row">
            <div className="trip-page__head-left">
              <span className="trip-page__reset trip-page__hamburger">
                <HamburgerIcon />
              </span>
              <span
                className="trip-page__reset trip-page__wordmark"
                style={{ fontFamily: "var(--wf-font-display)", letterSpacing: "var(--wf-word-track)" }}
              >
                <Wordmark theme={THEME} />
              </span>
            </div>
            <div className="trip-page__head-actions">
              <span className="trip-page__countdown" style={{ fontFamily: "var(--wf-font-mono)", color: "oklch(0.78 0.13 60)" }}>
                2 days away
              </span>
              <span className="trip-page__reset trip-page__hamburger" style={{ color: "var(--wf-head-ink)" }}>
                <InfoIcon />
              </span>
            </div>
          </div>
          <div className="trip-page__head-main trip-page__head-main--compact">
            <div className="trip-page__dates" style={{ fontFamily: "var(--wf-font-mono)", color: "var(--wf-head-meta)" }}>
              15 September – 4 October 2026
            </div>
            <div className="trip-page__avatars">
              {PEOPLE.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="trip-page__avatar"
                  style={{
                    fontFamily: "var(--wf-font-mono)",
                    background: "var(--wf-avatar-bg)",
                    borderColor: "var(--wf-head-bg)",
                    color: "#D5D8D2",
                  }}
                >
                  {p.initials}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="trip-page__days" style={{ background: "var(--wf-bg)", borderBottomColor: "var(--wf-line)" }}>
          {RAMBLE_DAYS.map((d) => {
            const on = d.num === "24";
            return (
              <span
                key={d.num}
                className="trip-page__reset trip-page__day"
                style={{
                  background: on ? "var(--wf-ink)" : "var(--wf-card)",
                  borderColor: on ? "var(--wf-ink)" : "var(--wf-line)",
                  borderRadius: "var(--wf-chip-radius)",
                }}
              >
                <span className="trip-page__day-dow" style={{ fontFamily: "var(--wf-font-mono)", color: on ? "#9DBCBB" : "var(--wf-meta)" }}>
                  {d.dow}
                </span>
                <span className="trip-page__day-num" style={{ fontFamily: "var(--wf-font-display)", color: on ? "var(--wf-bg)" : "var(--wf-ink)" }}>
                  {d.num}
                </span>
              </span>
            );
          })}
        </div>

        <div className="trip-page__actions" style={{ background: "var(--wf-bg)", borderBottomColor: "var(--wf-line)" }}>
          <span
            className="trip-page__reset trip-page__add"
            style={{ color: "var(--wf-bg)", background: "var(--wf-ink)", borderColor: "var(--wf-ink)" }}
          >
            Add to this day
          </span>
        </div>

        <div className="trip-page__body">
          <div className="items">
            {RAMBLE_DAY.items.map((item, i) => (
              <ItemCard
                key={item.id}
                item={item}
                index={i}
                canApprove
                onResolve={() => {}}
                theme={THEME}
              />
            ))}
          </div>
        </div>

        <div
          className="trip-page__nav"
          style={{ background: "var(--wf-bg)", borderTopColor: "var(--wf-line)", paddingBottom: "16px" }}
        >
          {[
            { label: "Plan", icon: PlanIcon, on: true },
            { label: "Travel", icon: TravelIcon, on: false },
            { label: "Map", icon: MapIcon, on: false },
            { label: "Search", icon: SearchIcon, on: false },
          ].map((entry) => (
            <span
              key={entry.label}
              className="trip-page__reset trip-page__nav-item"
              style={{ color: entry.on ? "var(--wf-ink)" : "var(--wf-meta)" }}
            >
              <span className="trip-page__nav-mark" style={{ background: "var(--wf-accent)", opacity: entry.on ? 1 : 0 }} />
              <span className="trip-page__nav-icon">
                <entry.icon />
              </span>
              {entry.label}
            </span>
          ))}
        </div>
      </div>
      <div className="iphone__home" />
    </div>
  );
}

export function LandingPage({
  onGetStarted,
  onSignIn,
}: {
  onGetStarted: () => void;
  onSignIn: () => void;
}) {
  return (
    <ThemeProvider theme={THEME} className="landing">
      <header className="landing__nav">
        <span className="landing__logo">Wayfare</span>
        <button type="button" className="landing__navlink" onClick={onSignIn}>
          Sign in
        </button>
      </header>

      <section className="landing__hero">
        <div className="landing__hero-copy">
          <span className="landing__eyebrow">Trip planning, together</span>
          <h1 className="landing__h1">The whole trip, in one place your group actually opens.</h1>
          <p className="landing__lede">
            Wayfare turns a pile of bookings, group chats and half-decided plans into one shared
            itinerary — day by day, place by place — that everyone can see and an editor can keep
            up to date.
          </p>
          <div className="landing__cta-row">
            <button type="button" className="landing__btn landing__btn--primary" onClick={onGetStarted}>
              Start planning free
            </button>
            <button type="button" className="landing__btn landing__btn--ghost" onClick={onSignIn}>
              Sign in
            </button>
          </div>
          <p className="landing__fineprint">No credit card. Set up your first day in a couple of minutes.</p>
        </div>
        <div className="landing__hero-visual">
          <PhonePreview />
        </div>
      </section>

      <section className="landing__features">
        <h2 className="landing__h2">Everything the group actually needs</h2>
        <div className="landing__grid">
          {FEATURES.map((f) => (
            <article className="landing__feature" key={f.title}>
              <span className="landing__feature-icon">{f.icon}</span>
              <h3 className="landing__feature-title">{f.title}</h3>
              <p className="landing__feature-body">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing__styles">
        <h2 className="landing__h2">Pick a look everyone likes</h2>
        <p className="landing__styles-sub">
          This page is shown in <strong>Postcard</strong> — bleached paper, deep teal, roomier
          labels for reading aloud. Every trip picks its own from four, and it never changes what
          the plan can do.
        </p>
        <div className="landing__swatches">
          {STYLES.map((s) => (
            <span
              key={s.key}
              className={s.key === "postcard" ? "landing__swatch landing__swatch--active" : "landing__swatch"}
            >
              <span className="landing__swatch-dot" style={{ background: s.swatch }} />
              {s.label}
            </span>
          ))}
        </div>
      </section>

      <section className="landing__how">
        <h2 className="landing__h2">How it works</h2>
        <ol className="landing__steps">
          <li className="landing__step">
            <span className="landing__step-num">1</span>
            <div>
              <p className="landing__step-title">Set up the trip</p>
              <p className="landing__step-body">Dates, a style, and who's coming — done in a couple of minutes.</p>
            </div>
          </li>
          <li className="landing__step">
            <span className="landing__step-num">2</span>
            <div>
              <p className="landing__step-title">Bring your people in</p>
              <p className="landing__step-body">Share a link. No app-store detour, no account needed just to look.</p>
            </div>
          </li>
          <li className="landing__step">
            <span className="landing__step-num">3</span>
            <div>
              <p className="landing__step-title">Plan the days together</p>
              <p className="landing__step-body">Add places, settle the money, and keep the good ones for next time.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="landing__final">
        <h2 className="landing__h2">Ready when you are</h2>
        <p className="landing__final-body">Free to start. Your first trip is a couple of minutes away.</p>
        <button type="button" className="landing__btn landing__btn--primary" onClick={onGetStarted}>
          Start planning free
        </button>
      </section>

      <footer className="landing__footer">
        <span>Wayfare</span>
        <button type="button" className="landing__navlink" onClick={onSignIn}>
          Already have an account? Sign in
        </button>
      </footer>
    </ThemeProvider>
  );
}
