import type { Theme } from "../../theme";
import { Sheet } from "./Sheet";
import { INBOX } from "./trip-data";

const ENTRIES = [
  { label: "Money", note: "Shared spend, the day-by-day split and who owes who" },
  { label: "People", note: "Roles, invites and any suggestions waiting on an editor" },
];

export function MoreSheet({
  onOpen,
  onClose,
  theme,
}: {
  onOpen: (label: string) => void;
  onClose: () => void;
  theme: Theme;
}) {
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
            {entry.label === "People" && INBOX.length > 0 && (
              <span
                className="trip-page__decisions-count"
                style={{ background: theme.accent, color: theme.btnInk }}
              >
                {INBOX.length}
              </span>
            )}
          </span>
          <span className="more-sheet__note" style={{ color: theme.body }}>
            {entry.note}
          </span>
        </button>
      ))}
    </Sheet>
  );
}
