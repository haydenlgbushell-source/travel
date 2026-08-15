import { useState } from "react";
import type { Theme } from "../../theme";
import { Sheet } from "./Sheet";
import {
  ITEM_KINDS,
  KIND_HEADINGS,
  encodeShare,
  shareText,
  type ItemKind,
  type PastTrip,
} from "./trip-data";

/** The list travels inside the link, so whoever opens it needs no account
 *  and there is nothing to keep running. */
function shareUrl(trip: PastTrip, kinds: ItemKind[], from: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#s=${encodeShare(trip, kinds, from)}`;
}

export function ShareSheet({
  trip,
  onClose,
  theme,
}: {
  trip: PastTrip;
  onClose: () => void;
  theme: Theme;
}) {
  const [kinds, setKinds] = useState<ItemKind[]>(["Eat", "Stay", "Do"]);
  const [from, setFrom] = useState("");
  const [done, setDone] = useState<string | undefined>();

  const counts = Object.fromEntries(
    ITEM_KINDS.map((kind) => [kind, trip.places.filter((p) => p.kind === kind).length]),
  ) as Record<ItemKind, number>;
  const chosen = trip.places.filter((p) => kinds.includes(p.kind));

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setDone(label);
      setTimeout(() => setDone(undefined), 2500);
    } catch {
      setDone("Copying is blocked here — select the text instead");
    }
  }

  const url = shareUrl(trip, kinds, from.trim());

  return (
    <Sheet title="Share these places" className="add-sheet" onClose={onClose} theme={theme}>
      <div className="add-sheet__section">
        <span
          className="wf-card__eyebrow"
          style={{ fontFamily: theme.fontMono, color: theme.meta }}
        >
          What to include
        </span>
        {ITEM_KINDS.map((kind) => {
          const on = kinds.includes(kind);
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={on}
              disabled={counts[kind] === 0}
              className="trip-page__reset add-sheet__toggle"
              onClick={() =>
                setKinds((prev) =>
                  prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind],
                )
              }
              style={{ opacity: counts[kind] === 0 ? 0.4 : 1 }}
            >
              <span
                className="add-sheet__checkbox"
                style={{
                  borderColor: on ? theme.ink : theme.line,
                  background: on ? theme.ink : "transparent",
                  color: theme.bg,
                }}
              >
                {on ? "✓" : ""}
              </span>
              <span style={{ color: theme.ink }}>
                {KIND_HEADINGS[kind]}
                <span style={{ color: theme.meta }}> · {counts[kind]}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="add-sheet__field">
        <label
          htmlFor="share-from"
          className="wf-card__eyebrow"
          style={{ fontFamily: theme.fontMono, color: theme.meta }}
        >
          Your name, so they know who sent it
        </label>
        <input
          id="share-from"
          className="add-sheet__input"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="Optional"
          style={{
            fontFamily: theme.fontSans,
            background: theme.card,
            borderColor: theme.line,
            color: theme.ink,
          }}
        />
      </div>

      <span
        className="add-sheet__foot"
        style={{ fontFamily: theme.fontMono, color: theme.meta }}
      >
        {chosen.length} place{chosen.length === 1 ? "" : "s"} · the link carries the list
      </span>

      <button
        type="button"
        className="trip-page__reset add-sheet__submit"
        disabled={chosen.length === 0}
        onClick={async () => {
          if (navigator.share) {
            try {
              await navigator.share({ title: `${trip.name} · ${trip.dates}`, url });
              return;
            } catch {
              /* dismissed — fall through to copying */
            }
          }
          await copy(url, "Link copied");
        }}
        style={{
          color: chosen.length ? theme.bg : theme.meta,
          background: chosen.length ? theme.ink : theme.line,
          cursor: chosen.length ? "pointer" : "not-allowed",
        }}
      >
        Share the link
      </button>

      <button
        type="button"
        className="trip-page__reset add-sheet__more"
        style={{ alignSelf: "center", fontFamily: theme.fontMono, color: theme.accent }}
        onClick={() => copy(shareText(trip, kinds, from.trim()), "List copied as text")}
      >
        Copy as text instead
      </button>

      {done && (
        <span
          role="status"
          className="add-sheet__foot"
          style={{ fontFamily: theme.fontMono, color: theme.okInk }}
        >
          {done}
        </span>
      )}
    </Sheet>
  );
}
