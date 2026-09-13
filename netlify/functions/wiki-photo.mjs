/**
 * Real photos for the well-known places in the itinerary — landmarks,
 * museums, a ballpark — pulled from Wikipedia's own lead image rather than
 * a hand-typed link, so a wrong guess 404s cleanly instead of showing the
 * wrong picture.
 */

import { abortAfter, isAbortError, jsonReply } from "./_shared.mjs";

const TIMEOUT_MS = 6000;

export default async function handler(request) {
  const title = new URL(request.url).searchParams.get("title");
  if (!title) return jsonReply({ error: "Pass a title" }, 400);

  const { signal, clear } = abortAfter(TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      {
        signal,
        headers: {
          accept: "application/json",
          "user-agent": "WayfareBot/1.0 (+trip photo lookup)",
        },
      },
    );
    if (!response.ok) return jsonReply({ error: `Wikipedia answered ${response.status}` }, 404);

    const data = await response.json();
    const image = data?.thumbnail?.source ?? data?.originalimage?.source;
    return image ? jsonReply({ image }, 200, 604800) : jsonReply({ error: "No lead image on that article" }, 404);
  } catch (error) {
    return jsonReply({ error: isAbortError(error) ? "Wikipedia took too long" : "Could not reach Wikipedia" }, 504);
  } finally {
    clear();
  }
}
