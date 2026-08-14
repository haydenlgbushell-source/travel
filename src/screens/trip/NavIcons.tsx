/** Small stroke icons for the bottom menu and the header's hamburger.
 *  24×24, currentColor, no library — small enough to just draw. */

const COMMON = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" };

export function PlanIcon() {
  return (
    <svg {...COMMON} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
      <path d="M3.5 10h17" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

export function TravelIcon() {
  return (
    <svg {...COMMON} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="8.5" width="15" height="11.5" rx="2" />
      <path d="M9 8.5V6a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 6v2.5" />
      <path d="M4.5 13.5h15" />
    </svg>
  );
}

export function MapIcon() {
  return (
    <svg {...COMMON} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-7.4 7-12a7 7 0 0 0-14 0c0 4.6 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.3" />
    </svg>
  );
}

export function InfoIcon() {
  return (
    <svg {...COMMON} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.2" />
      <circle cx="12" cy="7.6" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

export function HamburgerIcon() {
  return (
    <svg
      width="19"
      height="14"
      viewBox="0 0 19 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
    >
      <path d="M1 2h17M1 7h17M1 12h17" />
    </svg>
  );
}
