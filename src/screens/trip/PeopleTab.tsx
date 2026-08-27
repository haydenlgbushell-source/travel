import { useEffect, useState } from "react";
import type { Theme } from "../../theme";
import {
  INBOX,
  ROLE_COLORS,
  ROLE_RULES,
  loadAccessCodes,
  revokeAccessCode,
  type AccessCode,
  type Person,
  type Role,
} from "./trip-data";

const ROLES: Role[] = ["Organiser", "Editor", "Contributor"];

const COUNT_WORD = ["Nobody", "One person", "Two people", "Three people", "Four people", "Five people"];

interface Suggestion {
  /** The proposed item's own id — two suggestions can share a title. */
  id: string;
  title: string;
  meta: string;
  note: string;
  day: number;
}

type ShareableRole = "Editor" | "Contributor";

export function PeopleTab({
  role,
  onRoleChange,
  onOpenSuggestion,
  members,
  pendingSuggestions,
  onCreateInvite,
  onCreateAccessCode,
  tripId,
  isExample,
  theme,
}: {
  role: Role;
  onRoleChange: (role: Role) => void;
  onOpenSuggestion: (dayIndex: number) => void;
  members: Person[];
  /** Real trips only — the example uses its own authored INBOX below. */
  pendingSuggestions: Suggestion[];
  /** Creates an invite link for the given role and resolves to its full
   *  shareable URL. Only ever called from the Organiser-only button below,
   *  but the real gate is RLS on trip_invites, not this UI. */
  onCreateInvite: (role: ShareableRole) => Promise<string>;
  /** Same shape, but the resulting link needs no account at all to open —
   *  it signs the opener into an anonymous session automatically. */
  onCreateAccessCode: (role: ShareableRole) => Promise<string>;
  /** Needed to list the codes already issued for this trip — absent on the
   *  authored example, which has no real ones. */
  tripId?: string;
  isExample: boolean;
  theme: Theme;
}) {
  const [busy, setBusy] = useState<`${"invite" | "code"}:${ShareableRole}` | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [codes, setCodes] = useState<AccessCode[]>([]);

  const canManage = !isExample && role === "Organiser" && tripId !== undefined;

  /* Reloaded after every issue/revoke so the list is the real server state
     rather than something patched up locally. */
  useEffect(() => {
    if (!canManage || !tripId) return;
    let cancelled = false;
    loadAccessCodes(tripId)
      .then((list) => {
        if (!cancelled) setCodes(list);
      })
      .catch(() => {
        if (!cancelled) setCodes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [canManage, tripId, status]);

  async function revoke(id: string) {
    try {
      await revokeAccessCode(id);
      if (tripId) setCodes(await loadAccessCodes(tripId));
    } catch {
      setStatus("Couldn't revoke that code.");
    }
  }

  /* Suggestions waiting are part of the authored example — a real trip
     shows whatever's actually pending from proposeItem. */
  const inbox = isExample ? INBOX : pendingSuggestions;

  async function share(kind: "invite" | "code", shareRole: ShareableRole) {
    setBusy(`${kind}:${shareRole}`);
    setStatus(undefined);
    try {
      const url = await (kind === "invite" ? onCreateInvite : onCreateAccessCode)(shareRole);
      const noun = kind === "invite" ? "invite it as" : "join in, no account needed, as";
      if (navigator.share) {
        try {
          await navigator.share({ title: "Join the trip", url });
          setStatus(undefined);
          return;
        } catch {
          /* dismissed — fall through to copying */
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        setStatus(`Link copied — share it with whoever you're ${noun} ${shareRole.toLowerCase()}.`);
      } catch {
        setStatus(url);
      }
    } catch {
      setStatus(`Couldn't create that ${kind === "invite" ? "invite" : "link"} — try again in a moment.`);
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <div className="trip-page__stack trip-page__tab-panel">
      <div className="people" style={{ background: theme.card, borderColor: theme.line }}>
        <div className="people__head">
          <span
            className="wf-card__eyebrow"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            {COUNT_WORD[members.length] ?? `${members.length} people`}
          </span>
          <span
            className="people__note"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            {role === "Organiser" ? "You set roles" : "Organiser sets roles"}
          </span>
        </div>
        {members.map((person) => (
          <div key={person.id} className="people__row">
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

      {!isExample && role === "Organiser" && (
        <div
          className="wf-card wf-card--pad"
          style={{ background: theme.card, borderColor: theme.line, gap: "8px" }}
        >
          <span
            className="wf-card__eyebrow"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            Invite someone
          </span>
          <div className="kind-picker">
            <button
              type="button"
              className="trip-page__reset kind-picker__option"
              disabled={busy !== undefined}
              onClick={() => share("invite", "Editor")}
              style={{ background: theme.card, borderColor: theme.line, color: theme.body }}
            >
              {busy === "invite:Editor" ? "Creating…" : "As an editor"}
            </button>
            <button
              type="button"
              className="trip-page__reset kind-picker__option"
              disabled={busy !== undefined}
              onClick={() => share("invite", "Contributor")}
              style={{ background: theme.card, borderColor: theme.line, color: theme.body }}
            >
              {busy === "invite:Contributor" ? "Creating…" : "To suggest only"}
            </button>
          </div>

          <span
            className="wf-card__eyebrow"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            Client link — no account needed
          </span>
          <div className="kind-picker">
            <button
              type="button"
              className="trip-page__reset kind-picker__option"
              disabled={busy !== undefined}
              onClick={() => share("code", "Editor")}
              style={{ background: theme.card, borderColor: theme.line, color: theme.body }}
            >
              {busy === "code:Editor" ? "Creating…" : "Editor access"}
            </button>
            <button
              type="button"
              className="trip-page__reset kind-picker__option"
              disabled={busy !== undefined}
              onClick={() => share("code", "Contributor")}
              style={{ background: theme.card, borderColor: theme.line, color: theme.body }}
            >
              {busy === "code:Contributor" ? "Creating…" : "Suggest only"}
            </button>
          </div>

          {status && (
            <span
              className="add-sheet__hint"
              style={{ fontFamily: theme.fontMono, color: theme.meta }}
            >
              {status}
            </span>
          )}

          {codes.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
              <span
                className="wf-card__eyebrow"
                style={{ fontFamily: theme.fontMono, color: theme.meta }}
              >
                Codes you've issued
              </span>
              {codes.map((c) => {
                const expired = new Date(c.expiresAt).getTime() < Date.now();
                const usedUp = c.maxUses !== undefined && c.useCount >= c.maxUses;
                const dead = c.revokedAt !== undefined || expired || usedUp;
                return (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      opacity: dead ? 0.55 : 1,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: theme.fontMono,
                        fontSize: "12px",
                        color: theme.body,
                      }}
                    >
                      <strong style={{ color: theme.ink, letterSpacing: ".08em" }}>{c.code}</strong>
                      {" · "}
                      {c.role}
                      {" · "}
                      {c.useCount} {c.useCount === 1 ? "use" : "uses"}
                      {c.maxUses !== undefined ? ` of ${c.maxUses}` : ""}
                      {c.revokedAt ? " · revoked" : expired ? " · expired" : usedUp ? " · used up" : ""}
                    </span>
                    {!dead && (
                      <button
                        type="button"
                        className="trip-page__reset trip-card__action"
                        onClick={() => void revoke(c.id)}
                        style={{ fontFamily: theme.fontMono, color: "oklch(0.5 0.16 25)", fontSize: "12px" }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                );
              })}
              <span
                className="add-sheet__hint"
                style={{ fontFamily: theme.fontMono, color: theme.meta }}
              >
                Revoking stops the code working from now on — anyone already on the
                trip stays.
              </span>
            </div>
          )}
        </div>
      )}

      {inbox.length > 0 && (
      <div className="inbox">
        <div className="inbox__head">
          <span className="inbox__eyebrow" style={{ fontFamily: theme.fontMono }}>
            Suggestions waiting
          </span>
          <span className="inbox__count" style={{ fontFamily: theme.fontMono }}>
            {inbox.length}
          </span>
        </div>
        {inbox.map((suggestion) => (
          <button
            key={suggestion.id}
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
      )}

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

        {isExample && (
          <div className="role-switch">
            <span
              className="wf-card__eyebrow"
              style={{ fontFamily: theme.fontMono, color: theme.meta }}
            >
              View as
            </span>
            {ROLES.map((r) => {
              const on = r === role;
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  className="trip-page__reset role-switch__option"
                  onClick={() => onRoleChange(r)}
                  style={{
                    fontFamily: theme.fontMono,
                    background: on ? theme.ink : theme.card,
                    borderColor: on ? theme.ink : theme.line,
                    color: on ? theme.bg : theme.body,
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
        )}

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
