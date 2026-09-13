/**
 * Small helpers shared by the link-preview functions: a JSON response
 * shaper and a timeout/abort pattern, so both functions shape errors the
 * same way.
 */

export function jsonReply(body, status = 200, maxAgeSeconds = 86400) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": `public, max-age=${maxAgeSeconds}`,
    },
  });
}

/** Start a timeout that aborts `signal`; call the returned `clear()` once
 *  the fetch settles (success or failure) to release the timer. */
export function abortAfter(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

export function isAbortError(error) {
  return error instanceof Error && error.name === "AbortError";
}
