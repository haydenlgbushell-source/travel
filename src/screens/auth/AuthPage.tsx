import { useState, type FormEvent } from "react";
import { signIn, signUp, type Account } from "./auth-data";
import "./auth.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthPage({
  onAuthenticated,
  banner,
}: {
  onAuthenticated: (account: Account) => void;
  /** A short note shown above the title — used when something sent someone
   *  here mid-task (joining a trip, say) so the form doesn't just look like
   *  an unrelated sign-up wall. */
  banner?: string;
}) {
  const [mode, setMode] = useState<"signup" | "signin">("signin");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);

  const isSignUp = mode === "signup";

  function switchMode(next: "signup" | "signin") {
    setMode(next);
    setError(undefined);
    setConfirmationPending(false);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);

    if (mobile.replace(/[^\d]/g, "").length < 7) {
      setError("Enter a mobile number.");
      return;
    }
    if (isSignUp && !EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password needs at least 6 characters.");
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setBusy(true);
    try {
      if (isSignUp) {
        const result = await signUp(mobile, email, password);
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
        onAuthenticated(result.account);
      } else {
        const result = await signIn(mobile, password);
        if ("error" in result) {
          setError(
            result.error === "not-found"
              ? "No account with that mobile number."
              : result.error === "not-confirmed"
                ? "Confirm your email first — check the link we sent when you signed up."
                : "Wrong password.",
          );
          return;
        }
        onAuthenticated(result.account);
      }
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
          <button type="button" className="auth-submit" onClick={() => switchMode("signin")}>
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
        {banner && <p className="auth-banner">{banner}</p>}
        <h1 className="auth-title">{isSignUp ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-lede">
          {isSignUp
            ? "Your mobile number is your username."
            : "Sign in with your mobile number and password."}
        </p>

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

          {isSignUp && (
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
          )}

          <label className="auth-field">
            <span className="auth-field__label">Password</span>
            <input
              className="auth-field__input"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {isSignUp && (
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
          )}
          {isSignUp && confirmPassword.length > 0 && (
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
            {busy ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch"
          onClick={() => switchMode(isSignUp ? "signin" : "signup")}
        >
          {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}
