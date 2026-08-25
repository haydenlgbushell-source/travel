/* ---------- accounts, via Supabase Auth ----------
 * Real accounts now: Supabase Auth owns the password (hashed and checked
 * server-side, never touched here), and a session survives across devices —
 * signing in on a phone picks up the same trips a laptop created. The app's
 * own UX still treats the mobile number as the username, so sign-in resolves
 * mobile -> email via `email_for_mobile` (a narrow RPC that leaks nothing but
 * "an account with this mobile exists") before handing off to Supabase.
 *
 * A guest reached via a client access code gets an anonymous Supabase
 * session instead — no email or password at all — via signInAsGuest(). It's
 * still a real row in `accounts` (the same signup trigger creates it), just
 * with no mobile and no name until/unless they ever set one. */

import { supabase } from "../../lib/supabase";

export interface Account {
  id: string;
  mobile: string;
  email: string;
  name?: string;
  /** Reached via a client access code rather than signing up — no password,
   *  no email, and (per initialState in App.tsx) never asked to pick a name
   *  before being dropped straight into the one trip they redeemed. */
  isAnonymous?: boolean;
}

/** Digits only, so "+1 312-660-8615" and "13126608615" are the same account. */
export function normaliseMobile(mobile: string): string {
  return mobile.replace(/[^\d]/g, "");
}

async function fetchAccount(id: string, email: string, isAnonymous: boolean): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .select("mobile, name")
    .eq("id", id)
    .single();
  if (error) throw error;
  return { id, email, mobile: data.mobile ?? "", name: data.name ?? undefined, isAnonymous };
}

export type SignUpError = "mobile-taken" | "email-taken" | "rate-limited";

export async function signUp(
  mobile: string,
  email: string,
  password: string,
): Promise<{ account: Account } | { error: SignUpError } | { confirmationPending: true }> {
  const normalisedMobile = normaliseMobile(mobile);
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { mobile: normalisedMobile },
      /* Where the confirmation email's link sends them back to — without
         this it falls back to the project's Site URL, which for a project
         set up outside its own dashboard defaults to localhost and goes
         nowhere real. */
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) {
    if (/already registered|user_already_exists/i.test(error.message)) {
      return { error: "email-taken" };
    }
    if (/accounts_mobile_key/i.test(error.message)) {
      return { error: "mobile-taken" };
    }
    /* The project's default email sender caps how many confirmation emails
       go out in a short window — a handful of quick retries hits it fast.
       Worth naming specifically rather than a generic failure, since
       retrying immediately just makes it worse. */
    if (error.code === "over_email_send_rate_limit") {
      return { error: "rate-limited" };
    }
    throw error;
  }
  if (!data.user) throw new Error("Sign-up did not return a user.");

  /* This project requires confirming the email before a session exists —
     signUp() still creates the account, but there's nothing to fetch yet
     (RLS has no session to check against), and nothing to sign the person
     into until they click the link. */
  if (!data.session) return { confirmationPending: true };

  return { account: await fetchAccount(data.user.id, data.user.email ?? email, false) };
}

export async function signIn(
  mobile: string,
  password: string,
): Promise<{ account: Account } | { error: "not-found" | "wrong-password" | "not-confirmed" }> {
  const { data: email, error: lookupError } = await supabase.rpc("email_for_mobile", {
    p_mobile: normaliseMobile(mobile),
  });
  if (lookupError) throw lookupError;
  if (!email) return { error: "not-found" };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    /* This project requires confirming the email address before signing in
       works at all — GoTrue reports that as its own error code rather than
       folding it into "wrong password", so the message can actually say
       what's going on. */
    if (error.code === "email_not_confirmed") return { error: "not-confirmed" };
    return { error: "wrong-password" };
  }

  return { account: await fetchAccount(data.user.id, data.user.email ?? email, false) };
}

/** For a client opening an access-code link with no account of their own —
 *  requires "Allow anonymous sign-ins" enabled on the Supabase project. */
export async function signInAsGuest(): Promise<Account> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error("Anonymous sign-in did not return a user.");
  return fetchAccount(data.user.id, "", true);
}

export async function setAccountName(accountId: string, name: string): Promise<Account> {
  const trimmed = name.trim();
  const { error } = await supabase.from("accounts").update({ name: trimmed }).eq("id", accountId);
  if (error) throw error;

  const { data } = await supabase.auth.getUser();
  return {
    id: accountId,
    email: data.user?.email ?? "",
    mobile: "",
    name: trimmed,
    isAnonymous: data.user?.is_anonymous ?? false,
  };
}

export async function clearSession(): Promise<void> {
  await supabase.auth.signOut();
}

/** Reads whatever session Supabase already has (it persists its own session
 *  token in localStorage) and resolves it to the matching account row. */
export async function currentAccount(): Promise<Account | undefined> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return undefined;
  try {
    return await fetchAccount(user.id, user.email ?? "", user.is_anonymous ?? false);
  } catch {
    return undefined;
  }
}

/** Fires whenever sign-in/sign-out happens anywhere (including a token
 *  refresh in another tab), so the app can keep `account` state in sync
 *  without polling. Returns an unsubscribe function. */
export function onAccountChange(callback: (account: Account | undefined) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user;
    if (!user) {
      callback(undefined);
      return;
    }
    fetchAccount(user.id, user.email ?? "", user.is_anonymous ?? false)
      .then(callback)
      .catch(() => callback(undefined));
  });
  return () => data.subscription.unsubscribe();
}
