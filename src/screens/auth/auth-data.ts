/* ---------- accounts, via Supabase Auth ----------
 * Real accounts now: Supabase Auth owns the password (hashed and checked
 * server-side, never touched here), and a session survives across devices —
 * signing in on a phone picks up the same trips a laptop created. The app's
 * own UX still treats the mobile number as the username, so sign-in resolves
 * mobile -> email via `email_for_mobile` (a narrow RPC that leaks nothing but
 * "an account with this mobile exists") before handing off to Supabase. */

import { supabase } from "../../lib/supabase";

export interface Account {
  id: string;
  mobile: string;
  email: string;
  name?: string;
}

/** Digits only, so "+1 312-660-8615" and "13126608615" are the same account. */
export function normaliseMobile(mobile: string): string {
  return mobile.replace(/[^\d]/g, "");
}

async function fetchAccount(id: string, email: string): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .select("mobile, name")
    .eq("id", id)
    .single();
  if (error) throw error;
  return { id, email, mobile: data.mobile ?? "", name: data.name ?? undefined };
}

export type SignUpError = "mobile-taken" | "email-taken";

export async function signUp(
  mobile: string,
  email: string,
  password: string,
): Promise<{ account: Account } | { error: SignUpError }> {
  const normalisedMobile = normaliseMobile(mobile);
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { mobile: normalisedMobile } },
  });

  if (error) {
    if (/already registered|user_already_exists/i.test(error.message)) {
      return { error: "email-taken" };
    }
    if (/accounts_mobile_key/i.test(error.message)) {
      return { error: "mobile-taken" };
    }
    throw error;
  }
  if (!data.user) throw new Error("Sign-up did not return a user.");

  return { account: await fetchAccount(data.user.id, data.user.email ?? email) };
}

export async function signIn(
  mobile: string,
  password: string,
): Promise<{ account: Account } | { error: "not-found" | "wrong-password" }> {
  const { data: email, error: lookupError } = await supabase.rpc("email_for_mobile", {
    p_mobile: normaliseMobile(mobile),
  });
  if (lookupError) throw lookupError;
  if (!email) return { error: "not-found" };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "wrong-password" };

  return { account: await fetchAccount(data.user.id, data.user.email ?? email) };
}

export async function setAccountName(accountId: string, name: string): Promise<Account> {
  const trimmed = name.trim();
  const { error } = await supabase.from("accounts").update({ name: trimmed }).eq("id", accountId);
  if (error) throw error;

  const { data } = await supabase.auth.getUser();
  return { id: accountId, email: data.user?.email ?? "", mobile: "", name: trimmed };
}

export async function clearSession(): Promise<void> {
  await supabase.auth.signOut();
}

/** Reads whatever session Supabase already has (it persists its own session
 *  token in localStorage) and resolves it to the matching account row. */
export async function currentAccount(): Promise<Account | undefined> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user?.email) return undefined;
  try {
    return await fetchAccount(user.id, user.email);
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
    if (!user?.email) {
      callback(undefined);
      return;
    }
    fetchAccount(user.id, user.email)
      .then(callback)
      .catch(() => callback(undefined));
  });
  return () => data.subscription.unsubscribe();
}
