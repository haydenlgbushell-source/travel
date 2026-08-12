"use client";

import { useState } from "react";
import { CalendarPlus, Check, Share2 } from "lucide-react";
import type { Trip, TripDay } from "@/lib/types";
import { buildTripCalendar } from "@/lib/ics";

/**
 * The mockup's two bottom-bar buttons, given real handlers.
 *
 * Share prefers the Web Share sheet and falls back to copying the URL, which is
 * what desktop browsers can actually do. The calendar export is generated in
 * the browser from the itinerary — no server round-trip, no file storage.
 */
export function TripActions({ trip, days }: { trip: Trip; days: TripDay[] }) {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  async function handleShare() {
    const url = typeof window === "undefined" ? "" : window.location.href;
    const shareData = {
      title: trip.name,
      text: `${trip.name} — ${trip.coverRoute}`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User dismissed the sheet, or the browser refused — fall through to copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 2000);
    } catch {
      // Clipboard blocked (insecure context or denied permission) — nothing
      // useful left to try, so leave the button as-is rather than lying.
    }
  }

  function handleAddToCalendar() {
    const ics = buildTripCalendar(trip, days);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${trip.slug}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2 px-5">
      <button
        type="button"
        onClick={handleShare}
        className="
          flex flex-1 items-center justify-center gap-2 rounded-card border border-line
          bg-paper-hi px-4 py-3 text-sm font-semibold text-ink-text shadow-card
          transition-colors hover:border-lagoon/40
          focus-visible:outline focus-visible:outline-2
          focus-visible:outline-offset-2 focus-visible:outline-lagoon-dark
        "
      >
        {shareState === "copied" ? (
          <>
            <Check size={15} className="text-palm" aria-hidden="true" />
            Link copied
          </>
        ) : (
          <>
            <Share2 size={15} aria-hidden="true" />
            Share
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleAddToCalendar}
        className="
          flex flex-1 items-center justify-center gap-2 rounded-card bg-lagoon-dark
          px-4 py-3 text-sm font-semibold text-paper-hi shadow-card
          transition-opacity hover:opacity-90
          focus-visible:outline focus-visible:outline-2
          focus-visible:outline-offset-2 focus-visible:outline-lagoon-dark
        "
      >
        <CalendarPlus size={15} aria-hidden="true" />
        Add to calendar
      </button>
    </div>
  );
}
