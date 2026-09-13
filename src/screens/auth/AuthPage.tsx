import { useState, type FormEvent } from "react";
import { isValidPhoneNumber } from "libphonenumber-js/mobile";
import { requestPasswordReset, signIn, signUp, type Account } from "./auth-data";
import { combineMobile, DEFAULT_DIAL_CODE, DIAL_CODES } from "./dial-codes";
import "./auth.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthPage({
  onAuthenticated,
  banner,
  initialMode,
}: {
  onAuthenticated: (account: Account) => void;
  /** A short note shown above the title — used when something sent someone
   *  here mid-task (joining a trip, say) so the form doesn't just look like
   *  an unrelated sign-up wall. */
  banner?: string;
  /** Overrides the default "sign in" landing — needed wherever `banner`
   *  explains why someone landed here to *create* an account (an
   *  anonymous-join detour, say); without it the page opens on "Welcome
   *  back" directly under a banner telling them to sign up. */
  initialMode?: "signup" | "signin";
}) {
  const [mode, setMode] = useState<"signup" | "signin" | "reset" | "code">(initialMode ?? "signin");
  const [dialCode, setDialCode] = useState(DEFAULT_DIAL_CODE);
  const [mobile, setMobile] = useState("");
  const fullMobile = combineMobile(dialCode, mobile);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tripCode, setTripCode] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const isSignUp = mode === "signup";
  const isReset = mode === "reset";
  const isCode = mode === "code";

  function switchMode(next: "signup" | "signin" | "reset" | "code") {
    setMode(next);
    setError(undefined);
    setConfirmationPending(false);
    setResetSent(false);
    setPassword("");
    setConfirmPassword("");
    setTripCode("");
  }

  /** A trip code is just an access code someone would otherwise have
   *  reached by tapping a link — routing through the same `#access=`
   *  fragment App.tsx already watches means this needs no redemption logic
   *  of its own, and the organiser sees identical behaviour whichever way
   *  it was typed in. */
  function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    /* Codes are issued upper-case (see createAccessCode) and matched
       exactly server-side — normalising here means a lower-case guess from
       a desktop keyboard isn't a silent, confusing miss. */
    const trimmed = tripCode.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter the code you were given.");
      return;
    }
    window.location.hash = `access=${encodeURIComponent(trimmed)}`;
  }

  async function handleResetRequest(e: FormEvent) {
    e.preventDefault();
    setError(undefined);

    if (mobile.trim() === "") {
      setError("Enter a mobile number.");
      return;
    }
    if (!isValidPhoneNumber(fullMobile)) {
      setError("That doesn't look like a valid number for the country selected.");
      return;
    }

    setBusy(true);
    try {
      const result = await requestPasswordReset(fullMobile);
      if ("error" in result) {
        setError("No account with that mobile number.");
        return;
      }
      setResetSent(true);
    } catch {
      setError("Something went wrong on our end — try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);

    if (mobile.trim() === "") {
      setError("Enter a mobile number.");
      return;
    }
    if (!isValidPhoneNumber(fullMobile)) {
      setError("That doesn't look like a valid number for the country selected.");
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
        const result = await signUp(fullMobile, email, password);
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
        const result = await signIn(fullMobile, password);
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

  if (resetSent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="auth-wordmark">Wayfare</span>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-lede">
            If that mobile number has an account, we've sent a link to its email address — open
            it to set a new password, then come back here and sign in.
          </p>
          <button type="button" className="auth-submit" onClick={() => switchMode("signin")}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (isCode) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="auth-wordmark">Wayfare</span>
          <h1 className="auth-title">Enter your trip code</h1>
          <p className="auth-lede">
            No account needed — whoever's organising the trip can hand you a short code that opens
            it straight away, and keeps opening it, even if your phone asks you to sign in again.
          </p>

          <form className="auth-form" onSubmit={handleCodeSubmit} noValidate>
            <label className="auth-field">
              <span className="auth-field__label">Trip code</span>
              <input
                className="auth-field__input auth-field__input--code"
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                autoComplete="off"
                autoFocus
                placeholder="A1B2C3"
                value={tripCode}
                onChange={(e) => setTripCode(e.target.value)}
              />
            </label>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button type="submit" className="auth-submit">
              Continue
            </button>
          </form>

          <button type="button" className="auth-switch" onClick={() => switchMode("signin")}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (isReset) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="auth-wordmark">Wayfare</span>
          <h1 className="auth-title">Reset your password</h1>
          <p className="auth-lede">
            Enter the mobile number on your account and we'll email you a link to set a new
            password.
          </p>

          <form className="auth-form" onSubmit={handleResetRequest} noValidate>
            <label className="auth-field">
              <span className="auth-field__label">Mobile number</span>
              <div className="auth-field__phone">
                <select
                  className="auth-field__dial-code"
                  aria-label="Country code"
                  value={dialCode}
                  onChange={(e) => setDialCode(e.target.value)}
                >
                  {DIAL_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  className="auth-field__input"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  autoFocus
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
            </label>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? "Please wait…" : "Send reset link"}
            </button>
          </form>

          <button type="button" className="auth-switch" onClick={() => switchMode("signin")}>
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
            <div className="auth-field__phone">
              <select
                className="auth-field__dial-code"
                aria-label="Country code"
                value={dialCode}
                onChange={(e) => setDialCode(e.target.value)}
              >
                {DIAL_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                className="auth-field__input"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
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
            {!isSignUp && (
              <button
                type="button"
                className="auth-forgot"
                onClick={() => switchMode("reset")}
              >
                Forgot password?
              </button>
            )}
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

          {error && <div className="auth-error" role="alert">{error}</div>}

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
        {!isSignUp && (
          <button type="button" className="auth-switch" onClick={() => switchMode("code")}>
            Have a trip code instead?
          </button>
        )}
      </div>
    </div>
  );
}
