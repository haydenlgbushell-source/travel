import { useEffect, useRef, useState, type FormEvent } from "react";
import { signInAsGuest, setAccountName, type Account } from "./auth-data";
import { redeemAccessCode } from "../trip/trip-data";
import "./auth.css";

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
  const [step, setStep] = useState<"loading" | "name" | "joining" | "error">("loading");
  const [error, setError] = useState<string>();
  const [name, setName] = useState("");
  const guestRef = useRef<Account | undefined>(undefined);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        if (account) {
          guestRef.current = account;
          if (account.name) {
            await join();
            return;
          }
        } else {
          guestRef.current = await signInAsGuest();
        }
        setStep("name");
      } catch {
        setError(
          "That link isn't valid any more — it may have expired or already reached its limit. Ask whoever sent it for a new one.",
        );
        setStep("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, account]);

  async function join() {
    setStep("joining");
    try {
      const tripId = await redeemAccessCode(code);
      onJoined(tripId);
    } catch {
      setError(
        "That link isn't valid any more — it may have expired or already reached its limit. Ask whoever sent it for a new one.",
      );
      setStep("error");
    }
  }

  async function handleNameSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed && guestRef.current) {
      try {
        await setAccountName(guestRef.current.id, trimmed);
      } catch {
        // Not fatal — worst case they join without a name saved.
      }
    }
    await join();
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-wordmark">Wayfare</span>
        {step === "error" ? (
          <>
            <h1 className="auth-title">That link isn't valid</h1>
            <p className="auth-lede">{error}</p>
            <button type="button" className="auth-submit" onClick={onDecline}>
              Continue
            </button>
          </>
        ) : step === "name" ? (
          <>
            <h1 className="auth-title">Join the trip</h1>
            <p className="auth-lede">
              No account, no password — you're in as soon as you tap Join. Add your name first if
              you want the rest of the group to know who you are.
            </p>
            <form className="auth-form" onSubmit={handleNameSubmit} noValidate>
              <label className="auth-field">
                <span className="auth-field__label">Your name (optional)</span>
                <input
                  className="auth-field__input"
                  type="text"
                  autoComplete="name"
                  autoFocus
                  placeholder="Ana Novak"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <button type="submit" className="auth-submit">
                Join the trip
              </button>
            </form>
          </>
        ) : (
          <p className="auth-lede">Joining the trip…</p>
        )}
      </div>
    </div>
  );
}
