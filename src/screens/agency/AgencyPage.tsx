import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeProvider, getTheme, type Theme } from "../../theme";
import type { EventDetails } from "../trip-setup/event-data";
import {
  TRIP_STATUSES,
  addAgencyAgent,
  duplicateTripForClient,
  loadAgencyAgents,
  loadAgencyTripDetails,
  loadAgencyTrips,
  removeAgencyAgent,
  saveTripAgencyDetails,
  type Agency,
  type AgencyAgent,
  type TripAgencyDetails,
  type TripStatus,
} from "./agency-data";
import { ClientDetailsSheet } from "./ClientDetailsSheet";
import { DuplicateTripSheet } from "./DuplicateTripSheet";
import "../trip/trip-page.css";

type Tab = "trips" | "team";

function blankDetails(tripId: string): TripAgencyDetails {
  return { tripId, status: "Draft", currency: "AUD" };
}

export function AgencyPage({
  agency,
  agencies,
  onSwitchAgency,
  accountId,
  onOpenTrip,
  onCreateClientTrip,
  onBack,
  theme,
}: {
  /** Only ever handed to this page once the caller has confirmed the
   *  account has agency access — this page has no path of its own to get
   *  or grant it, so it never fetches or creates one itself. */
  agency: Agency;
  /** Every agency this account belongs to — almost always just `[agency]`,
   *  since access is granted per-agency rather than self-served. The
   *  switcher below only renders once there's a real choice to make. */
  agencies: Agency[];
  onSwitchAgency: (agencyId: string) => void;
  accountId: string;
  /** Hands back the whole trip, not just its id — this list is fetched
   *  straight from the database, so a client trip a colleague created
   *  won't be in the caller's own loaded set yet. */
  onOpenTrip: (trip: EventDetails) => void;
  onCreateClientTrip: (agencyId: string) => void;
  onBack: () => void;
  theme: Theme;
}) {
  const [tab, setTab] = useState<Tab>("trips");
  const [trips, setTrips] = useState<EventDetails[]>();
  const [details, setDetails] = useState<Map<string, TripAgencyDetails>>(new Map());
  const [agents, setAgents] = useState<AgencyAgent[]>();
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TripStatus | "All">("All");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<EventDetails>();
  const [duplicating, setDuplicating] = useState<EventDetails>();
  const [newAgentMobile, setNewAgentMobile] = useState("");
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamNote, setTeamNote] = useState<string>();

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const list = await loadAgencyTrips(agency.id);
      const detailMap = await loadAgencyTripDetails(list.map((t) => t.id));
      if (!alive.current) return;
      setTrips(list);
      setDetails(detailMap);
      setError(undefined);
    } catch {
      if (!alive.current) return;
      /* Land on an empty list rather than leaving `trips` undefined —
         otherwise the header reads "Loading…" forever beside the error. */
      setTrips((prev) => prev ?? []);
      setError("Couldn't load your agency's trips.");
    }
  }, [agency.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadTeam = useCallback(async () => {
    try {
      const list = await loadAgencyAgents(agency.id);
      if (alive.current) setAgents(list);
    } catch {
      if (alive.current) setAgents([]);
    }
  }, [agency.id]);

  useEffect(() => {
    if (tab === "team") void loadTeam();
  }, [tab, loadTeam]);

  async function saveDetails(next: TripAgencyDetails) {
    await saveTripAgencyDetails(next);
    if (alive.current) setDetails((prev) => new Map(prev).set(next.tripId, next));
  }

  async function addAgent() {
    const mobile = newAgentMobile.trim();
    if (!mobile) return;
    setTeamBusy(true);
    setTeamNote(undefined);
    try {
      const who = await addAgencyAgent(agency.id, mobile);
      if (!alive.current) return;
      setNewAgentMobile("");
      setTeamNote(`Added ${who}.`);
      await loadTeam();
    } catch (e) {
      /* The RPC's own message is the useful one — "no account with that
         mobile", "already on this agency" — so it's shown rather than
         flattened into a generic failure. */
      if (alive.current) setTeamNote((e as { message?: string }).message ?? "Couldn't add them.");
    } finally {
      if (alive.current) setTeamBusy(false);
    }
  }

  async function removeAgent(id: string) {
    setTeamBusy(true);
    setTeamNote(undefined);
    try {
      await removeAgencyAgent(agency.id, id);
      await loadTeam();
    } catch (e) {
      if (alive.current) setTeamNote((e as { message?: string }).message ?? "Couldn't remove them.");
    } finally {
      if (alive.current) setTeamBusy(false);
    }
  }

  async function duplicate(next: {
    name: string;
    startDate: string;
    endDate: string;
    dates: string;
  }) {
    if (!duplicating) return;
    const copy = await duplicateTripForClient(duplicating, accountId, next);
    /* Carry the client file across too, minus anything that shouldn't be
       reused — a copy starts back at Draft and is never born archived. */
    const from = details.get(duplicating.id);
    if (from) {
      await saveTripAgencyDetails({
        ...from,
        tripId: copy.id,
        status: "Draft",
        archivedAt: undefined,
      });
    }
    await load();
  }

  const q = query.trim().toLowerCase();
  const visible = (trips ?? []).filter((t) => {
    const d = details.get(t.id);
    if ((d?.archivedAt !== undefined) !== showArchived) return false;
    if (statusFilter !== "All" && (d?.status ?? "Draft") !== statusFilter) return false;
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      (t.destination ?? "").toLowerCase().includes(q) ||
      (d?.clientName ?? "").toLowerCase().includes(q)
    );
  });

  /* Only what's on screen — a total that silently included archived or
     filtered-out trips would be misleading next to the list.
  
     Totalled per currency rather than into one number: an agency running AUD,
     JPY and USD trips used to have those three added together and stamped
     with whichever currency happened to come first, which made the headline
     figure meaningless. Cancelled trips are left out entirely, and Confirmed
     and later are counted apart from what's still only quoted — an agent
     needs those as two numbers, not one. */
  const COMMITTED: TripStatus[] = ["Confirmed", "Travelling", "Completed"];
  const pipeline = new Map<string, { booked: number; quoted: number; margin: number }>();
  for (const t of visible) {
    const d = details.get(t.id);
    if (d?.sellPrice === undefined) continue;
    const status = d.status ?? "Draft";
    if (status === "Cancelled") continue;
    const row = pipeline.get(d.currency) ?? { booked: 0, quoted: 0, margin: 0 };
    if (COMMITTED.includes(status)) {
      row.booked += d.sellPrice;
      if (d.costPrice !== undefined) row.margin += d.sellPrice - d.costPrice;
    } else {
      row.quoted += d.sellPrice;
    }
    pipeline.set(d.currency, row);
  }
  const pipelineLabel = [...pipeline.entries()]
    .map(([code, row]) => {
      const parts = [`${row.booked.toFixed(0)} ${code} booked`];
      if (row.quoted > 0) parts.push(`${row.quoted.toFixed(0)} quoted`);
      if (row.margin !== 0) parts.push(`${row.margin.toFixed(0)} commission`);
      return parts.join(" · ");
    })
    .join("  |  ");

  const labelStyle = { fontFamily: theme.fontMono, color: theme.meta, fontSize: "11px" };
  const fieldStyle = {
    background: theme.card,
    borderColor: theme.line,
    color: theme.ink,
    fontFamily: theme.fontSans,
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: theme.pillRadius,
    padding: "8px 11px",
    fontSize: "14px",
    width: "100%",
  } as const;

  function tabButton(id: Tab, label: string) {
    const on = tab === id;
    return (
      <button
        type="button"
        className="trip-page__reset"
        onClick={() => setTab(id)}
        style={{
          fontFamily: theme.fontMono,
          fontSize: "12px",
          padding: "6px 12px",
          borderRadius: theme.chipRadius,
          border: `1px solid ${on ? theme.headInk : "transparent"}`,
          color: on ? theme.headInk : theme.headMeta,
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <ThemeProvider theme={theme} className="trip-page trip-page--wide" style={{ background: theme.bg, color: theme.ink }}>
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
          <div style={{ display: "flex", gap: "6px" }}>
            {tabButton("trips", "Trips")}
            {tabButton("team", "Team")}
          </div>
        </div>
        <div className="trip-page__head-main">
          <div>
            <div className="trip-page__dates" style={{ fontFamily: theme.fontMono, color: theme.headMeta }}>
              {trips
                ? `${visible.length} of ${trips.length}${pipelineLabel ? ` · ${pipelineLabel}` : ""}`
                : "Loading…"}
            </div>
            {agencies.length > 1 ? (
              <select
                value={agency.id}
                onChange={(e) => onSwitchAgency(e.target.value)}
                className="trip-page__reset"
                style={{
                  fontFamily: theme.fontDisplay,
                  fontSize: "inherit",
                  color: theme.headInk,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                {agencies.map((a) => (
                  <option key={a.id} value={a.id} style={{ color: theme.ink, background: theme.card }}>
                    {a.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="trip-page__name" style={{ fontFamily: theme.fontDisplay }}>
                {agency.name}
              </div>
            )}
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

          {tab === "team" ? (
            <>
              <span className="wf-card__eyebrow" style={labelStyle}>
                Who can see this agency's client trips
              </span>
              {agents?.map((a) => (
                <div key={a.accountId} className="wf-card wf-card--pad" style={{ background: theme.card, borderColor: theme.line, gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
                      {a.name || a.mobile || "No name yet"}
                    </span>
                    <span style={{ fontFamily: theme.fontMono, color: theme.meta, fontSize: "12px" }}>
                      {a.role}
                    </span>
                  </div>
                  <span style={{ fontFamily: theme.fontMono, color: theme.body, fontSize: "12px" }}>
                    {a.mobile || "no mobile"}
                    {a.accountId === accountId ? " · you" : ""}
                  </span>
                  {agency.role === "Owner" && a.accountId !== accountId && (
                    <button
                      type="button"
                      className="trip-page__reset trip-card__action"
                      onClick={() => void removeAgent(a.accountId)}
                      disabled={teamBusy}
                      style={{ fontFamily: theme.fontMono, color: theme.body, fontSize: "12px", alignSelf: "flex-start" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              {agency.role === "Owner" ? (
                <div className="wf-card wf-card--pad" style={{ background: theme.card, borderColor: theme.line, gap: "8px" }}>
                  <span style={labelStyle}>Add a colleague by mobile</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      style={fieldStyle}
                      inputMode="tel"
                      placeholder="0400 000 000"
                      value={newAgentMobile}
                      onChange={(e) => setNewAgentMobile(e.target.value)}
                    />
                    <button
                      type="button"
                      className="trip-page__reset trip-card__action"
                      onClick={() => void addAgent()}
                      disabled={teamBusy || !newAgentMobile.trim()}
                      style={{ fontFamily: theme.fontMono, color: theme.accent, padding: "0 12px" }}
                    >
                      Add
                    </button>
                  </div>
                  <span style={{ fontFamily: theme.fontMono, color: theme.meta, fontSize: "12px" }}>
                    They need a Wayfare account already — this links the one
                    registered to that number.
                  </span>
                  {teamNote && (
                    <span style={{ fontFamily: theme.fontMono, color: theme.body, fontSize: "12px" }}>
                      {teamNote}
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ fontFamily: theme.fontMono, color: theme.meta, fontSize: "12px" }}>
                  Only an owner can add or remove staff.
                </span>
              )}
            </>
          ) : (
            <>
              <input
                style={fieldStyle}
                placeholder="Search client, trip or destination"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />

              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(["All", ...TRIP_STATUSES] as const).map((s) => {
                  const on = statusFilter === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      className="trip-page__reset"
                      onClick={() => setStatusFilter(s as TripStatus | "All")}
                      style={{
                        fontFamily: theme.fontMono,
                        fontSize: "12px",
                        padding: "5px 10px",
                        borderRadius: theme.chipRadius,
                        border: `1px solid ${on ? theme.ink : theme.line}`,
                        background: on ? theme.ink : "transparent",
                        color: on ? theme.bg : theme.body,
                        cursor: "pointer",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="trip-page__reset"
                  onClick={() => setShowArchived((v) => !v)}
                  style={{
                    fontFamily: theme.fontMono,
                    fontSize: "12px",
                    padding: "5px 10px",
                    borderRadius: theme.chipRadius,
                    border: `1px solid ${showArchived ? theme.ink : theme.line}`,
                    background: showArchived ? theme.ink : "transparent",
                    color: showArchived ? theme.bg : theme.body,
                    cursor: "pointer",
                  }}
                >
                  Archived
                </button>
              </div>

              {!error && trips && visible.length === 0 && (
                <div className="empty-day" style={{ borderColor: theme.line, color: theme.body }}>
                  <span className="empty-day__title" style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
                    {trips.length === 0 ? "No client trips yet" : "Nothing matches"}
                  </span>
                  <span className="empty-day__note">
                    {trips.length === 0
                      ? "Build one the same way you'd build your own — it'll show up here, tagged as this agency's rather than personal."
                      : "Try a different search or status."}
                  </span>
                </div>
              )}

              {visible.map((trip) => {
                const d = details.get(trip.id);
                const margin =
                  d?.sellPrice !== undefined && d?.costPrice !== undefined
                    ? d.sellPrice - d.costPrice
                    : undefined;
                return (
                  <div key={trip.id} className="trip-card" style={{ background: theme.card, borderColor: theme.line }}>
                    <button
                      type="button"
                      className="trip-page__reset trip-card__open"
                      onClick={() => onOpenTrip(trip)}
                    >
                      <span className="past-card__dates" style={{ fontFamily: theme.fontMono, color: theme.meta }}>
                        {trip.dates} · {d?.status ?? "Draft"}
                      </span>
                      <span className="past-card__name" style={{ fontFamily: theme.fontDisplay, color: theme.ink }}>
                        {d?.clientName || trip.name}
                      </span>
                      <span className="past-card__counts" style={{ fontFamily: theme.fontMono, color: theme.body }}>
                        {d?.clientName ? `${trip.name} · ` : ""}
                        {trip.destination || "No destination set"}
                        {getTheme(trip.themeKey).name ? ` · ${getTheme(trip.themeKey).name} style` : ""}
                      </span>
                      {(d?.sellPrice !== undefined || margin !== undefined) && (
                        <span className="past-card__counts" style={{ fontFamily: theme.fontMono, color: theme.accentInk }}>
                          {d?.sellPrice !== undefined ? `${d.sellPrice.toFixed(2)} ${d.currency}` : ""}
                          {margin !== undefined ? ` · ${margin.toFixed(2)} commission` : ""}
                        </span>
                      )}
                    </button>
                    <div className="trip-card__actions">
                      <button
                        type="button"
                        className="trip-page__reset trip-card__action"
                        onClick={() => setEditing(trip)}
                        style={{ fontFamily: theme.fontMono, color: theme.accent }}
                      >
                        Client file
                      </button>
                      <button
                        type="button"
                        className="trip-page__reset trip-card__action"
                        onClick={() => setDuplicating(trip)}
                        style={{ fontFamily: theme.fontMono, color: theme.body }}
                      >
                        Duplicate
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                className="trip-page__reset trip-page__add trips__new"
                onClick={() => onCreateClientTrip(agency.id)}
                style={{ color: theme.bg, background: theme.ink, borderColor: theme.ink }}
              >
                Build a client trip
              </button>

              <span
                className="add-sheet__foot"
                style={{ fontFamily: theme.fontMono, color: theme.meta, textAlign: "center" }}
              >
                Open a client trip's People tab to generate an access code they can use with no
                account of their own.
              </span>
            </>
          )}
        </div>
      </div>

      {editing && (
        <ClientDetailsSheet
          tripName={editing.name}
          details={details.get(editing.id) ?? blankDetails(editing.id)}
          onSave={saveDetails}
          onClose={() => setEditing(undefined)}
          theme={theme}
        />
      )}

      {duplicating && (
        <DuplicateTripSheet
          source={duplicating}
          onDuplicate={duplicate}
          onClose={() => setDuplicating(undefined)}
          theme={theme}
        />
      )}
    </ThemeProvider>
  );
}
