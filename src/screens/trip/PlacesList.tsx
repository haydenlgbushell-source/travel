import type { Theme } from "../../theme";
import { Photo } from "./Photo";
import { ITEM_KINDS, KIND_HEADINGS, type ItemKind } from "./trip-data";

export interface Place {
  kind: ItemKind;
  title: string;
  place?: string;
  note?: string;
  rating?: string;
  photoUrl?: string;
  day?: string;
}

/** The shared shape of a saved trip and a shared list: places grouped by
 *  what they are, because that is how somebody else reads them. */
export function PlacesList({ places, theme }: { places: Place[]; theme: Theme }) {
  return (
    <>
      {ITEM_KINDS.map((kind) => {
        const group = places.filter((p) => p.kind === kind);
        if (group.length === 0) return null;
        return (
          <div key={kind} className="trip-page__stack trip-page__stack--tight trip-page__stack--cards">
            <span
              className="wf-card__eyebrow"
              style={{ fontFamily: theme.fontMono, color: theme.meta }}
            >
              {KIND_HEADINGS[kind]} · {group.length}
            </span>
            {group.map((item, i) => (
              <div
                key={`${item.title}-${i}`}
                className="place"
                style={{ background: theme.card, borderColor: theme.line }}
              >
                {item.photoUrl && (
                  <Photo className="place__photo" url={item.photoUrl} theme={theme} />
                )}
                <div className="place__head">
                  <span className="place__title" style={{ color: theme.ink }}>
                    {item.title}
                  </span>
                  {item.rating && (
                    <span className="place__rating" style={{ fontFamily: theme.fontMono }}>
                      <span style={{ color: theme.star }}>★</span> {item.rating}
                    </span>
                  )}
                </div>
                {item.place && item.place !== "Not set" && (
                  <span
                    className="place__where"
                    style={{ fontFamily: theme.fontMono, color: theme.body }}
                  >
                    {item.place}
                  </span>
                )}
                {item.note && (
                  <span className="place__note" style={{ color: theme.body }}>
                    {item.note}
                  </span>
                )}
                {item.day && (
                  <span
                    className="place__day"
                    style={{ fontFamily: theme.fontMono, color: theme.meta }}
                  >
                    {item.day}
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
