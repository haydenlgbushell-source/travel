import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeProvider, type Theme } from "../../theme";
import {
  adminCreateAgency,
  adminListAccounts,
  adminListAgencies,
  adminListTrips,
  adminRevokeAgency,
  type AdminAccountRow,
  type AdminAgencyRow,
  type AdminTripRow,
} from "./admin-data";
import "../trip/trip-page.css";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function AdminPage({ onBack, theme }: { onBack: () => void; theme: Theme }) {
  const [accounts, setAccounts] = useState<AdminAccountRow[]>();
  const [trips, setTrips] = useState<AdminTripRow[]>();
  const [agencies, setAgencies] = useState<AdminAgencyRow[]>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  /* Which agency the admin has tapped Revoke on but not yet confirmed —
     it detaches every client trip in it, so it asks first, the same way
     deleting a trip does on the trips list. */
  const [confirmingRevoke, setConfirmingRevoke] = useState<string>();

  /* The refresh after a grant or revoke resolves long after the effect that
     started the first load, so a plain `cancelled` local wouldn't cover it —
     every path checks this one ref before touching state. */
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const [acc, trp, ag] = await Promise.all([
        adminListAccounts(),
        adminListTrips(),
        adminListAgencies(),
      ]);
      if (!alive.current) return;
      setAccounts(acc);
      setTrips(trp);
      setAgencies(ag);
      setError(undefined);
    } catch {
      if (!alive.current) return;
      /* Fall back to empty lists rather than leaving these undefined — the
         header would otherwise read "Loading…" forever beside the error,
         with no empty state and no way to retry. */
      setAccounts((prev) => prev ?? []);
      setTrips((prev) => prev ?? []);
      setAgencies((prev) => prev ?? []);
      setError("Couldn't load admin data.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function grantAgency(account: AdminAccountRow) {
    setBusy(true);
    setError(undefined);
    const name = `${account.name || account.mobile || "New"}'s Agency`;
    try {
      await adminCreateAgency(account.id, name);
    } catch {
      if (alive.current) setError("Couldn't grant agency access.");
      if (alive.current) setBusy(false);
      return;
    }
    /* The grant already succeeded — a failure past this point is the
       refresh failing, which must not be reported as a failed grant. */
    await load();
    if (alive.current) setBusy(false);
  }

  async function revokeAgency(agencyId: string) {
    setBusy(true);
    setError(undefined);
    setConfirmingRevoke(undefined);
    try {
      await adminRevokeAgency(agencyId);
    } catch {
      if (alive.current) setError("Couldn't revoke agency access.");
      if (alive.current) setBusy(false);
      return;
    }
    await load();
    if (alive.current) setBusy(false);
  }

  const agencyOwnerIds = new Set(agencies?.map((a) => a.ownerAccountId));
  const loaded = accounts !== undefined && trips !== undefined && agencies !== undefined;
  const labelStyle = { fontFamily: theme.fontMono, color: theme.meta };
  const rowStyle = { background: theme.card, borderColor: theme.line };
  const metaStyle = { fontFamily: theme.fontMono, color: theme.body, fontSize: "12px" };

  function emptyNote(note: string) {
    return (
      <div className="empty-day" style={{ borderColor: theme.line, color: theme.body }}>
        <span className="empty-day__note">{note}</span>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme} className="trip-page" style={{ background: theme.bg, color: theme.ink }}>
      <div className="trip-page__head" style={{ background: theme.headBg, color: theme.headInk }}>
        <div
          className="trip-page__head-row"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <button
            type="button"
            className="trip-page__reset trip-page__wordmark"
            onClick={onBack}
            style={{ fontFamily: theme.fontDisplay, letterSpacing: theme.wordTrack }}
          >
            ← {theme.wordmark}
          </button>
          <button
            type="button"
            className="trip-page__reset"
            onClick={() => void load()}
            disabled={busy}
            style={{ fontFamily: theme.fontMono, color: theme.headMeta, fontSize: "12px" }}
          >
            {busy ? "Working…" : "Refresh"}
          </button>
        </div>
        <div className="trip-page__head-main">
          <div>
            <div className="trip-page__dates" style={{ fontFamily: theme.fontMono, color: theme.headMeta }}>
              {loaded
                ? `${accounts.length} accounts · ${trips.length} trips · ${agencies.length} agencies`
                : "Loading…"}
            </div>
            <div className="trip-page__name" style={{ fontFamily: theme.fontDisplay }}>
              Admin
            </div>
          </div>
        </div>
      </div>

      <div className="trip-page__body">
        <div className="trip-page__stack">
          {error && (
            <div className="empty-day" style={{ borderColor: theme.line, color: theme.body }}>
              <span className="empty-day__note">{error}</span>
              <button
                type="button"
                className="trip-page__reset trip-card__action"
                onClick={() => void load()}
                style={{ fontFamily: theme.fontMono, color: theme.accent }}
              >
                Try again
              </button>
            </div>
          )}

          <span className="wf-card__eyebrow" style={labelStyle}>
            Accounts
          </span>
          {accounts?.map((a) => (
            <div key={a.id} className="wf-card wf-card--pad" style={{ ...rowStyle, gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                <span style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
                  {a.name || (a.isAnonymous ? "Guest" : "No name yet")}
                </span>
                <span style={{ fontFamily: theme.fontMono, color: theme.meta, fontSize: "12px" }}>
                  {formatDate(a.createdAt)}
                </span>
              </div>
              <span style={metaStyle}>
                {a.isAnonymous
                  ? "Guest (access code)"
                  : `${a.mobile || "no mobile"} · ${a.email}${a.emailConfirmedAt ? "" : " · unconfirmed"}`}
              </span>
              {!a.isAnonymous &&
                (agencyOwnerIds.has(a.id) ? (
                  <span style={{ fontFamily: theme.fontMono, color: theme.accent, fontSize: "12px" }}>
                    Has agency access
                  </span>
                ) : (
                  <button
                    type="button"
                    className="trip-page__reset trip-card__action"
                    onClick={() => void grantAgency(a)}
                    disabled={busy}
                    style={{
                      fontFamily: theme.fontMono,
                      color: theme.accent,
                      fontSize: "12px",
                      alignSelf: "flex-start",
                    }}
                  >
                    Grant agency access
                  </button>
                ))}
            </div>
          ))}
          {loaded && accounts.length === 0 && emptyNote("No accounts yet.")}

          <span className="wf-card__eyebrow" style={{ ...labelStyle, marginTop: "8px" }}>
            Agencies
          </span>
          {agencies?.map((ag) => (
            <div key={ag.id} className="wf-card wf-card--pad" style={{ ...rowStyle, gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                <span style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>{ag.name}</span>
                <span style={{ fontFamily: theme.fontMono, color: theme.meta, fontSize: "12px" }}>
                  {formatDate(ag.createdAt)}
                </span>
              </div>
              <span style={metaStyle}>
                owner {ag.ownerMobile || ag.ownerAccountId.slice(0, 8)} · {ag.agentCount}{" "}
                {ag.agentCount === 1 ? "member" : "members"}
              </span>
              {confirmingRevoke === ag.id ? (
                <div className="trip-card__actions">
                  <span className="trip-card__warn" style={{ color: theme.body }}>
                    Revoke access? Its client trips stay, as ordinary trips.
                  </span>
                  <button
                    type="button"
                    className="trip-page__reset trip-card__action"
                    onClick={() => void revokeAgency(ag.id)}
                    disabled={busy}
                    style={{ fontFamily: theme.fontMono, color: "oklch(0.5 0.16 25)" }}
                  >
                    Revoke
                  </button>
                  <button
                    type="button"
                    className="trip-page__reset trip-card__action"
                    onClick={() => setConfirmingRevoke(undefined)}
                    style={{ fontFamily: theme.fontMono, color: theme.body }}
                  >
                    Keep
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="trip-page__reset trip-card__action"
                  onClick={() => setConfirmingRevoke(ag.id)}
                  disabled={busy}
                  style={{
                    fontFamily: theme.fontMono,
                    color: theme.body,
                    fontSize: "12px",
                    alignSelf: "flex-start",
                  }}
                >
                  Revoke agency access
                </button>
              )}
            </div>
          ))}
          {loaded && agencies.length === 0 && emptyNote("No agencies yet — grant one from the Accounts list above.")}

          <span className="wf-card__eyebrow" style={{ ...labelStyle, marginTop: "8px" }}>
            Trips
          </span>
          {trips?.map((t) => (
            <div key={t.id} className="wf-card wf-card--pad" style={{ ...rowStyle, gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                <span style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>{t.name}</span>
                <span style={{ fontFamily: theme.fontMono, color: theme.meta, fontSize: "12px" }}>
                  {formatDate(t.createdAt)}
                </span>
              </div>
              <span style={metaStyle}>
                {t.dates} · owner {t.ownerMobile || t.ownerId.slice(0, 8)} · {t.memberCount}{" "}
                {t.memberCount === 1 ? "member" : "members"}
                {t.agencyId ? " · agency trip" : ""}
                {t.fromExample ? " · example" : ""}
              </span>
            </div>
          ))}
          {loaded && trips.length === 0 && emptyNote("No trips yet.")}
        </div>
      </div>
    </ThemeProvider>
  );
}
