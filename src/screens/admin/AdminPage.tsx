import { useEffect, useState } from "react";
import { ThemeProvider, type Theme } from "../../theme";
import { adminListAccounts, adminListTrips, type AdminAccountRow, type AdminTripRow } from "./admin-data";
import "../trip/trip-page.css";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function AdminPage({ onBack, theme }: { onBack: () => void; theme: Theme }) {
  const [accounts, setAccounts] = useState<AdminAccountRow[]>();
  const [trips, setTrips] = useState<AdminTripRow[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminListAccounts(), adminListTrips()])
      .then(([acc, trp]) => {
        if (cancelled) return;
        setAccounts(acc);
        setTrips(trp);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load admin data.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
              {accounts && trips
                ? `${accounts.length} accounts · ${trips.length} trips`
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
            </div>
          ))}

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
