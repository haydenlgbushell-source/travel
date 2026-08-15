import { useState, type FormEvent } from "react";
import "./auth.css";

export function NamePage({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    onSubmit(name.trim());
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-wordmark">Wayfare</span>
        <h1 className="auth-title">What's your name?</h1>
        <p className="auth-lede">This is what the rest of the group will see you as.</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-field">
            <span className="auth-field__label">Your name</span>
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

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
