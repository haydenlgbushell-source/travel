import { useEffect, useId, useRef, type ReactNode } from "react";
import type { Theme } from "../../theme";

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The bottom-sheet shell both sheets sit in. Everything that makes it a
 *  real dialog — Escape, a focus trap, returning focus to whatever opened
 *  it — lives here so neither sheet has to remember. */
export function Sheet({
  title,
  className,
  onClose,
  theme,
  children,
}: {
  title: string;
  className?: string;
  onClose: () => void;
  theme: Theme;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;

      const focusable = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <>
      <div className="sheet__scrim" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={className ? `sheet ${className}` : "sheet"}
        style={{ background: theme.bg }}
      >
        <div className="sheet__grabber" />
        <div className="sheet__head">
          <span
            id={titleId}
            className="sheet__title"
            style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
          >
            {title}
          </span>
          <button
            type="button"
            className="trip-page__reset sheet__close"
            onClick={onClose}
            style={{ fontFamily: theme.fontMono, color: theme.body }}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
