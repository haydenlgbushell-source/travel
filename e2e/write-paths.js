/**
 * End-to-end coverage for the write paths.
 *
 * Every mutation in the app is exercised here against a real browser: creating
 * a trip, server-side validation rejecting bad input, empty states, adding
 * members / flights / expenses / plan items, the per-user interactions
 * (voting, packing ticks, alert dismissal) surviving a reload, and deleting a
 * trip.
 *
 * Playwright is not a dependency of the app, so install it first:
 *
 *   npm install --no-save playwright && npx playwright install chromium
 *   npm run build && npm run start -- -p 3111
 *   node e2e/write-paths.js
 *
 * Note the store is in-memory, so the suite mutates the seeded demo trip.
 * Restart the server for a clean run.
 *
 * Assertions read `innerText`, never `textContent`: the latter includes the
 * inlined RSC payload in <script> tags, which makes deleted content look
 * present.
 */

const { chromium } = require("playwright");

const BASE = process.env.E2E_BASE_URL || "http://localhost:3111";

const results = [];
function check(name, pass, extra = "") {
  results.push({ name, pass, extra });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
}

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 });

  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  // Delete confirmations are window.confirm — auto-accept.
  page.on("dialog", (d) => d.accept());

  // ── 1. Create a trip ───────────────────────────────────────────────────────
  await page.goto(`${BASE}/trips/new`, { waitUntil: "networkidle" });
  await page.fill("#name", "Tokyo ramen run");
  await page.fill("#destination", "Tokyo, Japan");
  await page.fill("#coverRoute", "SYD → HND");
  await page.fill("#startDate", "2027-04-02");
  await page.fill("#endDate", "2027-04-06");
  await page.fill("#currency", "jpy");
  await page.fill("#perPersonTarget", "3200.50");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/trips\/tokyo-ramen-run\/edit$/, { timeout: 10000 });
  check("create trip redirects to its editor", true, page.url());

  // ── 2. Validation rejects bad input ────────────────────────────────────────
  await page.goto(`${BASE}/trips/tokyo-ramen-run/edit/settings`, { waitUntil: "networkidle" });
  await page.fill("#endDate", "2027-03-01"); // before start
  await page.fill("#currency", "y");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(700);
  const endErr = await page.textContent("#endDate-error").catch(() => null);
  const curErr = await page.textContent("#currency-error").catch(() => null);
  check("server rejects end-before-start", Boolean(endErr), endErr ?? "no error shown");
  check("server rejects bad currency", Boolean(curErr), curErr ?? "no error shown");
  const keptName = await page.inputValue("#name");
  check("rejected form keeps typed values", keptName === "Tokyo ramen run", keptName);

  // ── 3. Empty states on a brand-new trip ────────────────────────────────────
  await page.goto(`${BASE}/trips/tokyo-ramen-run`, { waitUntil: "networkidle" });
  const bodyText = await page.innerText("body");
  check("empty stay state shown", bodyText.includes("No accommodation on this trip yet"));
  check("empty flights state shown", bodyText.includes("No flights on this trip yet"));
  check("empty budget state shown", bodyText.includes("No expenses on this trip yet"));

  // ── 4. Add a member ────────────────────────────────────────────────────────
  await page.goto(`${BASE}/trips/tokyo-ramen-run/edit/members`, { waitUntil: "networkidle" });
  await page.fill("#name", "Sam");
  await page.fill("#initials", "sm");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(900);
  const members = await page.innerText("body");
  check("member added", members.includes("Sam"));
  check("initials upper-cased on save", members.includes("SM"));
  const nameAfter = await page.inputValue("#name");
  check("add form clears after success", nameAfter === "", `"${nameAfter}"`);

  // ── 5. Add a flight, check it renders as a boarding pass ───────────────────
  await page.goto(`${BASE}/trips/tokyo-ramen-run/edit/flights`, { waitUntil: "networkidle" });
  const addFlight = page.locator("form").last();
  await addFlight.locator("#airline").fill("ANA");
  await addFlight.locator("#flightNumber").fill("nh880");
  await addFlight.locator("#originCode").fill("syd");
  await addFlight.locator("#originCity").fill("Sydney");
  await addFlight.locator("#destinationCode").fill("hnd");
  await addFlight.locator("#destinationCity").fill("Tokyo");
  await addFlight.locator("#departsAt").fill("2027-04-01T21:20");
  await addFlight.locator("#arrivesAt").fill("2027-04-02T05:35");
  await addFlight.locator("#reference").fill("ZZ9K1");
  await addFlight.locator('button[type="submit"]').click();
  await page.waitForTimeout(900);

  await page.goto(`${BASE}/trips/tokyo-ramen-run`, { waitUntil: "networkidle" });
  const withFlight = await page.innerText("body");
  check("flight appears on the trip page", withFlight.includes("NH880"));
  check("airport codes upper-cased", withFlight.includes("SYD") && withFlight.includes("HND"));

  // ── 6. Add an expense split two ways, verify the receipt maths ─────────────
  await page.goto(`${BASE}/trips/tokyo-ramen-run/edit/budget`, { waitUntil: "networkidle" });
  await page.fill("#label", "Hotel, 4 nights");
  await page.fill("#amount", "901");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(900);

  await page.goto(`${BASE}/trips/tokyo-ramen-run`, { waitUntil: "networkidle" });
  const budgetText = await page.innerText("body");
  // 901 split 2 ways = 450.50 each; payer (Hayden) is owed 450.50.
  check("per-person split computed", budgetText.includes("450.50"), budgetText.match(/450\.\d\d/)?.[0] ?? "");

  // ── 7. Voting on the seeded trip ───────────────────────────────────────────
  await page.goto(`${BASE}/trips/bali-2026`, { waitUntil: "networkidle" });
  const beforeVote = await page.innerText("body");
  check("poll starts as waiting on you", beforeVote.includes("Waiting on you"));
  await page.getByRole("button", { name: /Mozaic/ }).click();
  await page.waitForTimeout(1200);
  const afterVote = await page.innerText("body");
  check("vote registers for this user", afterVote.includes("Your vote is in"));
  check("vote count increments", afterVote.includes("4 of 4 voted"), afterVote.match(/\d of \d voted/)?.[0] ?? "");

  // Vote persists across a reload (it's a real write, not local state).
  await page.reload({ waitUntil: "networkidle" });
  const afterReload = await page.innerText("body");
  check("vote survives reload", afterReload.includes("Your vote is in"));

  // Changing the vote must not double-count.
  await page.getByRole("button", { name: /Bridges Bali/ }).click();
  await page.waitForTimeout(1200);
  const afterChange = await page.innerText("body");
  check("changed vote does not double-count", afterChange.includes("4 of 4 voted"), afterChange.match(/\d of \d voted/)?.[0] ?? "");

  // ── 8. Packing tick persists ───────────────────────────────────────────────
  const packBefore = (await page.innerText("body")).match(/(\d+) of (\d+) packed/);
  await page.getByText("Power adapter (type C/F)").click();
  await page.waitForTimeout(1200);
  await page.reload({ waitUntil: "networkidle" });
  const packAfter = (await page.innerText("body")).match(/(\d+) of (\d+) packed/);
  check(
    "packing tick persists across reload",
    Number(packAfter[1]) === Number(packBefore[1]) + 1,
    `${packBefore[0]} → ${packAfter[0]}`,
  );

  // ── 9. Alert dismissal persists ────────────────────────────────────────────
  const hadAlert = (await page.innerText("body")).includes("villa deposit");
  await page.getByRole("button", { name: /Dismiss alert/ }).click();
  await page.waitForTimeout(1200);
  await page.reload({ waitUntil: "networkidle" });
  const stillHasAlert = (await page.innerText("body")).includes("villa deposit");
  check("alert dismissal persists", hadAlert && !stillHasAlert);

  // ── 10. Plan editor: add an item to a chosen day ───────────────────────────
  await page.goto(`${BASE}/trips/bali-2026/edit/plan?day=2026-09-11`, { waitUntil: "networkidle" });
  const addEvent = page.locator("form").last();
  await addEvent.locator("#title").fill("Sunset beers at Bingin");
  await addEvent.locator("#time").fill("18:30");
  await addEvent.locator('button[type="submit"]').click();
  await page.waitForTimeout(900);
  const planText = await page.innerText("body");
  check("event added to the selected day", planText.includes("Sunset beers at Bingin"));

  // ── 11. Delete the trip we created ─────────────────────────────────────────
  await page.goto(`${BASE}/trips/tokyo-ramen-run/edit`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Delete this trip/ }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 10000 });
  const rows = await page.$$eval("main ul li a", (els) => els.map((e) => e.innerText));
  check(
    "deleted trip gone from the index",
    !rows.some((r) => r.includes("Tokyo ramen run")),
    `${rows.length} rows`,
  );

  // ── 12. A trip that doesn't exist is a 404 ─────────────────────────────────
  const res = await page.goto(`${BASE}/trips/does-not-exist`, { waitUntil: "networkidle" });
  check("unknown trip returns 404", res.status() === 404, `status ${res.status()}`);


  console.log("\npage errors:", errors.length ? errors : "none");
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  await browser.close();
  process.exit(failed.length > 0 ? 1 : 0);
})();
