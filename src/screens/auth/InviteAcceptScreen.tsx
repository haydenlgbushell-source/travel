import { useEffect, useState } from "react";
import { acceptInvite, getInvite, type InviteInfo } from "../trip/trip-data";
import "./auth.css";

/** Reached via `#invite=<token>` once someone's signed in with a name set —
 *  parallel to the `#s=` share-link fragment, but this one needs a real
 *  account, since it grants real write access rather than a read-only
 *  snapshot. */
export function InviteAcceptScreen({
  token,
  onJoined,
  onDecline,
}: {
  token: string;
  onJoined: (tripId: string) => void;
  onDecline: () => void;
}) {
  const [invite, setInvite] = useState<InviteInfo | undefined | null>(undefined);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    getInvite(token)
      .then((info) => {
        if (!cancelled) setInvite(info ?? null);
      })
      .catch(() => {
        if (!cancelled) setInvite(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function join() {
    setJoining(true);
    setError(undefined);
    try {
      const tripId = await acceptInvite(token);
      onJoined(tripId);
    } catch {
      setError("That link isn't valid any more — it may have expired or already been used.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-wordmark">Wayfare</span>

        {invite === undefined ? (
          <p className="auth-lede">Checking that link…</p>
        ) : invite === null || (invite && !invite.valid) ? (
          <>
            <h1 className="auth-title">That invite isn't valid</h1>
            <p className="auth-lede">
              It may have expired or already been used — ask whoever sent it for a new one.
            </p>
            <button type="button" className="auth-submit" onClick={onDecline}>
              Continue
            </button>
          </>
        ) : (
          <>
            <h1 className="auth-title">You're invited</h1>
            <p className="auth-lede">
              Join <strong>{invite.tripName}</strong> as {invite.role === "Editor" ? "an editor" : "a contributor"} —{" "}
              {invite.role === "Editor"
                ? "you'll be able to add and change plan items directly."
                : "you'll be able to suggest items for an editor to approve."}
            </p>

            {error && <div className="auth-error">{error}</div>}

            <button type="button" className="auth-submit" disabled={joining} onClick={join}>
              {joining ? "Joining…" : "Join the trip"}
            </button>
            <button type="button" className="auth-switch" onClick={onDecline}>
              Not now
            </button>
          </>
        )}
      </div>
    </div>
  );
}
