import { useEffect, useRef, useState } from "react";
import { signInAsGuest, type Account } from "./auth-data";
import { redeemAccessCode } from "../trip/trip-data";
import "./auth.css";

/** Reached via `#access=<code>` — the lightweight path for a client who
 *  isn't going to create an account. No confirmation step (unlike
 *  InviteAcceptScreen): redeems automatically on load, since the whole
 *  point of a code over an invite is fewer taps for someone who's here
 *  once, for one trip. */
export function AccessCodeScreen({
  code,
  account,
  onJoined,
  onDecline,
}: {
  code: string;
  account: Account | undefined;
  onJoined: (tripId: string) => void;
  onDecline: () => void;
}) {
  const [error, setError] = useState<string>();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        if (!account) await signInAsGuest();
        const tripId = await redeemAccessCode(code);
        onJoined(tripId);
      } catch {
        setError(
          "That link isn't valid any more — it may have expired or already reached its limit. Ask whoever sent it for a new one.",
        );
      }
    })();
    // onJoined identity isn't stable across renders and re-running this on
    // every render would redeem the code again — it only needs to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, account]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-wordmark">Wayfare</span>
        {error ? (
          <>
            <h1 className="auth-title">That link isn't valid</h1>
            <p className="auth-lede">{error}</p>
            <button type="button" className="auth-submit" onClick={onDecline}>
              Continue
            </button>
          </>
        ) : (
          <p className="auth-lede">Joining the trip…</p>
        )}
      </div>
    </div>
  );
}
