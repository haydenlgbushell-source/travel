import "server-only";

/**
 * Auth seam.
 *
 * There is no auth provider yet, so this returns a fixed identity. Everything
 * user-scoped in the app — whose vote, whose packing ticks, whose dismissed
 * alerts, who may edit a trip — already routes through here, so switching to
 * Supabase Auth means replacing the body of `getCurrentUser` with a
 * `supabase.auth.getUser()` call rather than hunting for the assumption.
 */

export interface CurrentUser {
  id: string;
  name: string;
  initials: string;
}

const DEMO_USER: CurrentUser = {
  id: "m-hayden",
  name: "Hayden",
  initials: "HB",
};

export async function getCurrentUser(): Promise<CurrentUser> {
  return DEMO_USER;
}
