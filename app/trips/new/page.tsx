import type { Metadata } from "next";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { EditShell } from "@/components/edit/EditShell";
import { TripForm } from "@/components/edit/TripForm";

export const metadata: Metadata = { title: "New trip" };

export default function NewTripPage() {
  return (
    <PhoneFrame>
      <EditShell
        title="Start a trip"
        meta="You can change any of this later."
        backHref="/"
        backLabel="Your trips"
      >
        <TripForm />
      </EditShell>
    </PhoneFrame>
  );
}
