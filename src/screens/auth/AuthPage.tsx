import { useState, type FormEvent } from "react";
import { signIn, signUp, type Account } from "./auth-data";
import "./auth.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthPage({ onAuthenticated }: { onAuthenticated: (account: Account) => void }) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === "signup";

  function switchMode(next: "signup" | "signin") {
    setMode(next);
    setError(undefined);
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
              : "That email is already in use.",
          );
          return;
        }
        onAuthenticated(result.account);
      } else {
        const result = await signIn(mobile, password);
        if ("error" in result) {
          setError(
            result.error === "not-found"
              ? "No account with that mobile number."
              : "Wrong password.",
          );
          return;
        }
        onAuthenticated(result.account);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-wordmark">Wayfare</span>
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

        <p className="auth-note">
          Stored on this device only — there's no server behind this yet, so it won't follow
          you to another phone or browser.
        </p>
      </div>
    </div>
  );
}
