import { Map as MapIcon } from "lucide-react";
import { Card, Overline, SectionHeading } from "@/components/shell/Card";

/**
 * Placeholder. Deliberately styled as a blueprint rather than a fake map, so
 * nobody mistakes it for real geography. Swap the inner block for a Mapbox GL
 * or Google Maps embed pinned to the trip's stops.
 */
export function TripMap({ label }: { label: string }) {
  return (
    <section aria-labelledby="map-heading">
      <SectionHeading title="Where you'll be" meta={label} />
      <div className="px-5">
        <Card className="overflow-hidden">
          <h3 id="map-heading" className="sr-only">
            Trip map
          </h3>
          <div
            className="
              relative flex h-40 items-center justify-center
              bg-[radial-gradient(circle_at_1px_1px,#DCCFAF_1px,transparent_0)]
              bg-paper [background-size:14px_14px]
            "
          >
            {/* Suggestion of a route between the three bases. */}
            <svg
              viewBox="0 0 320 160"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <path
                d="M60 118 C 120 90, 150 130, 200 96 S 268 52, 268 52"
                fill="none"
                stroke="#1C7C8C"
                strokeWidth="2"
                strokeDasharray="5 5"
                opacity="0.7"
              />
              <circle cx="60" cy="118" r="5" fill="#125866" />
              <circle cx="200" cy="96" r="5" fill="#125866" />
              <circle cx="268" cy="52" r="5" fill="#FF7A45" />
            </svg>

            <div className="relative flex flex-col items-center gap-1.5 text-muted">
              <MapIcon size={20} aria-hidden="true" />
              <Overline>Map integration pending</Overline>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
