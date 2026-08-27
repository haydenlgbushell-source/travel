import type { Theme } from "../../theme";
import { Sheet } from "./Sheet";

const ENTRIES = [
  { label: "Money", note: "Shared spend, the day-by-day split and who owes who" },
  { label: "People", note: "Roles, invites and any suggestions waiting on an editor" },
];

export function MoreSheet({
  onOpen,
  pendingCount,
  onClose,
  notifyEnabled,
  notifySupported,
  notifyBlocked,
  onToggleNotify,
  userName,
  onOpenTrips,
  onSignOut,
  theme,
}: {
  onOpen: (label: string) => void;
  /** Suggestions actually waiting on an editor for *this* trip. This used to
   *  read the example trip's hardcoded INBOX, so every real trip carried a
   *  permanent "2" for suggestions that didn't exist. */
  pendingCount: number;
  onClose: () => void;
  notifyEnabled: boolean;
  notifySupported: boolean;
  notifyBlocked: boolean;
  onToggleNotify: () => void;
  userName?: string;
  onOpenTrips: () => void;
  onSignOut: () => void;
  theme: Theme;
}) {
  const notifyNote = !notifySupported
    ? "Not supported in this browser."
    : notifyBlocked
      ? "Blocked — allow notifications for this site in your browser settings."
      : "Reminders 30 minutes before each item — only while this tab stays open, since there's no server to deliver them once it's closed.";

  return (
    <Sheet title="More" onClose={onClose} theme={theme}>
      {ENTRIES.map((entry) => (
        <button
          key={entry.label}
          type="button"
          className="trip-page__reset more-sheet__item"
          onClick={() => onOpen(entry.label)}
          style={{ background: theme.card, borderColor: theme.line }}
        >
          <span className="more-sheet__row">
            <span className="more-sheet__label" style={{ color: theme.ink }}>
              {entry.label}
            </span>
            {entry.label === "People" && pendingCount > 0 && (
              <span
                className="trip-page__decisions-count"
                style={{ background: theme.accent, color: theme.btnInk }}
              >
                {pendingCount}
              </span>
            )}
          </span>
          <span className="more-sheet__note" style={{ color: theme.body }}>
            {entry.note}
          </span>
        </button>
      ))}

      <button
        type="button"
        className="trip-page__reset more-sheet__item"
        onClick={onToggleNotify}
        disabled={!notifySupported || notifyBlocked}
        style={{ background: theme.card, borderColor: theme.line }}
      >
        <span className="more-sheet__row">
          <span className="more-sheet__label" style={{ color: theme.ink }}>
            Notifications
          </span>
          <span
            className="more-sheet__toggle"
            style={{
              background: notifyEnabled ? theme.accent : theme.line,
            }}
          >
            <span
              className="more-sheet__toggle-knob"
              style={{ transform: notifyEnabled ? "translateX(16px)" : "translateX(0)" }}
            />
          </span>
        </span>
        <span className="more-sheet__note" style={{ color: theme.body }}>
          {notifyNote}
        </span>
      </button>

      <button
        type="button"
        className="trip-page__reset more-sheet__item"
        onClick={onOpenTrips}
        style={{ background: theme.card, borderColor: theme.line }}
      >
        <span className="more-sheet__row">
          <span className="more-sheet__label" style={{ color: theme.ink }}>
            Your trips
          </span>
        </span>
        <span className="more-sheet__note" style={{ color: theme.body }}>
          Switch between trips, start another, or edit this one's dates
        </span>
      </button>

      <div className="more-sheet__account">
        <span className="more-sheet__note" style={{ color: theme.body }}>
          {userName ? `Signed in as ${userName}` : "Signed in"}
        </span>
        <button
          type="button"
          className="trip-page__reset more-sheet__signout"
          onClick={onSignOut}
          style={{ fontFamily: theme.fontMono, color: theme.accent }}
        >
          Sign out
        </button>
      </div>
    </Sheet>
  );
}
