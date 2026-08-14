/**
 * Real photos for the well-known places in the itinerary — landmarks,
 * museums, a ballpark — pulled from Wikipedia's own lead image rather than
 * a hand-typed link, so a wrong guess 404s cleanly instead of showing the
 * wrong picture.
 */

const TIMEOUT_MS = 6000;

function reply(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=604800",
    },
  });
}

export default async function handler(request) {
  const title = new URL(request.url).searchParams.get("title");
  if (!title) return reply({ error: "Pass a title" }, 400);

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      {
        signal: abort.signal,
        headers: {
          accept: "application/json",
          "user-agent": "WayfareBot/1.0 (+trip photo lookup)",
        },
      },
    );
    if (!response.ok) return reply({ error: `Wikipedia answered ${response.status}` }, 404);

    const data = await response.json();
    const image = data?.thumbnail?.source ?? data?.originalimage?.source;
    return image ? reply({ image }) : reply({ error: "No lead image on that article" }, 404);
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return reply({ error: aborted ? "Wikipedia took too long" : "Could not reach Wikipedia" }, 504);
  } finally {
    clearTimeout(timer);
  }
}
