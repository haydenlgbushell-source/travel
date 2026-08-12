"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Info,
  MapPin,
  Plane,
  Receipt,
  Ticket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Shortcut {
  id: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Note the last slot: the mockup's "Docs" vault is gone — the product does not
 * take uploads of personal documents — so the slot points at reference info
 * (entry requirements + emergency contacts) instead.
 */
const SHORTCUTS: Shortcut[] = [
  { id: "trip", label: "Trip", icon: Ticket },
  { id: "stay", label: "Stay", icon: MapPin },
  { id: "flights", label: "Flights", icon: Plane },
  { id: "today", label: "Plan", icon: Calendar },
  { id: "budget", label: "Budget", icon: Receipt },
  { id: "info", label: "Info", icon: Info },
];

/**
 * Sticky bottom shortcut nav with scroll-spy.
 *
 * One IntersectionObserver watches every section; we keep the live ratios in a
 * ref and mark the section nearest the top of the viewport as active, so
 * scrolling past a short section doesn't leave the previous one lit.
 */
export function ShortcutNav() {
  const [activeId, setActiveId] = useState<string>(SHORTCUTS[0].id);
  const ratios = useRef(new Map<string, number>());

  useEffect(() => {
    const sections = SHORTCUTS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.current.set(entry.target.id, entry.intersectionRatio);
        }

        // Highest visible section wins; ties break toward document order.
        let best: string | null = null;
        let bestRatio = 0;
        for (const section of sections) {
          const ratio = ratios.current.get(section.id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = section.id;
          }
        }
        if (best) setActiveId(best);
      },
      {
        // Ignore the strip under the nav so the active item flips when a
        // section reaches reading position, not when it first peeks in.
        rootMargin: "-8% 0px -45% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Itinerary sections"
      className="
        sticky bottom-0 z-30 border-t border-ink-soft bg-ink/95 backdrop-blur
        pb-[env(safe-area-inset-bottom)]
      "
    >
      <ul className="flex items-stretch justify-between px-1 py-1.5">
        {SHORTCUTS.map(({ id, label, icon: Icon }) => {
          const isActive = id === activeId;
          return (
            <li key={id} className="flex-1">
              <a
                href={`#${id}`}
                aria-current={isActive ? "true" : undefined}
                className={`
                  flex flex-col items-center gap-1 rounded-pill px-1 py-1.5
                  text-[10px] font-medium transition-colors
                  focus-visible:outline focus-visible:outline-2
                  focus-visible:outline-offset-2 focus-visible:outline-paper
                  ${isActive ? "bg-lagoon-dark text-paper-hi" : "text-paper/60 hover:text-paper"}
                `}
              >
                <Icon size={16} strokeWidth={2} aria-hidden="true" />
                <span>{label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
