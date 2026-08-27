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

/* Money and People only appear in the sidebar a desktop has room for — on a
   phone they stay behind the menu, which uses words rather than icons. */
export function MoneyIcon() {
  return (
    <svg {...COMMON} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.8" y="6" width="18.4" height="12" rx="2.2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6.2 9.4v5.2M17.8 9.4v5.2" />
    </svg>
  );
}

export function PeopleIcon() {
  return (
    <svg {...COMMON} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9.4" cy="8.6" r="3.1" />
      <path d="M3.6 19.4a5.8 5.8 0 0 1 11.6 0" />
      <path d="M16 6.2a3.1 3.1 0 0 1 0 5.9" />
      <path d="M17.4 14.4a5.8 5.8 0 0 1 3 5" />
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
