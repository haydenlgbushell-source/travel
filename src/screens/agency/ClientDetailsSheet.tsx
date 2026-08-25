import { useState } from "react";
import type { Theme } from "../../theme";
import { TRIP_STATUSES, type TripAgencyDetails, type TripStatus } from "./agency-data";
import "../trip/trip-page.css";

/** Everything on this sheet is agency-only — it lives in trip_agency_details
 *  rather than on the trip, so the client who opens the trip through an
 *  access code never sees the cost price or the margin. */
export function ClientDetailsSheet({
  tripName,
  details,
  onSave,
  onClose,
  theme,
}: {
  tripName: string;
  details: TripAgencyDetails;
  onSave: (next: TripAgencyDetails) => Promise<void>;
  onClose: () => void;
  theme: Theme;
}) {
  const [draft, setDraft] = useState<TripAgencyDetails>(details);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const margin =
    draft.sellPrice !== undefined && draft.costPrice !== undefined
      ? draft.sellPrice - draft.costPrice
      : undefined;

  function set<K extends keyof TripAgencyDetails>(key: K, value: TripAgencyDetails[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  /** Empty clears the figure rather than storing 0 — "not priced yet" and
   *  "priced at nothing" are different things on a quote. */
  function setMoney(key: "costPrice" | "sellPrice", raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return set(key, undefined);
    const n = Number(trimmed);
    if (Number.isFinite(n)) set(key, n);
  }

  async function save() {
    setSaving(true);
    setError(undefined);
    try {
      await onSave(draft);
      onClose();
    } catch {
      setError("Couldn't save those details.");
      setSaving(false);
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

  function field(label: string, node: React.ReactNode) {
    return (
      <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <span style={labelStyle}>{label}</span>
        {node}
      </label>
    );
  }

  return (
    <div
      className="sheet-scrim"
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
          maxHeight: "88vh",
          overflowY: "auto",
          borderTopLeftRadius: theme.frameRadius,
          borderTopRightRadius: theme.frameRadius,
          padding: "18px 16px 22px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ ...labelStyle }}>Client file</div>
          <div style={{ fontFamily: theme.fontDisplay, fontSize: "20px" }}>{tripName}</div>
        </div>

        {field(
          "Client name",
          <input
            style={fieldStyle}
            value={draft.clientName ?? ""}
            placeholder="Who this trip is for"
            onChange={(e) => set("clientName", e.target.value)}
          />,
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            {field(
              "Email",
              <input
                style={fieldStyle}
                type="email"
                value={draft.clientEmail ?? ""}
                onChange={(e) => set("clientEmail", e.target.value)}
              />,
            )}
          </div>
          <div style={{ flex: 1 }}>
            {field(
              "Phone",
              <input
                style={fieldStyle}
                type="tel"
                value={draft.clientPhone ?? ""}
                onChange={(e) => set("clientPhone", e.target.value)}
              />,
            )}
          </div>
        </div>

        {field(
          "Status",
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {TRIP_STATUSES.map((s) => {
              const on = draft.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  className="trip-page__reset"
                  onClick={() => set("status", s as TripStatus)}
                  style={{
                    fontFamily: theme.fontMono,
                    fontSize: "12px",
                    padding: "6px 10px",
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
          </div>,
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            {field(
              "Cost",
              <input
                style={fieldStyle}
                inputMode="decimal"
                placeholder="0.00"
                defaultValue={draft.costPrice ?? ""}
                onChange={(e) => setMoney("costPrice", e.target.value)}
              />,
            )}
          </div>
          <div style={{ flex: 1 }}>
            {field(
              "Sell",
              <input
                style={fieldStyle}
                inputMode="decimal"
                placeholder="0.00"
                defaultValue={draft.sellPrice ?? ""}
                onChange={(e) => setMoney("sellPrice", e.target.value)}
              />,
            )}
          </div>
          <div style={{ width: "84px" }}>
            {field(
              "Currency",
              <input
                style={fieldStyle}
                value={draft.currency}
                onChange={(e) => set("currency", e.target.value.toUpperCase().slice(0, 3))}
              />,
            )}
          </div>
        </div>

        <div
          style={{
            fontFamily: theme.fontMono,
            fontSize: "12px",
            color: margin !== undefined && margin < 0 ? "oklch(0.5 0.16 25)" : theme.accentInk,
          }}
        >
          {margin === undefined
            ? "Commission shows once both cost and sell are set."
            : `Commission ${margin.toFixed(2)} ${draft.currency}`}
          <span style={{ color: theme.meta }}> · never visible to the client</span>
        </div>

        {field(
          "Notes",
          <textarea
            style={{ ...fieldStyle, minHeight: "70px", resize: "vertical" }}
            value={draft.notes ?? ""}
            placeholder="Anything the team should know"
            onChange={(e) => set("notes", e.target.value)}
          />,
        )}

        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={draft.archivedAt !== undefined}
            onChange={(e) =>
              set("archivedAt", e.target.checked ? new Date().toISOString() : undefined)
            }
          />
          <span style={{ fontFamily: theme.fontMono, fontSize: "12px", color: theme.body }}>
            Archive — hide from the main list
          </span>
        </label>

        {error && (
          <span style={{ fontFamily: theme.fontMono, fontSize: "12px", color: "oklch(0.5 0.16 25)" }}>
            {error}
          </span>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "2px" }}>
          <button
            type="button"
            className="trip-page__reset trip-page__add"
            onClick={() => void save()}
            disabled={saving}
            style={{
              flex: 1,
              color: theme.bg,
              background: theme.ink,
              borderColor: theme.ink,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving…" : "Save"}
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
