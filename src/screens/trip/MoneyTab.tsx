import type { Theme } from "../../theme";
import { BUDGET, CURRENCIES, dayTotal, money, type Day } from "./trip-data";

export function MoneyTab({
  days,
  resolved,
  currency,
  onCurrencyChange,
  theme,
}: {
  days: Day[];
  resolved: Record<string, string>;
  currency: string;
  onCurrencyChange: (code: string) => void;
  theme: Theme;
}) {
  const totals = days.map((day) => dayTotal(day, resolved));
  const maxCost = Math.max(...totals, 1);

  return (
    <div className="trip-page__stack trip-page__tab-panel">
      <div
        className="wf-card wf-card--pad"
        style={{ background: theme.card, borderColor: theme.line, gap: "12px" }}
      >
        <div className="money__head">
          <label
            className="wf-card__eyebrow currency"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            Shared spend
            <select
              className="currency__select"
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              aria-label="Currency"
              style={{
                fontFamily: theme.fontMono,
                color: theme.ink,
                background: theme.strip,
                borderColor: theme.line,
              }}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </label>
          <span
            className="wf-card__eyebrow"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            Split 5 ways
          </span>
        </div>

        <div className="money__rows">
          {BUDGET.rows.map((row) => (
            <div key={row.label} className="money__row">
              <span className="money__label" style={{ color: theme.ink }}>
                {row.label}
              </span>
              <span
                className="money__each"
                style={{ fontFamily: theme.fontMono, color: theme.body }}
              >
                {money(row.each, currency)}
              </span>
              <span
                className="money__total"
                style={{ fontFamily: theme.fontMono, color: theme.ink }}
              >
                {money(row.total, currency)}
              </span>
            </div>
          ))}
        </div>

        <div className="money__head">
          <span
            className="money__sum-label"
            style={{ fontFamily: theme.fontMono, color: theme.meta }}
          >
            Total · each
          </span>
          <span
            className="money__sum-value"
            style={{ fontFamily: theme.fontDisplay, color: theme.ink }}
          >
            {money(BUDGET.total, currency)} · {money(BUDGET.each, currency)}
          </span>
        </div>
      </div>

      <div
        className="wf-card wf-card--pad"
        style={{ background: theme.card, borderColor: theme.line, gap: "11px" }}
      >
        <div
          className="wf-card__eyebrow"
          style={{ fontFamily: theme.fontMono, color: theme.meta }}
        >
          Day by day
        </div>
        {days.map((day, i) => (
          <div key={day.num} className="bar">
            <span
              className="bar__label"
              style={{ fontFamily: theme.fontMono, color: theme.body }}
            >
              {day.dow} {day.num}
            </span>
            <span className="bar__track">
              <span
                className="bar__fill"
                style={{ width: `${Math.round((totals[i] / maxCost) * 100)}%` }}
              />
            </span>
            <span
              className="bar__value"
              style={{ fontFamily: theme.fontMono, color: theme.ink }}
            >
              {money(totals[i], currency)}
            </span>
          </div>
        ))}
      </div>

      <div
        className="wf-card wf-card--pad"
        style={{ background: theme.card, borderColor: theme.line, gap: "10px" }}
      >
        <div
          className="wf-card__eyebrow"
          style={{ fontFamily: theme.fontMono, color: theme.meta }}
        >
          Who owes who
        </div>
        {BUDGET.owes.map((owe) => (
          <div key={owe.who} className="owes__row">
            <span className="owes__who" style={{ color: theme.body }}>
              {owe.who}
            </span>
            <span className="owes__amount" style={{ fontFamily: theme.fontMono }}>
              {money(owe.amount, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
