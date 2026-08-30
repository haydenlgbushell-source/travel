import { useEffect, useState, type FormEvent } from "react";
import { getAgencyInvite, type AgencyInviteInfo } from "../agency/agency-data";
import { signUp } from "./auth-data";
import "./auth.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reached via `#agency-invite=<token>` — always signed out (App.tsx only
 *  renders this ahead of the boot sequence while there's no account yet).
 *  Mirrors AuthPage's sign-up form, but the account it creates carries the
 *  invite token through to redemption once a session exists — see
 *  auth-data.ts's signUp() and the agency_invites migration. */
export function AgencyInviteAcceptScreen({
  token,
  onSignedUp,
  onDecline,
}: {
  token: string;
  onSignedUp: () => void;
  onDecline: () => void;
}) {
  const [invite, setInvite] = useState<AgencyInviteInfo | undefined | null>(undefined);
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAgencyInvite(token)
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);

    if (mobile.replace(/[^\d]/g, "").length < 7) {
      setError("Enter a mobile number.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password needs at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setBusy(true);
    try {
      const result = await signUp(mobile, email, password, token);
      if ("error" in result) {
        setError(
          result.error === "mobile-taken"
            ? "That mobile number already has an account — sign in instead."
            : result.error === "email-taken"
              ? "That email is already in use."
              : "Too many attempts in a short time — wait a few minutes and try again.",
        );
        return;
      }
      if ("confirmationPending" in result) {
        setConfirmationPending(true);
        return;
      }
      onSignedUp();
    } catch {
      setError("Something went wrong on our end — try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  if (confirmationPending) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="auth-wordmark">Wayfare</span>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-lede">
            We sent a confirmation link to {email.trim()}. Open it, then come back here and sign
            in with your mobile number and password.
          </p>
          <button type="button" className="auth-submit" onClick={onDecline}>
            Back to sign in
          </button>
        </div>
      </div>
    );
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
            <h1 className="auth-title">Set up {invite.agencyName}</h1>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <label className="auth-field">
                <span className="auth-field__label">Mobile number</span>
                <input
                  className="auth-field__input"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+1 312-555-0114"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </label>

              <label className="auth-field">
                <span className="auth-field__label">Email address</span>
                <input
                  className="auth-field__input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="auth-field">
                <span className="auth-field__label">Password</span>
                <input
                  className="auth-field__input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              <label className="auth-field">
                <span className="auth-field__label">Confirm password</span>
                <input
                  className="auth-field__input"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
              {confirmPassword.length > 0 && (
                <span
                  className={
                    password === confirmPassword
                      ? "auth-field__match auth-field__match--ok"
                      : "auth-field__match auth-field__match--mismatch"
                  }
                >
                  {password === confirmPassword ? "Passwords match" : "Passwords don't match"}
                </span>
              )}

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="auth-submit" disabled={busy}>
                {busy ? "Please wait…" : "Create account"}
              </button>
            </form>

            <button type="button" className="auth-switch" onClick={onDecline}>
              Sign in instead
            </button>
          </>
        )}
      </div>
    </div>
  );
}
