/**
 * Signature pattern 1 — the perforation divider.
 *
 * A dashed rule with a scalloped notch straddling each edge, so consecutive
 * sections read as segments of one long ticket that could be torn apart.
 * Purely decorative, so it is hidden from assistive tech.
 */
export function SectionDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`px-5 py-6 ${className}`} aria-hidden="true">
      <div className="perf" />
    </div>
  );
}

/**
 * Vertical perforation — splits a boarding pass from its barcode stub.
 * Expects a parent with a known height (a flex row works).
 */
export function StubDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`relative self-stretch ${className}`} aria-hidden="true">
      <div className="perf-v h-full" />
    </div>
  );
}
