import type { ReactNode } from "react";

/**
 * App shell.
 *
 * Mobile-first: on a real phone this is edge-to-edge and the frame chrome
 * disappears entirely. From `lg` up it becomes a centred device frame on a deep
 * ink backdrop, which is how the design was originally presented.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper lg:bg-ink lg:py-10">
      <div
        /*
         * `overflow-clip` rather than `overflow-hidden`: hidden makes this a
         * scroll container, which re-anchors the sticky bottom nav to the frame
         * instead of the viewport and drops it off-screen on desktop. Clip
         * rounds the corners without that side effect.
         */
        className="
          relative mx-auto min-h-dvh w-full bg-paper
          lg:min-h-0 lg:w-[420px] lg:overflow-clip lg:rounded-phone
          lg:border lg:border-ink-soft lg:shadow-phone
        "
      >
        {children}
      </div>
    </div>
  );
}
