import { useEffect, useState } from "react";
import { ThemeProvider, type Theme } from "../../theme";
import {
  adminCreateAgency,
  adminListAccounts,
  adminListAgencies,
  adminListTrips,
  type AdminAccountRow,
  type AdminAgencyRow,
  type AdminTripRow,
} from "./admin-data";
import "../trip/trip-page.css";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function AdminPage({ onBack, theme }: { onBack: () => void; theme: Theme }) {
  const [accounts, setAccounts] = useState<AdminAccountRow[]>();
  const [trips, setTrips] = useState<AdminTripRow[]>();
  const [agencies, setAgencies] = useState<AdminAgencyRow[]>();
  const [error, setError] = useState<string>();
  /* Accounts an agency grant is in flight for — disables the button so a
     slow network can't fire two grants off one tap. */
  const [granting, setGranting] = useState<Set<string>>(new Set());

  function load() {
    return Promise.all([adminListAccounts(), adminListTrips(), adminListAgencies()]).then(
      ([acc, trp, ag]) => {
        setAccounts(acc);
        setTrips(trp);
        setAgencies(ag);
      },
    );
  }

  useEffect(() => {
    let cancelled = false;
    load().catch(() => {
      if (!cancelled) setError("Couldn't load admin data.");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function grantAgency(account: AdminAccountRow) {
    setGranting((prev) => new Set(prev).add(account.id));
    const name = `${account.name || account.mobile || "New"}'s Agency`;
    adminCreateAgency(account.id, name)
      .then(load)
      .catch(() => setError("Couldn't grant agency access."))
      .finally(() => {
        setGranting((prev) => {
          const next = new Set(prev);
          next.delete(account.id);
          return next;
        });
      });
  }

  const agencyOwnerIds = new Set(agencies?.map((a) => a.ownerAccountId));
  const labelStyle = { fontFamily: theme.fontMono, color: theme.meta };
  const rowStyle = { background: theme.card, borderColor: theme.line };

  return (
    <ThemeProvider theme={theme} className="trip-page" style={{ background: theme.bg, color: theme.ink }}>
      <div className="trip-page__head" style={{ background: theme.headBg, color: theme.headInk }}>
        <div className="trip-page__head-row">
          <button
            type="button"
            className="trip-page__reset trip-page__wordmark"
            onClick={onBack}
            style={{ fontFamily: theme.fontDisplay, letterSpacing: theme.wordTrack }}
          >
            ← {theme.wordmark}
          </button>
        </div>
        <div className="trip-page__head-main">
          <div>
            <div className="trip-page__dates" style={{ fontFamily: theme.fontMono, color: theme.headMeta }}>
              {accounts && trips && agencies
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
              <span style={{ fontFamily: theme.fontMono, color: theme.body, fontSize: "12px" }}>
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
                    onClick={() => grantAgency(a)}
                    disabled={granting.has(a.id)}
                    style={{ fontFamily: theme.fontMono, color: theme.accent, fontSize: "12px", alignSelf: "flex-start" }}
                  >
                    {granting.has(a.id) ? "Granting…" : "Grant agency access"}
                  </button>
                ))}
            </div>
          ))}

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
              <span style={{ fontFamily: theme.fontMono, color: theme.body, fontSize: "12px" }}>
                owner {ag.ownerMobile || ag.ownerAccountId.slice(0, 8)} · {ag.agentCount}{" "}
                {ag.agentCount === 1 ? "member" : "members"}
              </span>
            </div>
          ))}
          {agencies?.length === 0 && (
            <div className="empty-day" style={{ borderColor: theme.line, color: theme.body }}>
              <span className="empty-day__note">
                No agencies yet — grant one from the Accounts list above.
              </span>
            </div>
          )}

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
              <span style={{ fontFamily: theme.fontMono, color: theme.body, fontSize: "12px" }}>
                {t.dates} · owner {t.ownerMobile || t.ownerId.slice(0, 8)} · {t.memberCount}{" "}
                {t.memberCount === 1 ? "member" : "members"}
                {t.agencyId ? " · agency trip" : ""}
                {t.fromExample ? " · example" : ""}
              </span>
            </div>
          ))}

          {accounts?.length === 0 && (
            <div className="empty-day" style={{ borderColor: theme.line, color: theme.body }}>
              <span className="empty-day__note">Nothing here yet.</span>
            </div>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
