import { useState, type FormEvent } from "react";
import { updatePassword } from "./auth-data";
import "./auth.css";

/** Shown the moment a password-reset link's session lands — see
 *  onPasswordRecovery in auth-data.ts and its wiring in App.tsx. Whatever
 *  screen the app would otherwise be on waits behind this until a new
 *  password is actually set, the same way NamePage blocks a guest who
 *  hasn't picked a name yet. */
export function ResetPasswordScreen({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);

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
      await updatePassword(password);
      onDone();
    } catch {
      setError("Something went wrong on our end — try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-wordmark">Wayfare</span>
        <h1 className="auth-title">Set a new password</h1>
        <p className="auth-lede">Choose a new password for your account.</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-field">
            <span className="auth-field__label">New password</span>
            <input
              className="auth-field__input"
              type="password"
              autoComplete="new-password"
              autoFocus
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

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "Please wait…" : "Set password"}
          </button>
        </form>
      </div>
    </div>
  );
}
