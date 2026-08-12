import type { ReactNode } from "react";
import { PhoneFrame } from "@/components/shell/PhoneFrame";

/** Every editor screen sits in the same device frame as the itinerary itself. */
export default function EditLayout({ children }: { children: ReactNode }) {
  return <PhoneFrame>{children}</PhoneFrame>;
}
