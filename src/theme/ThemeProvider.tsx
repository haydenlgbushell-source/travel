import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import type { Theme } from "./types";

const ThemeContext = createContext<Theme | null>(null);

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme() must be used inside a <ThemeProvider>");
  return theme;
}

/** Theme tokens exposed as CSS custom properties, so plain CSS/CSS-modules
 *  in any descendant can style off `var(--wf-*)` without importing the
 *  theme object itself. */
function themeToCssVars(t: Theme): CSSProperties {
  return {
    "--wf-bg": t.bg,
    "--wf-card": t.card,
    "--wf-strip": t.strip,
    "--wf-line": t.line,
    "--wf-ink": t.ink,
    "--wf-body": t.body,
    "--wf-meta": t.meta,
    "--wf-head-bg": t.headBg,
    "--wf-head-ink": t.headInk,
    "--wf-head-meta": t.headMeta,
    "--wf-avatar-bg": t.avatarBg,
    "--wf-accent": t.accent,
    "--wf-accent-ink": t.accentInk,
    "--wf-btn-ink": t.btnInk,
    "--wf-tag-bg": t.tagBg,
    "--wf-tag-ink": t.tagInk,
    "--wf-ok-ink": t.okInk,
    "--wf-warn-bg": t.warnBg,
    "--wf-warn-ink": t.warnInk,
    "--wf-star": t.star,
    "--wf-photo-fill": t.photoFill,
    "--wf-frame-radius": t.frameRadius,
    "--wf-card-radius": t.cardRadius,
    "--wf-pill-radius": t.pillRadius,
    "--wf-chip-radius": t.chipRadius,
    "--wf-font-display": t.fontDisplay,
    "--wf-font-sans": t.fontSans,
    "--wf-font-mono": t.fontMono,
    "--wf-word-track": t.wordTrack,
  } as CSSProperties;
}

export function ThemeProvider({
  theme,
  className,
  style,
  children,
}: {
  theme: Theme;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <ThemeContext.Provider value={theme}>
      <div className={className} style={{ ...themeToCssVars(theme), ...style }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
