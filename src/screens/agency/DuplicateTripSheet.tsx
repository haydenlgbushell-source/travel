import { useState } from "react";
import type { Theme } from "../../theme";
import type { EventDetails } from "../trip-setup/event-data";
import "../trip/trip-page.css";

/** "14 – 19 August 2026" — same shape TripSetupPage writes, so a duplicated
 *  trip's header reads identically to one built by hand. */
function formatDateRange(startISO: string, endISO: string): string {
  if (!startISO || !endISO) return "";
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";

  const endMonth = end.toLocaleDateString("en-US", { month: "long" });
  const year = end.getFullYear();
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} – ${end.getDate()} ${endMonth} ${year}`;
  }
  const startMonth = start.toLocaleDateString("en-US", { month: "long" });
  return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth} ${year}`;
}

function dayCount(startISO: string, endISO: string): number {
  const start = new Date(`${startISO}T00:00:00`).getTime();
  const end = new Date(`${endISO}T00:00:00`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return Math.round((end - start) / 86_400_000) + 1;
}

export function DuplicateTripSheet({
  source,
  onDuplicate,
  onClose,
  theme,
}: {
  source: EventDetails;
  onDuplicate: (next: { name: string; startDate: string; endDate: string; dates: string }) => Promise<void>;
  onClose: () => void;
  theme: Theme;
}) {
  const [name, setName] = useState(`${source.name} (copy)`);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const sourceDays = dayCount(source.startDate, source.endDate);
  const newDays = dayCount(startDate, endDate);
  const dates = formatDateRange(startDate, endDate);
  const canGo = name.trim().length > 0 && newDays > 0 && !busy;

  async function go() {
    if (!canGo) return;
    setBusy(true);
    setError(undefined);
    try {
      await onDuplicate({ name: name.trim(), startDate, endDate, dates });
      onClose();
    } catch {
      setError("Couldn't duplicate that trip.");
      setBusy(false);
    }
  }

  const fieldStyle = {
    background: theme.bg,
    borderColor: theme.line,
    color: theme.ink,
    fontFamily: theme.fontSans,
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: theme.pillRadius,
    padding: "9px 11px",
    width: "100%",
    fontSize: "14px",
  } as const;
  const labelStyle = {
    fontFamily: theme.fontMono,
    color: theme.meta,
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: ".06em",
  } as const;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        background: "oklch(0.2 0 0 / 0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.card,
          color: theme.ink,
          width: "100%",
          maxWidth: "520px",
          borderTopLeftRadius: theme.frameRadius,
          borderTopRightRadius: theme.frameRadius,
          padding: "18px 16px 22px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div>
          <div style={labelStyle}>Reuse this itinerary</div>
          <div style={{ fontFamily: theme.fontDisplay, fontSize: "20px" }}>{source.name}</div>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <span style={labelStyle}>New trip name</span>
          <input style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <div style={{ display: "flex", gap: "10px" }}>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={labelStyle}>Starts</span>
            <input
              style={fieldStyle}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={labelStyle}>Ends</span>
            <input
              style={fieldStyle}
              type="date"
              min={startDate || undefined}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>

        <span style={{ fontFamily: theme.fontMono, fontSize: "12px", color: theme.body }}>
          {newDays === 0
            ? `The original runs ${sourceDays} ${sourceDays === 1 ? "day" : "days"}. Pick dates for the copy.`
            : newDays === sourceDays
              ? `Same length — every day's plan carries across.`
              : newDays > sourceDays
                ? `${newDays} days vs ${sourceDays}: the plan copies across and the last ${newDays - sourceDays} ${newDays - sourceDays === 1 ? "day comes" : "days come"} through empty.`
                : `${newDays} days vs ${sourceDays}: the first ${newDays} ${newDays === 1 ? "day copies" : "days copy"} across, the rest is dropped.`}
        </span>

        {error && (
          <span style={{ fontFamily: theme.fontMono, fontSize: "12px", color: "oklch(0.5 0.16 25)" }}>
            {error}
          </span>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "2px" }}>
          <button
            type="button"
            className="trip-page__reset trip-page__add"
            onClick={() => void go()}
            disabled={!canGo}
            style={{
              flex: 1,
              color: theme.bg,
              background: theme.ink,
              borderColor: theme.ink,
              opacity: canGo ? 1 : 0.5,
            }}
          >
            {busy ? "Copying…" : "Create the copy"}
          </button>
          <button
            type="button"
            className="trip-page__reset trip-card__action"
            onClick={onClose}
            style={{ fontFamily: theme.fontMono, color: theme.body, padding: "0 14px" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
