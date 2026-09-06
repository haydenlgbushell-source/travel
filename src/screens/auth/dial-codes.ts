export interface DialCode {
  code: string;
  label: string;
}

/** Common dial codes, not every one ITU assigns — enough that most people
 *  find their own rather than hunting. Shared by every place a mobile
 *  number gets typed for lookup (sign-in/up, agency team management) so
 *  the same country list, and the same combining rule below, can't drift
 *  between them the way they once did. */
export const DIAL_CODES: DialCode[] = [
  { code: "+61", label: "Australia +61" },
  { code: "+64", label: "New Zealand +64" },
  { code: "+1", label: "US/Canada +1" },
  { code: "+44", label: "UK +44" },
  { code: "+353", label: "Ireland +353" },
  { code: "+91", label: "India +91" },
  { code: "+86", label: "China +86" },
  { code: "+81", label: "Japan +81" },
  { code: "+82", label: "South Korea +82" },
  { code: "+65", label: "Singapore +65" },
  { code: "+60", label: "Malaysia +60" },
  { code: "+66", label: "Thailand +66" },
  { code: "+62", label: "Indonesia +62" },
  { code: "+63", label: "Philippines +63" },
  { code: "+84", label: "Vietnam +84" },
  { code: "+852", label: "Hong Kong +852" },
  { code: "+971", label: "UAE +971" },
  { code: "+27", label: "South Africa +27" },
  { code: "+49", label: "Germany +49" },
  { code: "+33", label: "France +33" },
  { code: "+34", label: "Spain +34" },
  { code: "+39", label: "Italy +39" },
  { code: "+31", label: "Netherlands +31" },
  { code: "+41", label: "Switzerland +41" },
  { code: "+46", label: "Sweden +46" },
  { code: "+55", label: "Brazil +55" },
  { code: "+52", label: "Mexico +52" },
];

/** Defaults to Australia rather than whichever code happened to be typed
 *  historically — see the auth screen's own history for why that default
 *  matters. */
export const DEFAULT_DIAL_CODE = "+61";

/** Combines a selected dial code with a locally-typed number into the one
 *  form every lookup (email_for_mobile, agency_add_agent — both plain
 *  equality matches against accounts.mobile, no normalisation of their
 *  own) needs to agree on. Strips a leading national trunk prefix
 *  ("0412 345 678") so it and its no-prefix spelling ("412 345 678")
 *  always combine to the same string, rather than silently naming two
 *  different accounts depending on which way someone happened to type it.
 *  Callers still need to digit-strip the result before sending/comparing
 *  it (see normaliseMobile in auth-data.ts) — this only fixes what the
 *  two spellings disagree on. */
export function combineMobile(dialCode: string, local: string): string {
  return `${dialCode} ${local.replace(/^0+/, "")}`;
}
