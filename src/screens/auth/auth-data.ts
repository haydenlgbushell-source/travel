/* ---------- local accounts ----------
 * There's no backend behind this app — everything lives in the browser's
 * localStorage, the same as the trip data itself. That means this is not
 * real security: anyone with access to this browser's storage can read the
 * account list. Passwords are still hashed (SHA-256, salted per account)
 * rather than kept as plain text, so at least a casual look at storage
 * doesn't hand over a password someone reuses elsewhere — but this is a
 * long way from a real auth system and shouldn't be treated as one. */

const ACCOUNTS_KEY = "wayfare.accounts.v1";
const SESSION_KEY = "wayfare.session.v1";

export interface Account {
  id: string;
  mobile: string;
  email: string;
  name?: string;
  passwordHash: string;
  passwordSalt: string;
}

type StoredAccount = Account;

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredAccount[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    /* private mode or a full quota — signing up just won't stick. */
  }
}

/** Digits only, so "+1 312-660-8615" and "13126608615" are the same account. */
export function normaliseMobile(mobile: string): string {
  return mobile.replace(/[^\d]/g, "");
}

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return toHex(digest);
}

function randomSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

export type SignUpError = "mobile-taken" | "email-taken";

export async function signUp(
  mobile: string,
  email: string,
  password: string,
): Promise<{ account: Account } | { error: SignUpError }> {
  const accounts = loadAccounts();
  const normalisedMobile = normaliseMobile(mobile);
  const normalisedEmail = email.trim().toLowerCase();

  if (accounts.some((a) => a.mobile === normalisedMobile)) return { error: "mobile-taken" };
  if (accounts.some((a) => a.email === normalisedEmail)) return { error: "email-taken" };

  const passwordSalt = randomSalt();
  const account: Account = {
    id: crypto.randomUUID(),
    mobile: normalisedMobile,
    email: normalisedEmail,
    passwordHash: await hashPassword(password, passwordSalt),
    passwordSalt,
  };
  saveAccounts([...accounts, account]);
  setSession(account.id);
  return { account };
}

export async function signIn(
  mobile: string,
  password: string,
): Promise<{ account: Account } | { error: "not-found" | "wrong-password" }> {
  const accounts = loadAccounts();
  const account = accounts.find((a) => a.mobile === normaliseMobile(mobile));
  if (!account) return { error: "not-found" };

  const hash = await hashPassword(password, account.passwordSalt);
  if (hash !== account.passwordHash) return { error: "wrong-password" };

  setSession(account.id);
  return { account };
}

export function setAccountName(accountId: string, name: string): Account | undefined {
  const accounts = loadAccounts();
  const account = accounts.find((a) => a.id === accountId);
  if (!account) return undefined;
  account.name = name.trim();
  saveAccounts(accounts);
  return account;
}

export function setSession(accountId: string): void {
  try {
    localStorage.setItem(SESSION_KEY, accountId);
  } catch {
    /* private mode or a full quota — the session just won't persist a reload. */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing to clean up if storage never worked in the first place. */
  }
}

export function currentAccount(): Account | undefined {
  try {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return undefined;
    return loadAccounts().find((a) => a.id === id);
  } catch {
    return undefined;
  }
}
