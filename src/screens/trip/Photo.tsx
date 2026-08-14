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
  /* Remember which URL failed, not merely that one did — otherwise swapping a
     broken link for a good one leaves the picture hidden. */
  const [failedUrl, setFailedUrl] = useState<string>();
  const showImage = url !== undefined && url !== "" && failedUrl !== url;

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
          onError={() => setFailedUrl(url)}
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
