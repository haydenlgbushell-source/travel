import { useState, type ReactNode } from "react";
import type { Theme } from "../../theme";
import { Sheet } from "./Sheet";
import { ShareIcon } from "./NavIcons";
import { currentHomeScreenState, type HomeScreenState } from "./device";

interface Step {
  title: string;
  body: ReactNode;
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
      title: "Suggest, vote, done",
      body: (
        <p className="intro__p">
          Anyone can suggest a stop — an editor approves it before it's part of the real plan. Open{" "}
          <strong>Decisions</strong> from the bottom bar to see what's waiting on a vote.
        </p>
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
