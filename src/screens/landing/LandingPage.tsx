import type { ReactNode } from "react";
import { getTheme, ThemeProvider } from "../../theme";
import "./landing.css";

const THEME = getTheme("postcard");

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

/** A small, self-contained mock of the Plan tab's day view — built from the
 *  actual "Ramble 2026" trip's Clare Valley cellar-door day (real stops,
 *  real photos) rather than invented sample data, so this is what the
 *  Postcard style genuinely looks like on a real itinerary. */
function PlanPreview() {
  return (
    <div className="landing-mock" aria-hidden="true">
      <div className="landing-mock__head">
        <span className="landing-mock__day">Clare Valley — cellar door day</span>
        <span className="landing-mock__count">Day 10 of Ramble</span>
      </div>
      <div className="landing-mock__chips">
        <span className="landing-mock__chip landing-mock__chip--on">Plan</span>
        <span className="landing-mock__chip">Stay &amp; travel</span>
        <span className="landing-mock__chip">Money</span>
      </div>
      <div className="landing-mock__card">
        <img className="landing-mock__photo" src="/trip-photos/sevenhill-cellars.jpg" alt="" />
        <div className="landing-mock__body">
          <div className="landing-mock__row">
            <span className="landing-mock__tag landing-mock__tag--muted">Do</span>
            <span className="landing-mock__time">11:00</span>
          </div>
          <p className="landing-mock__title">Sevenhill Cellars</p>
          <p className="landing-mock__meta">Sevenhill, SA · Est. 1851</p>
        </div>
      </div>
      <div className="landing-mock__card">
        <img className="landing-mock__photo" src="/trip-photos/skillogalee.jpg" alt="" />
        <div className="landing-mock__body">
          <div className="landing-mock__row">
            <span className="landing-mock__tag">Eat</span>
            <span className="landing-mock__time">2:30pm</span>
          </div>
          <p className="landing-mock__title">Skillogalee — tasting menu lunch</p>
          <p className="landing-mock__meta">Clare, SA · Confirmed</p>
        </div>
      </div>
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
          <PlanPreview />
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
