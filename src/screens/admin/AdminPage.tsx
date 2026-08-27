import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThemeProvider, type Theme } from "../../theme";
import {
  adminCreateAgency,
  adminListAccounts,
  adminListAgencies,
  adminListTrips,
  adminRevokeAgency,
  adminSetTripAgency,
  type AdminAccountRow,
  type AdminAgencyRow,
  type AdminTripRow,
} from "./admin-data";
import { NewTripPanel } from "./NewTripPanel";
import "./admin.css";

type Section = "overview" | "trips" | "agencies" | "accounts";

const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "trips", label: "Trips" },
  { id: "agencies", label: "Agencies" },
  { id: "accounts", label: "Accounts" },
];

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** A display name for an account that never comes back empty — the table
 *  reads badly with a blank first column. */
function accountLabel(a: AdminAccountRow): string {
  if (a.name) return a.name;
  if (a.isAnonymous) return "Guest";
  return a.mobile || "No name yet";
}

interface Notice {
  text: string;
  tone: "ok" | "warn" | "error";
}

export function AdminPage({
  accountId,
  onBack,
  theme,
}: {
  /** The admin's own account — a trip they set up is owned by them, the
   *  same as anyone else's. */
  accountId: string;
  onBack: () => void;
  theme: Theme;
}) {
  const [section, setSection] = useState<Section>("overview");
  const [accounts, setAccounts] = useState<AdminAccountRow[]>();
  const [trips, setTrips] = useState<AdminTripRow[]>();
  const [agencies, setAgencies] = useState<AdminAgencyRow[]>();
  const [notice, setNotice] = useState<Notice>();
  /* Which single thing is in flight, keyed by what it acts on — one global
     `busy` disabled every select and every button on the page while one row
     saved, which reads as the console having hung. `undefined` means idle;
     "refresh" covers the whole-page reload. */
  const [busyKey, setBusyKey] = useState<string>();
  const busy = busyKey !== undefined;
  const [accountSearch, setAccountSearch] = useState("");
  const [tripSearch, setTripSearch] = useState("");
  /* Which agency the admin has clicked Revoke on but not yet confirmed — it
     detaches every client trip in it, so it asks first. */
  const [confirmingRevoke, setConfirmingRevoke] = useState<string>();
  /* The account being granted an agency, and the name being typed for it. */
  const [granting, setGranting] = useState<{ account: AdminAccountRow; name: string }>();

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
    } catch {
      if (!alive.current) return;
      /* Fall back to empty lists rather than leaving these undefined — the
         counts would otherwise read "Loading…" forever beside the error,
         with no empty state and no way to retry. */
      setAccounts((prev) => prev ?? []);
      setTrips((prev) => prev ?? []);
      setAgencies((prev) => prev ?? []);
      setNotice({ text: "Couldn't load admin data.", tone: "error" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Every mutation runs the same shape: mark busy, do the thing, refresh,
   *  say what happened. A failure past the mutation itself is the refresh
   *  failing and must not be reported as a failed action. */
  async function run(key: string, action: () => Promise<string>, failure: string) {
    setBusyKey(key);
    setNotice(undefined);
    let message: string;
    try {
      message = await action();
    } catch {
      if (alive.current) {
        setNotice({ text: failure, tone: "error" });
        setBusyKey(undefined);
      }
      return;
    }
    await load();
    if (alive.current) {
      setNotice({ text: message, tone: "ok" });
      setBusyKey(undefined);
    }
  }

  /* --- 6. The name used to be generated and unchangeable. It is the agency's
     own name, shown to their clients, so it is asked for. --- */
  function grantAgency(account: AdminAccountRow, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setGranting(undefined);
    void run(`grant:${account.id}`, async () => {
      await adminCreateAgency(account.id, trimmed);
      return `${accountLabel(account)} now owns ${trimmed}.`;
    }, "Couldn't grant agency access.");
  }

  function revokeAgency(agency: AdminAgencyRow) {
    setConfirmingRevoke(undefined);
    void run(`agency:${agency.id}`, async () => {
      const detached = await adminRevokeAgency(agency.id);
      return detached > 0
        ? `Revoked ${agency.name}. ${detached} ${detached === 1 ? "trip" : "trips"} stayed, as ordinary trips.`
        : `Revoked ${agency.name}.`;
    }, "Couldn't revoke agency access.");
  }

  function moveTrip(trip: AdminTripRow, nextAgencyId: string) {
    void run(`trip:${trip.id}`, async () => {
      await adminSetTripAgency(trip.id, nextAgencyId || undefined);
      const agency = agencies?.find((a) => a.id === nextAgencyId);
      return nextAgencyId
        ? `Moved "${trip.name}" to ${agency?.name ?? "that agency"}.`
        : `"${trip.name}" is no longer an agency trip.`;
    }, "Couldn't move that trip — the database refused the change.");
  }

  const loaded = accounts !== undefined && trips !== undefined && agencies !== undefined;
  const agencyOwnerIds = useMemo(
    () => new Set(agencies?.map((a) => a.ownerAccountId)),
    [agencies],
  );
  const agencyById = useMemo(
    () => new Map(agencies?.map((a) => [a.id, a])),
    [agencies],
  );

  const counts = {
    accounts: accounts?.length ?? 0,
    trips: trips?.length ?? 0,
    agencies: agencies?.length ?? 0,
    guests: accounts?.filter((a) => a.isAnonymous).length ?? 0,
    unconfirmed: accounts?.filter((a) => !a.isAnonymous && !a.emailConfirmedAt).length ?? 0,
    agencyTrips: trips?.filter((t) => t.agencyId).length ?? 0,
  };

  const visibleAccounts = (accounts ?? []).filter((a) => {
    const q = accountSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      accountLabel(a).toLowerCase().includes(q) ||
      a.mobile.includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });

  const visibleTrips = (trips ?? []).filter((t) => {
    const q = tripSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.ownerMobile.includes(q) ||
      (agencyById.get(t.agencyId ?? "")?.name ?? "").toLowerCase().includes(q)
    );
  });

  function skeletonRows(columns: number) {
    return (
      <tbody>
        {[0, 1, 2].map((i) => (
          <tr key={i}>
            <td colSpan={columns}>
              <div className="admin__skeleton" />
            </td>
          </tr>
        ))}
      </tbody>
    );
  }

  return (
    <ThemeProvider theme={theme} className="admin">
      <div className="admin__top">
        <div className="admin__brand">
          <span className="admin__wordmark">{theme.wordmark}</span>
          <span className="admin__badge">Admin</span>
        </div>
        <div className="admin__top-actions">
          <span>
            {loaded
              ? `${counts.accounts} accounts · ${counts.trips} trips · ${counts.agencies} agencies`
              : "Loading…"}
          </span>
          <button
            type="button"
            className="admin__reset admin__top-btn"
            onClick={() => {
              setBusyKey("refresh");
              void load().finally(() => alive.current && setBusyKey(undefined));
            }}
            disabled={busy}
          >
            {busy ? "Working…" : "Refresh"}
          </button>
          <button type="button" className="admin__reset admin__top-btn" onClick={onBack}>
            Back to the app
          </button>
        </div>
      </div>

      <div className="admin__shell">
        <nav className="admin__side" aria-label="Admin sections">
          <span className="admin__side-label">Console</span>
          {SECTIONS.map((s) => {
            const on = s.id === section;
            const count =
              s.id === "trips"
                ? counts.trips
                : s.id === "agencies"
                  ? counts.agencies
                  : s.id === "accounts"
                    ? counts.accounts
                    : undefined;
            return (
              <button
                key={s.id}
                type="button"
                aria-current={on ? "page" : undefined}
                className={`admin__reset admin__side-item${on ? " admin__side-item--on" : ""}`}
                onClick={() => setSection(s.id)}
              >
                {s.label}
                {count !== undefined && loaded && (
                  <span className="admin__side-count">{count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <main className="admin__main">
          {notice && (
            <div className={`admin__notice admin__notice--${notice.tone}`}>
              <span>{notice.text}</span>
              <button
                type="button"
                className="admin__reset admin__link admin__link--muted"
                onClick={() => setNotice(undefined)}
              >
                Dismiss
              </button>
            </div>
          )}

          {section === "overview" && (
            <>
              <div className="admin__head">
                <div>
                  <h1 className="admin__title">Overview</h1>
                  <p className="admin__sub">
                    Everything on the platform, as the database sees it. Setting a
                    trip up and granting an agency both happen from here — trips
                    from the Trips tab, agency access from Accounts.
                  </p>
                </div>
              </div>

              <div className="admin__stats">
                <div className="admin__stat">
                  <span className="admin__stat-n">{counts.accounts}</span>
                  <span className="admin__stat-label">Accounts</span>
                  <span className="admin__stat-note">
                    {counts.guests} reached by access code, with no password.
                  </span>
                </div>
                <div className="admin__stat">
                  <span className="admin__stat-n">{counts.trips}</span>
                  <span className="admin__stat-label">Trips</span>
                  <span className="admin__stat-note">
                    {counts.agencyTrips} built for a client by an agency.
                  </span>
                </div>
                <div className="admin__stat">
                  <span className="admin__stat-n">{counts.agencies}</span>
                  <span className="admin__stat-label">Agencies</span>
                  <span className="admin__stat-note">
                    Access is granted here — nobody can create one themselves.
                  </span>
                </div>
                <div className="admin__stat">
                  <span className="admin__stat-n">{counts.unconfirmed}</span>
                  <span className="admin__stat-label">Unconfirmed</span>
                  <span className="admin__stat-note">
                    Signed up but never clicked the email link, so they can't sign in.
                  </span>
                </div>
              </div>

              <div className="admin__panel">
                <div className="admin__panel-head">
                  <span className="admin__panel-title">Newest trips</span>
                  <button
                    type="button"
                    className="admin__reset admin__link"
                    onClick={() => setSection("trips")}
                  >
                    All trips →
                  </button>
                </div>
                <div className="admin__table-wrap">
                  <table className="admin__table">
                    <thead>
                      <tr>
                        <th>Trip</th>
                        <th>Dates</th>
                        <th>Owner</th>
                        <th>Agency</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    {loaded ? (
                      <tbody>
                        {trips.slice(0, 6).map((t) => (
                          <tr key={t.id}>
                            <td className="admin__cell-name">{t.name}</td>
                            <td className="admin__cell-mono">{t.dates}</td>
                            <td className="admin__cell-mono">
                              {t.ownerMobile || t.ownerId.slice(0, 8)}
                            </td>
                            <td>
                              {t.agencyId ? (
                                <span className="admin__tag">
                                  {agencyById.get(t.agencyId)?.name ?? "Agency"}
                                </span>
                              ) : (
                                <span className="admin__tag admin__tag--quiet">Personal</span>
                              )}
                            </td>
                            <td className="admin__cell-mono">{formatDate(t.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    ) : (
                      skeletonRows(5)
                    )}
                  </table>
                </div>
                {loaded && trips.length === 0 && (
                  <div className="admin__empty">
                    No trips yet. Set the first one up from the Trips tab.
                  </div>
                )}
              </div>
            </>
          )}

          {section === "trips" && (
            <>
              <div className="admin__head">
                <div>
                  <h1 className="admin__title">Trips</h1>
                  <p className="admin__sub">
                    Set a trip up and hand it to an agency, or move an existing one
                    between agencies. A trip you create is owned by you until an
                    agency picks it up.
                  </p>
                </div>
              </div>

              <NewTripPanel
                accountId={accountId}
                agencies={agencies ?? []}
                onCreated={(text, tone) => {
                  setNotice({ text, tone });
                  void load();
                }}
              />

              <div className="admin__panel">
                <div className="admin__panel-head">
                  <span className="admin__panel-title">
                    Every trip{loaded ? ` · ${visibleTrips.length} of ${trips.length}` : ""}
                  </span>
                  <input
                    className="admin__search"
                    value={tripSearch}
                    onChange={(e) => setTripSearch(e.target.value)}
                    placeholder="Search trips, owners, agencies"
                    aria-label="Search trips"
                  />
                </div>
                <div className="admin__table-wrap">
                  <table className="admin__table">
                    <thead>
                      <tr>
                        <th>Trip</th>
                        <th>Dates</th>
                        <th>Owner</th>
                        <th>People</th>
                        <th>Agency</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    {loaded ? (
                      <tbody>
                        {visibleTrips.map((t) => (
                          <tr key={t.id}>
                            <td>
                              <span className="admin__cell-name">{t.name}</span>
                              {t.fromExample && (
                                <>
                                  {" "}
                                  <span className="admin__tag admin__tag--quiet">Example</span>
                                </>
                              )}
                            </td>
                            <td className="admin__cell-mono">{t.dates}</td>
                            <td className="admin__cell-mono">
                              {t.ownerMobile || t.ownerId.slice(0, 8)}
                            </td>
                            <td className="admin__cell-mono">{t.memberCount}</td>
                            <td>
                              <select
                                className="admin__select"
                                style={{ minHeight: "32px", fontSize: "13px" }}
                                value={t.agencyId ?? ""}
                                disabled={busyKey === `trip:${t.id}` || agencies.length === 0}
                                onChange={(e) => moveTrip(t, e.target.value)}
                                aria-label={`Agency for ${t.name}`}
                              >
                                <option value="">Personal</option>
                                {agencies.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="admin__cell-mono">{formatDate(t.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    ) : (
                      skeletonRows(6)
                    )}
                  </table>
                </div>
                {loaded && visibleTrips.length === 0 && (
                  <div className="admin__empty">
                    {trips.length === 0
                      ? "No trips yet. Set the first one up above."
                      : "Nothing matches that search."}
                  </div>
                )}
              </div>
            </>
          )}

          {section === "agencies" && (
            <>
              <div className="admin__head">
                <div>
                  <h1 className="admin__title">Agencies</h1>
                  <p className="admin__sub">
                    An agency exists because you granted one — nobody can create
                    their own. Its owner adds their own colleagues as agents from
                    the agency page; you don't need to add each one here.
                  </p>
                </div>
              </div>

              <div className="admin__panel">
                <div className="admin__panel-head">
                  <span className="admin__panel-title">Agencies</span>
                  <button
                    type="button"
                    className="admin__reset admin__link"
                    onClick={() => setSection("accounts")}
                  >
                    Grant a new one →
                  </button>
                </div>
                <div className="admin__table-wrap">
                  <table className="admin__table">
                    <thead>
                      <tr>
                        <th>Agency</th>
                        <th>Owner</th>
                        <th>Agents</th>
                        <th>Client trips</th>
                        <th>Granted</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    {loaded ? (
                      <tbody>
                        {agencies.map((ag) => {
                          const clientTrips = trips.filter((t) => t.agencyId === ag.id).length;
                          const confirming = confirmingRevoke === ag.id;
                          return (
                            <tr key={ag.id}>
                              <td className="admin__cell-name">{ag.name}</td>
                              <td className="admin__cell-mono">
                                {ag.ownerMobile || ag.ownerAccountId.slice(0, 8)}
                              </td>
                              <td className="admin__cell-mono">{ag.agentCount}</td>
                              <td className="admin__cell-mono">{clientTrips}</td>
                              <td className="admin__cell-mono">{formatDate(ag.createdAt)}</td>
                              <td className="admin__cell-actions">
                                {confirming ? (
                                  <>
                                    <span className="admin__hint admin__hint--warn">
                                      {clientTrips > 0
                                        ? `${clientTrips} client ${clientTrips === 1 ? "trip stays" : "trips stay"}, as ordinary trips.`
                                        : "Revoke access?"}
                                    </span>
                                    <button
                                      type="button"
                                      className="admin__reset admin__link admin__link--danger"
                                      disabled={busyKey === `agency:${ag.id}`}
                                      onClick={() => revokeAgency(ag)}
                                    >
                                      Revoke
                                    </button>
                                    <button
                                      type="button"
                                      className="admin__reset admin__link admin__link--muted"
                                      onClick={() => setConfirmingRevoke(undefined)}
                                    >
                                      Keep
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className="admin__reset admin__link admin__link--muted"
                                    disabled={busyKey === `agency:${ag.id}`}
                                    onClick={() => setConfirmingRevoke(ag.id)}
                                  >
                                    Revoke access
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    ) : (
                      skeletonRows(6)
                    )}
                  </table>
                </div>
                {loaded && agencies.length === 0 && (
                  <div className="admin__empty">
                    No agencies yet — grant one from the Accounts tab.
                  </div>
                )}
              </div>
            </>
          )}

          {section === "accounts" && (
            <>
              <div className="admin__head">
                <div>
                  <h1 className="admin__title">Accounts</h1>
                  <p className="admin__sub">
                    Granting agency access makes that account the owner of a new
                    agency. They can then add their own agents, build client trips,
                    and see their pipeline — none of which they can reach otherwise.
                  </p>
                </div>
              </div>

              {granting && (
                <div className="admin__panel">
                  <div className="admin__panel-head">
                    <span className="admin__panel-title">
                      Grant agency access to {accountLabel(granting.account)}
                    </span>
                  </div>
                  <form
                    className="admin__panel-body"
                    onSubmit={(e) => {
                      e.preventDefault();
                      grantAgency(granting.account, granting.name);
                    }}
                  >
                    <label className="admin__field">
                      <span className="admin__label">Agency name</span>
                      <input
                        className="admin__input"
                        value={granting.name}
                        autoFocus
                        onChange={(e) =>
                          setGranting({ account: granting.account, name: e.target.value })
                        }
                        placeholder="Northbound Travel"
                      />
                      <span className="admin__hint">
                        Their clients see this, so it is the agency's real name — not
                        the account holder's.
                      </span>
                    </label>
                    <div className="admin__actions">
                      <button
                        type="submit"
                        className="admin__reset admin__btn admin__btn--primary"
                        disabled={granting.name.trim().length === 0 || busy}
                      >
                        Grant access
                      </button>
                      <button
                        type="button"
                        className="admin__reset admin__btn admin__btn--ghost"
                        onClick={() => setGranting(undefined)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="admin__panel">
                <div className="admin__panel-head">
                  <span className="admin__panel-title">
                    Accounts{loaded ? ` · ${visibleAccounts.length} of ${accounts.length}` : ""}
                  </span>
                  <input
                    className="admin__search"
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                    placeholder="Search name, mobile or email"
                    aria-label="Search accounts"
                  />
                </div>
                <div className="admin__table-wrap">
                  <table className="admin__table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    {loaded ? (
                      <tbody>
                        {visibleAccounts.map((a) => (
                          <tr key={a.id}>
                            <td className="admin__cell-name">{accountLabel(a)}</td>
                            <td className="admin__cell-mono">
                              {a.isAnonymous ? "—" : a.mobile || "—"}
                            </td>
                            <td className="admin__cell-mono">
                              {a.isAnonymous ? "—" : a.email}
                            </td>
                            <td>
                              <span className="admin__tags">
                                {a.isAnonymous && (
                                  <span className="admin__tag admin__tag--quiet">Guest</span>
                                )}
                                {!a.isAnonymous && !a.emailConfirmedAt && (
                                  <span className="admin__tag admin__tag--warn">Unconfirmed</span>
                                )}
                                {agencyOwnerIds.has(a.id) && (
                                  <span className="admin__tag admin__tag--ok">Agency owner</span>
                                )}
                              </span>
                            </td>
                            <td className="admin__cell-mono">{formatDate(a.createdAt)}</td>
                            <td className="admin__cell-actions">
                              {a.isAnonymous ? (
                                <span className="admin__hint">
                                  Guests can't hold agency access
                                </span>
                              ) : agencyOwnerIds.has(a.id) ? (
                                <button
                                  type="button"
                                  className="admin__reset admin__link admin__link--muted"
                                  onClick={() => setSection("agencies")}
                                >
                                  Manage agency
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="admin__reset admin__link"
                                  disabled={busyKey === `grant:${a.id}`}
                                  onClick={() =>
                                    setGranting({
                                      account: a,
                                      /* Seeded with a sensible default so the
                                         common case is one click and Enter. */
                                      name: `${a.name || a.mobile || "New"}'s Agency`,
                                    })
                                  }
                                >
                                  {busyKey === `grant:${a.id}` ? "Granting…" : "Grant agency access"}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    ) : (
                      skeletonRows(6)
                    )}
                  </table>
                </div>
                {loaded && visibleAccounts.length === 0 && (
                  <div className="admin__empty">
                    {accounts.length === 0 ? "No accounts yet." : "Nothing matches that search."}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}
