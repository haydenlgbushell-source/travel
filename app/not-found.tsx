import Link from "next/link";
import { PhoneFrame } from "@/components/shell/PhoneFrame";

export default function NotFound() {
  return (
    <PhoneFrame>
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center lg:min-h-[560px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-lagoon-dark">
          404
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink">
          No trip here
        </h1>
        <p className="text-sm leading-relaxed text-muted">
          This itinerary doesn&rsquo;t exist, or you&rsquo;re not on the guest
          list for it.
        </p>
        <Link
          href="/"
          className="
            mt-2 rounded-pill bg-lagoon-dark px-5 py-2.5 text-sm font-semibold text-paper-hi
            transition-opacity hover:opacity-90
            focus-visible:outline focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-lagoon-dark
          "
        >
          Back to your trips
        </Link>
      </div>
    </PhoneFrame>
  );
}
