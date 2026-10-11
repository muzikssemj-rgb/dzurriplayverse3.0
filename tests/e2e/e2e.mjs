// Ujian hujung-ke-hujung (Playwright) — jalankan terhadap `next start` dalam mod storan tempatan.
// Lihat tests/e2e/run-local.sh
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = process.env.SHOT_DIR ?? "test-results";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "dzurrihensem";
const DBFILE = process.env.DZ_LOCAL_DB_FILE;
fs.mkdirSync(OUT, { recursive: true });

let pass = 0, fail = 0;
const results = [];
function check(cond, msg) {
  if (cond) { pass++; results.push(`✔ ${msg}`); console.log(`  ✔ ${msg}`); }
  else { fail++; results.push(`✘ ${msg}`); console.log(`  ✘ ${msg}`); }
}
const rows = (col) => Object.entries(JSON.parse(fs.readFileSync(DBFILE, "utf8"))[col] ?? {}).map(([id, d]) => ({ id, ...d }));
const game = (pred) => rows("games").find(pred);
async function waitUrl(page, pattern) {
  try {
    await page.waitForURL(pattern, { waitUntil: "commit", timeout: 15000 });
  } catch {
    const alerts = await page.locator("[role=alert]").allTextContents().catch(() => []);
    await page.screenshot({ path: `${OUT}/failure-${Date.now()}.png` }).catch(() => {});
    throw new Error(`URL ${page.url()} did not match ${pattern}; alerts=${JSON.stringify(alerts)}`);
  }
}
async function submit(page, name) {
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST" && !!r.request().headers()["next-action"]),
    page.getByRole("button", { name }).click(),
  ]);
  await res.text().catch(() => {});
  await page.waitForTimeout(500);
}
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

// ---------------------------------------------------------------- PUBLIC
console.log("\n▶ Public web app");
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  await page.goto(BASE + "/");
  await page.waitForLoadState("networkidle");
  check(await page.getByRole("heading", { name: /DZURRI\s*PLAYVERSE/ }).isVisible(), "Hero heading visible (mobile)");
  check(await page.getByRole("link", { name: "Explore Games" }).first().isVisible(), "Explore Games button visible");
  check(await noOverflow(page), "No horizontal overflow on phone (home)");
  await page.screenshot({ path: `${OUT}/home-mobile.png`, fullPage: true });

  await page.getByRole("link", { name: "Explore Games" }).first().click();
  await waitUrl(page, "**/games");
  await page.getByRole("heading", { name: "All Games" }).waitFor();
  check((await page.locator("main article").count()) === 4, `Explore: 4 published games listed (${await page.locator("main article").count()})`);
  await page.goto(BASE + "/games?category=quiz-world");
  await page.locator("main article h3").first().waitFor();
  const catCount = await page.locator("main article").count();
  const catTitles = await page.locator("main article h3").allTextContents();
  check(catCount === 1 && catTitles[0] === "Quiz Arena", `Category filter works (${catTitles.join(", ")})`);
  await page.goto(BASE + "/games?q=nota");
  await page.locator("main article h3").first().waitFor();
  check((await page.locator("article").count()) === 1, "Search by tag works (nota → Music Quest)");
  check(await noOverflow(page), "No horizontal overflow on phone (games)");

  // Launcher (embedded built-in)
  await page.goto(BASE + "/games/quiz-arena");
  const frame = page.frameLocator('iframe[title="Quiz Arena"]');
  await frame.getByRole("button", { name: "Mula Kuiz" }).waitFor({ timeout: 10000 });
  check(true, "Embedded game loads in iframe");
  await frame.getByRole("button", { name: "Mula Kuiz" }).click();
  check(await frame.getByText(/Soalan 1\/10/).isVisible(), "Built-in game is playable (quiz started)");
  for (const name of ["Back to Games", "Reload Game", "Open in New Tab", "Report a Broken Link"]) {
    check((await page.getByRole(name === "Open in New Tab" || name === "Back to Games" ? "link" : "button", { name: new RegExp(name) }).count()) > 0, `Launcher has “${name}”`);
  }
  await page.screenshot({ path: `${OUT}/launcher-mobile.png`, fullPage: true });

  // Report broken link
  await page.getByRole("button", { name: /Report a Broken Link/ }).click();
  await page.getByLabel("Details (optional)").fill("Ujian E2E");
  await page.getByRole("button", { name: "Send report" }).click();
  await page.getByText(/report has been sent/).waitFor();
  check(rows("reports").filter((r) => r.message === "Ujian E2E").length === 1, "Broken-link report stored in database");
  await page.getByRole("button", { name: "Close" }).click();

  // Favorite
  await page.getByRole("button", { name: /Add Quiz Arena to favorites/ }).click();
  await page.goto(BASE + "/favorites");
  await page.getByRole("link", { name: "Quiz Arena" }).first().waitFor();
  check(true, "Favorite saved and listed on Favorites page");
  check(game((g) => g.slug === "quiz-arena").play_count >= 1, "Play counted in database (real Popular data)");

  // 404
  const nf = await page.goto(BASE + "/games/does-not-exist");
  await page.getByText(/doesn.t exist/).waitFor();
  check(true, `Unknown game shows Not Found page (HTTP ${nf.status()})`);

  // External launch mode + blocked embedding handled
  check(consoleErrors.filter((e) => !/favicon/.test(e)).length === 0, `No console errors on public pages (${consoleErrors.length})`);
  await ctx.close();

  const desk = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const dp = await desk.newPage();
  await dp.goto(BASE + "/");
  await dp.waitForLoadState("networkidle");
  await dp.screenshot({ path: `${OUT}/home-desktop.png`, fullPage: true });
  check(await noOverflow(dp), "No horizontal overflow on desktop");
  // Keyboard navigation: skip link
  await dp.keyboard.press("Tab");
  check((await dp.evaluate(() => document.activeElement?.textContent)) === "Skip to content", "Keyboard: first Tab focuses “Skip to content”");
  await desk.close();
}

// ---------------------------------------------------------------- ADMIN AUTH
console.log("\n▶ Admin authentication");
let actionCapture = null;
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, extraHTTPHeaders: { "x-forwarded-for": "10.1.1.1" } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/admin/games");
  check(page.url().includes("/admin/login"), "Protected admin route redirects to login");

  await page.getByLabel("Admin password").fill("wrong-password-1");
  await page.getByRole("button", { name: "Show" }).click();
  check((await page.getByLabel("Admin password").getAttribute("type")) === "text", "Show/Hide password toggles");
  await submit(page, "Sign in");
  await page.getByText("Kata laluan tidak sah.").waitFor();
  check(page.url().includes("/admin/login"), "Wrong password refused");

  // Cookie palsu (tanpa tandatangan sah) tidak diterima
  await ctx.addCookies([{ name: "dz_admin", value: `${Date.now()}.abc.forged`, url: BASE }, { name: "dz_admin_seen", value: String(Date.now()), url: BASE }]);
  await page.goto(BASE + "/admin/dashboard");
  check(page.url().includes("/admin/login"), "Forged session cookie rejected");

  await page.getByLabel("Admin password").fill(PASSWORD);
  await submit(page, "Sign in");
  await waitUrl(page, "**/admin/dashboard");
  check(true, "Owner login with ADMIN_PASSWORD succeeds → dashboard");
  const cookies = await ctx.cookies();
  const authCookie = cookies.find((c) => c.name === "dz_admin");
  check(!!authCookie && authCookie.httpOnly && authCookie.sameSite === "Lax", "Session cookie is HttpOnly + SameSite");
  check(!(await page.content()).includes(PASSWORD), "Password never sent to the browser");
  const stats = await page.locator("ul li a p:first-child").allTextContents();
  check(stats[0] === "4" && stats[1] === "4", `Dashboard counts from DB (total=${stats[0]}, published=${stats[1]})`);
  await page.screenshot({ path: `${OUT}/admin-dashboard.png`, fullPage: true });

  // ------------------------------------------------------------ CRUD
  console.log("\n▶ Admin CRUD");
  page.on("request", (r) => {
    const id = r.headers()["next-action"];
    if (id && r.method() === "POST") actionCapture = { id, url: r.url(), last: r.postData() };
  });
  await page.goto(BASE + "/admin/games");
  await page.getByRole("link", { name: /Add New Game/ }).click();
  await waitUrl(page, "**/admin/games/new");
  await page.getByRole("button", { name: /Save Draft & Preview/ }).click();
  await page.getByText("Sila semak medan yang ditanda.").waitFor();
  check(true, "Server-side validation rejects empty form");

  await page.getByLabel("Game Title *").fill("Space Typing Test");
  await page.getByLabel("Game URL *").fill("javascript:alert(1)");
  await page.getByRole("button", { name: /Save Draft & Preview/ }).click();
  await page.getByText(/Game URL mesti bermula dengan https/).waitFor();
  check((await page.getByLabel("Game Title *").inputValue()) === "Space Typing Test", "javascript: URL rejected; form keeps values");

  await page.getByLabel("Game URL *").fill("https://example.com/");
  await page.getByLabel("Short Description").fill("Latihan menaip di angkasa.");
  await page.getByLabel("Thumbnail URL").fill("https://example.com/missing-image.png");
  await page.getByLabel("Category").selectOption({ label: "🎓 Educational Games" });
  await page.getByLabel("Tags").fill("menaip, angkasa");
  await page.getByLabel("Difficulty Level").selectOption("easy");
  await page.getByLabel("Target Age Group").fill("8+");
  await page.getByRole("radio", { name: /External/ }).check();
  await page.getByRole("button", { name: /Save Draft & Preview/ }).click();
  await waitUrl(page, "**/preview");
  check(true, "Save Draft & Preview → preview page");
  let row = game((g) => g.slug === "space-typing-test");
  check(row?.status === "draft" && row.launch_mode === "external" && row.tags.join() === "menaip,angkasa", "Draft saved in DB with all fields");
  const pub1 = await fetch(BASE + "/games/space-typing-test").then((r) => r.text());
  check(!pub1.includes("Latihan menaip"), "Draft NOT visible publicly");
  await page.screenshot({ path: `${OUT}/admin-preview.png`, fullPage: true });

  await page.getByRole("button", { name: /Publish/ }).click();
  await page.getByText(/Game published/).waitFor();
  row = game((g) => g.slug === "space-typing-test");
  check(row.status === "published" && row.published_at, "Publish → status published in DB");
  const home = await fetch(BASE + "/").then((r) => r.text());
  const cat = await fetch(BASE + "/games?category=educational-games").then((r) => r.text());
  check(home.includes("Space Typing Test") && cat.includes("Space Typing Test"), "Published game appears on home & its category automatically");
  const gp = await page.context().newPage();
  await gp.goto(BASE + "/games/space-typing-test");
  await gp.getByText(/opens on an external website/).waitFor({ timeout: 8000 }).catch(() => {});
  check(await gp.getByText(/opens on an external website/).isVisible(), "External mode shows leaving-platform notice");
  check(await gp.getByRole("link", { name: /Open Game/ }).first().getAttribute("rel") === "noopener noreferrer", "Open Game uses rel=noopener noreferrer");
  await gp.close();

  // Edit
  await page.goto(BASE + "/admin/games");
  await page.locator("li", { hasText: "Space Typing Test" }).getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Game Title *").fill("Space Typing Test Pro");
  await page.getByRole("button", { name: /Save changes/ }).click();
  await page.getByText("Game updated.").waitFor();
  check(rows("games").filter((g) => g.title === "Space Typing Test Pro").length === 1, "Edit game saved");

  // Unpublish
  await page.locator("li", { hasText: "Space Typing Test Pro" }).getByRole("button", { name: "Unpublish" }).click();
  await page.getByText(/Game unpublished/).waitFor();
  const cat2 = await fetch(BASE + "/games?category=educational-games").then((r) => r.text());
  check(!cat2.includes("Space Typing Test Pro"), "Unpublish hides game from players");

  // Duplicate
  await page.locator("li", { hasText: "Space Typing Test Pro" }).first().getByRole("button", { name: "Duplicate" }).click();
  await waitUrl(page, "**/edit?msg=duplicated");
  const dup = game((g) => g.title === "Space Typing Test Pro (Copy)");
  check(dup?.status === "draft", "Duplicate creates a draft copy");

  // Delete (with confirmation)
  await page.goto(BASE + "/admin/games?q=copy");
  await page.locator("li", { hasText: "(Copy)" }).getByRole("button", { name: "Delete" }).click();
  check(await page.getByRole("alertdialog").isVisible(), "Delete asks for confirmation");
  await page.getByRole("button", { name: "Cancel" }).click();
  check(rows("games").filter((g) => g.title.endsWith("(Copy)")).length === 1, "Cancel keeps the game");
  await page.locator("li", { hasText: "(Copy)" }).getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await page.getByText("Deleted.").waitFor();
  check(rows("games").filter((g) => g.title.endsWith("(Copy)")).length === 0, "Confirmed delete removes the game");
  const deleteCapture = actionCapture;

  // Categories
  await page.goto(BASE + "/admin/categories");
  const addForm = page.locator("section", { hasText: "Add category" });
  await addForm.getByLabel("Name *").fill("Science Lab");
  await addForm.getByLabel("Icon").fill("🔬");
  await addForm.getByRole("button", { name: /Add/ }).click();
  await page.getByText("Kategori ditambah.").waitFor();
  check(rows("categories").filter((c) => c.slug === "science-lab").length === 1, "Add category");
  await page.reload();
  const catItem = page.locator("li", { hasText: "Science Lab" }).first();
  await catItem.getByLabel("Name *").fill("Science Lab World");
  await catItem.getByRole("button", { name: "Save" }).click();
  await page.getByText("Kategori dikemas kini.").waitFor();
  check(rows("categories").find((c) => c.slug === "science-lab")?.name === "Science Lab World", "Rename category");
  const homeCats = await fetch(BASE + "/").then((r) => r.text());
  check(homeCats.includes("Science Lab World"), "New category appears on public home");
  await page.locator("li", { hasText: "Science Lab World" }).first().getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await page.getByText("Deleted.").waitFor();
  check(rows("categories").filter((c) => c.slug === "science-lab").length === 0, "Delete category");

  // Upload thumbnail (real PNG vs disguised SVG)
  const png = fs.readFileSync("public/icons/icon-48.png");
  const up = await page.evaluate(async (bytes) => {
    const fd = new FormData();
    fd.set("file", new File([new Uint8Array(bytes)], "thumb.png", { type: "image/png" }));
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
    return { status: r.status, body: await r.json() };
  }, [...png]);
  check(up.status === 201 && /^\/media\/[A-Za-z0-9_-]+$/.test(up.body.url), "Owner can upload PNG thumbnail");
  const media = await fetch(BASE + up.body.url);
  check(media.ok && media.headers.get("content-type") === "image/webp", "Uploaded image re-encoded to WEBP and served from /media");
  const evil = await page.evaluate(async () => {
    const fd = new FormData();
    fd.set("file", new File(["<svg onload=alert(1)>"], "evil.png", { type: "image/png" }));
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
    return r.status;
  });
  check(evil === 415, "Disguised non-image upload rejected (415)");

  // Activity log
  await page.goto(BASE + "/admin/dashboard");
  check(await page.getByText(/Space Typing Test Pro/).first().isVisible(), "Activity log shows admin actions");

  // Session timeout
  const seen = (await ctx.cookies()).find((c) => c.name === "dz_admin_seen");
  await ctx.addCookies([{ ...seen, value: String(Date.now() - 31 * 60 * 1000) }]);
  await page.goto(BASE + "/admin/games");
  check(page.url().includes("/admin/login?reason=expired"), "Idle session times out → login (reason=expired)");

  // Logged out: replay captured server action → must not delete anything
  await page.goto(BASE + "/admin/login");
  const target = game((g) => g.slug === "music-quest").id;
  if (deleteCapture) {
    const fd = deleteCapture.last ?? "";
    const forged = fd.replace(/\b[0-9a-f]{20}\b/g, target);
    const anonCtx = await browser.newContext();
    const r = await anonCtx.request.post(deleteCapture.url, {
      headers: { "next-action": deleteCapture.id, "content-type": "text/plain;charset=UTF-8", origin: BASE },
      data: forged,
      failOnStatusCode: false,
    });
    check(rows("games").some((g) => g.id === target), `Replayed delete action without session is refused (HTTP ${r.status()}, game intact)`);
    await anonCtx.close();
  } else check(false, "Captured a server action for replay test");
  const unauth = await fetch(BASE + "/api/admin/upload", { method: "POST", headers: { Origin: BASE } });
  check(unauth.status === 401, "Upload API without session → 401");
  await ctx.close();
}

// ---------------------------------------------------------------- CREATOR PROFILE + RATE LIMIT
console.log("\n▶ Creator profile & rate limiting");
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, extraHTTPHeaders: { "x-forwarded-for": "10.2.2.2" } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/admin/login");
  await page.getByLabel("Admin password").fill(PASSWORD);
  await submit(page, "Sign in");
  await waitUrl(page, "**/admin/dashboard");
  await page.getByRole("link", { name: /Creator Profile/ }).first().click();
  await waitUrl(page, "**/admin/profile");
  const photo = fs.readFileSync("public/images/brand/creator-portrait.webp");
  await page.locator("#photo-file").setInputFiles({ name: "me.webp", mimeType: "image/webp", buffer: photo });
  await page.getByAltText("Foto profil (muka anda) preview").waitFor({ timeout: 15000 });
  const hero = fs.readFileSync("public/images/brand/hero-character.webp");
  await page.locator("#hero-file").setInputFiles({ name: "hero.webp", mimeType: "image/webp", buffer: hero });
  await page.getByAltText(/Watak kartun/).waitFor({ timeout: 15000 });
  await page.getByLabel("Nama *").fill("Cikgu Dzurri");
  await page.getByLabel("Profil ringkas").fill("Guru muzik dan pembangun permainan pendidikan.\nUjian E2E profil.");
  await page.getByLabel("Petikan / moto").fill("Belajar sambil bermain!");
  await page.getByRole("button", { name: /Simpan profil/ }).click();
  await page.getByText(/Profil pencipta disimpan/).waitFor();
  const prof = rows("settings").find((r) => r.id === "creator");
  check(prof?.name === "Cikgu Dzurri" && /^\/media\//.test(prof.photo_url) && /^\/media\//.test(prof.hero_url), "Profile + photo + hero image saved");
  const pub = await ctx.newPage();
  await pub.goto(BASE + "/creator");
  await pub.getByText("Ujian E2E profil.").waitFor();
  check((await pub.getByRole("img", { name: /Cikgu Dzurri/ }).getAttribute("src")) === prof.photo_url, "Creator page shows uploaded photo, name and bio");
  check(await pub.getByText("Belajar sambil bermain!").isVisible(), "Creator page shows quote");
  await pub.goto(BASE + "/");
  await pub.waitForLoadState("networkidle");
  check((await pub.locator("main section").first().locator("img").first().getAttribute("src")) === prof.hero_url, "Home hero uses uploaded hero image");
  await pub.screenshot({ path: `${OUT}/home-with-profile.png` });
  await pub.goto(BASE + "/creator");
  await pub.getByText("Ujian E2E profil.").waitFor();
  await pub.screenshot({ path: `${OUT}/creator.png`, fullPage: true });
  await page.screenshot({ path: `${OUT}/admin-profile.png`, fullPage: true });
  await page.getByRole("button", { name: "Logout" }).last().click();
  await waitUrl(page, "**/admin/login?reason=logout");
  await page.goto(BASE + "/admin/dashboard");
  check(page.url().includes("/admin/login"), "Logout ends the session");
  await ctx.close();

  const rl = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "10.3.3.3" } });
  const p2 = await rl.newPage();
  await p2.goto(BASE + "/admin/login");
  for (let i = 0; i < 6; i++) {
    await p2.getByLabel("Admin password").fill(`bad-${i}`);
    await submit(p2, "Sign in");
    await p2.locator("p[role=alert]").waitFor();
    await p2.waitForTimeout(150);
  }
  check(await p2.getByText(/Terlalu banyak percubaan/).isVisible(), "6th failed login is rate-limited");
  await p2.getByLabel("Admin password").fill(PASSWORD);
  await submit(p2, "Sign in");
  await p2.waitForTimeout(800);
  check(p2.url().includes("/admin/login"), "Even correct password is blocked while rate-limited");
  await rl.close();
}

// ---------------------------------------------------------------- PWA
console.log("\n▶ PWA");
{
  // Profil berterusan (bukan incognito) — Chrome tidak membenarkan pemasangan PWA dalam incognito
  const profileDir = fs.mkdtempSync(`${OUT}/chrome-profile-`);
  const ctx = await chromium.launchPersistentContext(profileDir, {
    viewport: { width: 1280, height: 800 },
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto(BASE + "/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
  check(true, "Service worker installed and controlling the page");
  const cdp = await ctx.newCDPSession(page);
  const manifest = await cdp.send("Page.getAppManifest");
  check(manifest.errors.length === 0, `Manifest parses without errors (${manifest.errors.map((e) => e.message).join("; ") || "none"})`);
  const inst = await cdp.send("Page.getInstallabilityErrors");
  check(inst.installabilityErrors.length === 0, `Chrome installability check passes (${inst.installabilityErrors.map((e) => e.errorId).join(", ") || "installable"})`);

  await page.goto(BASE + "/about");
  await page.goto(BASE + "/games/music-quest");
  await page.waitForLoadState("networkidle");
  const keys = await page.evaluate(async () => {
    const out = [];
    for (const name of await caches.keys()) for (const req of await (await caches.open(name)).keys()) out.push(new URL(req.url).pathname);
    return out;
  });
  check(!keys.some((k) => k.startsWith("/admin") || k.startsWith("/api")), "No admin/API responses in SW cache");
  check(keys.includes("/offline") && keys.includes("/play/quiz-arena/index.html"), "Offline page & built-in games precached");

  await ctx.setOffline(true);
  await page.goto(BASE + "/about");
  check(await page.getByText("ONE CREATOR. INFINITE WORLDS.").first().isVisible(), "Offline: previously visited page served from cache");
  await page.goto(BASE + "/creator?never-visited=1");
  check(await page.getByRole("heading", { name: "You're offline" }).isVisible(), "Offline: unvisited page shows friendly offline page");
  await page.screenshot({ path: `${OUT}/offline.png` });
  await page.goto(BASE + "/play/memory-match/index.html");
  check(await page.getByText("Memory Match").first().isVisible(), "Offline: built-in game still playable");
  await ctx.setOffline(false);
  await ctx.close();
  fs.rmSync(profileDir, { recursive: true, force: true });
}

await browser.close();
fs.writeFileSync(`${OUT}/e2e-results.txt`, results.join("\n") + `\n\n${pass} passed, ${fail} failed\n`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
