import type { Theme } from "../../theme";
import { INBOX, PEOPLE, ROLE_COLORS, ROLE_RULES, type Role } from "./trip-data";

export function PeopleTab({
  role,
  onOpenSuggestion,
  theme,
}: {
  role: Role;
  onOpenSuggestion: (dayIndex: number) => void;
  theme: Theme;
}) {
  return (
    <div className="trip-page__stack trip-page__tab-panel">
      <div className="people" style={{ background: theme.card, borderColor: theme.line }}>
        <div className="people__head">
          <span
            className="wf-card__eyebrow"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            Five people
          </span>
          <span
            className="people__note"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            {role === "Organiser" ? "You set roles" : "Organiser sets roles"}
          </span>
        </div>
        {PEOPLE.map((person) => (
          <div key={person.initials} className="people__row">
            <div
              className="people__avatar"
              style={{ fontFamily: theme.fontMono, color: theme.body }}
            >
              {person.initials}
            </div>
            <div className="people__who">
              <span className="people__name" style={{ color: theme.ink }}>
                {person.name}
              </span>
              <span className="people__detail" style={{ color: theme.body }}>
                {person.note}
              </span>
            </div>
            <span
              className="people__role"
              style={{
                fontFamily: theme.fontMono,
                color: ROLE_COLORS[person.role].ink,
                background: ROLE_COLORS[person.role].bg,
              }}
            >
              {person.role}
            </span>
          </div>
        ))}
      </div>

      <div className="inbox">
        <div className="inbox__head">
          <span className="inbox__eyebrow" style={{ fontFamily: theme.fontMono }}>
            Suggestions waiting
          </span>
          <span className="inbox__count" style={{ fontFamily: theme.fontMono }}>
            {INBOX.length}
          </span>
        </div>
        {INBOX.map((suggestion) => (
          <button
            key={suggestion.title}
            type="button"
            className="trip-page__reset inbox__item"
            onClick={() => onOpenSuggestion(suggestion.day)}
            style={{ background: theme.card }}
          >
            <span className="inbox__title" style={{ color: theme.ink }}>
              {suggestion.title}
            </span>
            <span
              className="inbox__meta"
              style={{ fontFamily: theme.fontMono, color: theme.body }}
            >
              {suggestion.meta}
            </span>
            <span className="inbox__note" style={{ color: theme.body }}>
              {suggestion.note}
            </span>
          </button>
        ))}
      </div>

      <div
        className="wf-card wf-card--pad roles"
        style={{ background: theme.card, borderColor: theme.line, padding: "15px 16px" }}
      >
        <div
          className="wf-card__eyebrow"
          style={{ fontFamily: theme.fontMono, color: theme.meta }}
        >
          What each role can do
        </div>
        {ROLE_RULES.map((rule) => (
          <div key={rule.role} className="roles__rule">
            <span
              className="roles__role"
              style={{ fontFamily: theme.fontMono, color: theme.ink }}
            >
              {rule.role}
            </span>
            <span className="roles__detail" style={{ color: theme.body }}>
              {rule.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
