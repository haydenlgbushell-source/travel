import { useState } from "react";
import type { Theme } from "../../theme";

/** A photo of the place, over the hatched fill the design uses when there
 *  isn't one. A missing or broken link falls back to that fill rather than
 *  leaving a torn image, so a bad URL costs nothing. */
export function Photo({
  url,
  caption,
  className,
  theme,
}: {
  url?: string;
  caption?: string;
  className: string;
  theme: Theme;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = url !== undefined && url !== "" && !failed;

  return (
    <div className={className} style={{ background: theme.photoFill }}>
      {showImage && (
        <img
          className="photo__img"
          src={url}
          alt={caption ?? ""}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
      {caption && (
        <span
          className="item__photo-tag"
          style={{
            fontFamily: theme.fontMono,
            background: theme.card,
            borderColor: theme.line,
          }}
        >
          {caption}
        </span>
      )}
    </div>
  );
}
