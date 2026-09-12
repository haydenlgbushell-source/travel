import { useState, type ReactNode } from "react";
import type { Theme } from "../../theme";
import { Sheet } from "./Sheet";
import { ShareIcon } from "./NavIcons";
import { currentHomeScreenState, type HomeScreenState } from "./device";

interface Step {
  title: string;
  body: ReactNode;
}

/** A dot with two fading motion-trails behind it — reads as "drag this
 *  way" without needing to draw an actual hand. Used once, only in the
 *  swipe-days demo below, so it lives here rather than in NavIcons.tsx. */
function SwipeGlyph() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle cx="17" cy="13" r="3.6" fill="currentColor" />
      <path
        d="M10.5 8.5c-1.7 1.2-2.7 3-2.7 4.5s1 3.3 2.7 4.5"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M6 6.5c-2.3 1.8-3.8 4.4-3.8 6.5s1.5 4.7 3.8 6.5"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity="0.28"
      />
    </svg>
  );
}

/** Three day-strip-shaped pills with the glyph above sliding across them on
 *  a loop — the guide's one purely visual step. A sentence can say "swipe
 *  left for the next day"; showing the motion is what actually lands it.
 *  Decorative only (the text beside it carries the real explanation), so
 *  it's hidden from assistive tech rather than read as three meaningless
 *  day labels. */
function SwipeDemo() {
  return (
    <div className="intro__swipe" aria-hidden="true">
      <div className="intro__swipe-track">
        <span className="intro__swipe-pill">MON 14</span>
        <span className="intro__swipe-pill intro__swipe-pill--active">TUE 15</span>
        <span className="intro__swipe-pill">WED 16</span>
      </div>
      <span className="intro__swipe-hand">
        <SwipeGlyph />
      </span>
    </div>
  );
}

/** The click-through's content. A pure function of the trip and the
 *  device, rather than JSX baked into the component below, so what each
 *  step actually says can be reasoned about — and this can grow to more
 *  than six steps — without touching the paging mechanics. */
function buildSteps(tripName: string, tripDates: string, homeScreen: HomeScreenState): Step[] {
  return [
    {
      title: tripName,
      body: <p className="intro__p">{tripDates}. A few quick things about how this works — takes less than a minute.</p>,
    },
    {
      title: homeScreen === "already-installed" ? "You're already set" : "Add it to your Home Screen",
      body:
        homeScreen === "already-installed" ? (
          <p className="intro__p">Looks like you're already using the installed app — skip ahead.</p>
        ) : homeScreen === "iphone" ? (
          <>
            <ol className="intro__steps">
              <li>
                <span className="intro__step-row">
                  <span className="intro__step-icon">
                    <ShareIcon />
                  </span>
                  Tap the <strong>Share</strong> icon in Safari's toolbar
                </span>
              </li>
              <li>
                Scroll down and tap <strong>Add to Home Screen</strong>
              </li>
              <li>
                Tap <strong>Add</strong> — that's it
              </li>
            </ol>
            <p className="intro__p intro__p--note">
              It opens like a real app from here — no browser bar, no typing the address in again. Has
              to be done in Safari, not another browser.
            </p>
          </>
        ) : (
          <p className="intro__p">
            On an iPhone, open this in Safari and use the Share icon →{" "}
            <strong>Add to Home Screen</strong>. On Android, look for <strong>Add to Home screen</strong>{" "}
            in Chrome's menu.
          </p>
        ),
    },
    {
      title: "Every day, at a glance",
      body: (
        <p className="intro__p">
          Check-ins, meals, drives, things to do — in order on the <strong>Plan</strong> tab. Tap{" "}
          <strong>Maps</strong> on any card to navigate straight there.
        </p>
      ),
    },
    {
      title: "Bookings and costs, sorted",
      body: (
        <p className="intro__p">
          Confirmations and flights live on their own <strong>Stay & travel</strong> tab, so they're not
          buried in the day list. <strong>Money</strong> splits every cost across the group automatically
          — switch currency any time.
        </p>
      ),
    },
    {
      title: "No signal? Offline mode",
      body: (
        <p className="intro__p">
          Tap <strong>Offline</strong> in the header for one screen with every time, place and booking
          reference on it — built for exactly the stretch with no coverage.
        </p>
      ),
    },
    {
      title: "Swipe between days",
      body: (
        <>
          <SwipeDemo />
          <p className="intro__p">
            On the <strong>Plan</strong> tab, swipe left on the day itself to move to the next
            one, right to go back — same as tapping a day up top, just without reaching for it.
          </p>
        </>
      ),
    },
  ];
}

/** A first-open, click-through orientation: how to add the app to an
 *  iPhone Home Screen, then a quick tour of what's actually on the trip.
 *  Shown once automatically (TripPage gates that on a seen-flag) and
 *  reachable afterwards from More — dismissing it early is meant to work
 *  exactly like finishing it, not to forfeit ever seeing it again. */
export function IntroGuide({
  tripName,
  tripDates,
  theme,
  onClose,
}: {
  tripName: string;
  tripDates: string;
  theme: Theme;
  onClose: () => void;
}) {
  const [homeScreen] = useState(currentHomeScreenState);
  const [index, setIndex] = useState(0);
  const steps = buildSteps(tripName, tripDates, homeScreen);
  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  return (
    <Sheet title={step.title} className="intro" onClose={onClose} theme={theme}>
      <div className="intro__body">{step.body}</div>

      <div className="intro__progress">
        <span className="intro__count" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
          {index + 1} / {steps.length}
        </span>
        <div className="intro__dots">
          {steps.map((s, i) => (
            <span
              key={s.title}
              className="intro__dot"
              style={{ background: i === index ? theme.accent : theme.line }}
            />
          ))}
        </div>
      </div>

      <div className="intro__actions">
        <button
          type="button"
          className="trip-page__reset intro__back"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={isFirst}
          style={{ fontFamily: theme.fontMono, color: theme.body }}
        >
          Back
        </button>
        <button
          type="button"
          className="trip-page__reset intro__next"
          onClick={() => (isLast ? onClose() : setIndex((i) => i + 1))}
          style={{ fontFamily: theme.fontMono, background: theme.accent, color: theme.btnInk }}
        >
          {isLast ? "Got it, let's go" : "Next"}
        </button>
      </div>
    </Sheet>
  );
}
