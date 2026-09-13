/**
 * Turn a page URL into a picture of the place.
 *
 * A browser cannot read another site's HTML, so pasting a hotel's website
 * into the app has to come through here: fetch the page, find the image it
 * advertises to link previews, hand back the URL.
 */

const TIMEOUT_MS = 6000;
const MAX_BYTES = 512 * 1024;

const MAX_REDIRECTS = 5;

/** Hosts that only make sense from inside a network — never worth fetching
 *  on a visitor's behalf. */
const BLOCKED_HOST_V4 = /^(localhost$|127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;

/** IPv6 loopback, unique-local (fc00::/7) and link-local (fe80::/10) ranges. */
const BLOCKED_HOST_V6 = /^(::1$|::$|f[cd][0-9a-f]{0,2}:|fe[89ab][0-9a-f]:)/i;

function isBlockedHost(hostname) {
  const bare = hostname.replace(/^\[/, "").replace(/\]$/, "");
  return BLOCKED_HOST_V4.test(bare) || BLOCKED_HOST_V6.test(bare);
}

function metaContent(html, patterns) {
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

/**
 * Pull the preview image out of a page. Kept free of any network so it can
 * be tested directly against fixture HTML.
 */
export function findImage(html, baseUrl) {
  const head = html.slice(0, 200_000);
  const raw = metaContent(head, [
    /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
  ]);
  if (!raw) return undefined;

  const decoded = raw
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

  try {
    /* Pages often advertise a relative path. */
    const resolved = new URL(decoded, baseUrl);
    return resolved.protocol === "http:" || resolved.protocol === "https:"
      ? resolved.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function reply(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=86400",
    },
  });
}

export default async function handler(request) {
  const target = new URL(request.url).searchParams.get("url");
  if (!target) return reply({ error: "Pass a url" }, 400);

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return reply({ error: "That is not a URL" }, 400);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return reply({ error: "Only http and https" }, 400);
  }
  if (isBlockedHost(parsed.hostname)) {
    return reply({ error: "That host is not reachable from here" }, 400);
  }

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  try {
    /* Follow redirects manually so each hop is re-checked against the
       blocklist — a public host could otherwise redirect the fetch to an
       internal address. */
    let current = parsed;
    let response;
    for (let hop = 0; ; hop += 1) {
      response = await fetch(current.toString(), {
        signal: abort.signal,
        redirect: "manual",
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": "WayfareBot/1.0 (+link preview)",
        },
      });
      if (response.status < 300 || response.status >= 400 || !response.headers.get("location")) break;
      if (hop >= MAX_REDIRECTS) return reply({ error: "Too many redirects" }, 502);

      let next;
      try {
        next = new URL(response.headers.get("location"), current);
      } catch {
        return reply({ error: "Could not reach that site" }, 502);
      }
      if ((next.protocol !== "http:" && next.protocol !== "https:") || isBlockedHost(next.hostname)) {
        return reply({ error: "That host is not reachable from here" }, 400);
      }
      current = next;
    }
    if (!response.ok) return reply({ error: `The site answered ${response.status}` }, 502);

    const type = response.headers.get("content-type") ?? "";
    /* Somebody may paste a direct image link here anyway — that is already
       the answer. */
    if (type.startsWith("image/")) return reply({ image: response.url });
    if (!type.includes("html")) return reply({ error: "That page is not a web page" }, 415);

    const html = (await response.text()).slice(0, MAX_BYTES);
    const image = findImage(html, response.url);
    return image ? reply({ image }) : reply({ error: "No picture on that page" }, 404);
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return reply({ error: aborted ? "The site took too long" : "Could not reach that site" }, 504);
  } finally {
    clearTimeout(timer);
  }
}
