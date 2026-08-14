import type { Theme } from "../../theme";
import { DECISIONS } from "./trip-data";

export function DecisionsSheet({
  voted,
  onVote,
  onClose,
  theme,
}: {
  voted: boolean;
  onVote: () => void;
  onClose: () => void;
  theme: Theme;
}) {
  const poll = [
    { label: "Ramiro", votes: voted ? "3" : "2", width: voted ? "60%" : "40%" },
    { label: "Cervejaria Liberdade", votes: "2", width: "40%" },
    { label: "A Cevicheria", votes: voted ? "0" : "1", width: voted ? "0%" : "20%" },
  ];

  return (
    <>
      <div className="sheet__scrim" onClick={onClose} />
      <div className="sheet" style={{ background: theme.bg }}>
        <div className="sheet__grabber" />

        <div className="sheet__head">
          <span
            className="sheet__title"
            style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
          >
            Needs a decision
          </span>
          <button
            type="button"
            className="trip-page__reset sheet__close"
            onClick={onClose}
            style={{ fontFamily: theme.fontMono, color: theme.body }}
          >
            Close
          </button>
        </div>

        {DECISIONS.map((decision) => (
          <div
            key={decision.text}
            className="sheet__decision"
            style={{ background: theme.card, borderColor: theme.line }}
          >
            <span className="sheet__decision-text" style={{ color: theme.ink }}>
              {decision.text}
            </span>
            <span
              className="sheet__decision-due"
              style={{ fontFamily: theme.fontMono, color: decision.dueColor }}
            >
              {decision.due}
            </span>
          </div>
        ))}

        <div className="sheet__poll">
          <span
            className="sheet__poll-eyebrow"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            Sunday dinner
          </span>
          {poll.map((option) => (
            <div
              key={option.label}
              className="poll-option"
              style={{ background: theme.card, borderColor: theme.line }}
            >
              <span className="poll-option__fill" style={{ width: option.width }} />
              <span className="poll-option__label" style={{ color: theme.ink }}>
                {option.label}
              </span>
              <span
                className="poll-option__votes"
                style={{ fontFamily: theme.fontMono, color: theme.body }}
              >
                {option.votes}
              </span>
            </div>
          ))}
          <button
            type="button"
            className="trip-page__reset sheet__vote"
            onClick={onVote}
            style={{ color: theme.btnInk, background: theme.accent }}
          >
            {voted ? "Vote counted" : "Cast your vote"}
          </button>
        </div>
      </div>
    </>
  );
}
