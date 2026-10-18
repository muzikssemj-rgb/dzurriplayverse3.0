// Ujian asap (smoke test) terhadap deployment SEBENAR anda (Vercel + Firebase).
// Guna:   SITE_URL=https://nama-anda.vercel.app ADMIN_PASSWORD=... node scripts/verify-deployment.mjs
// Tidak mengubah sebarang data.
const SITE = (process.env.SITE_URL ?? "").replace(/\/$/, "");
if (!SITE) {
  console.error("Tetapkan SITE_URL, cth: SITE_URL=https://dzurri-playverse.vercel.app");
  process.exit(1);
}

let failures = 0;
const check = (cond, m) => {
  console.log(`  ${cond ? "✔" : "✘"} ${m}`);
  if (!cond) failures++;
};

console.log(`\n▶ ${SITE}`);
const home = await fetch(SITE + "/");
const html = await home.text();
check(home.ok, `GET / → ${home.status}`);
check(home.url.startsWith("https://") || !SITE.startsWith("https://"), "HTTPS digunakan");
check((home.headers.get("content-security-policy") ?? "").includes("object-src 'none'"), "Pengepala CSP hadir");
check(!html.includes("Pangkalan data belum disambungkan"), "Firebase disambungkan (FIREBASE_SERVICE_ACCOUNT sah)");
check(!html.includes("tidak dapat dimuatkan buat masa ini"), "Data Firestore boleh dibaca");
check(html.includes("Music Quest") || html.includes("<article"), "Senarai permainan dipaparkan");
check(!/private_key|BEGIN PRIVATE KEY|ADMIN_PASSWORD/.test(html), "Tiada rahsia dalam HTML");

const man = await fetch(SITE + "/manifest.webmanifest");
const manJson = man.ok ? await man.json().catch(() => null) : null;
check(manJson?.name === "DZURRI PLAYVERSE" && manJson?.short_name === "DZURRI", "manifest.webmanifest sah");
const sw = await fetch(SITE + "/sw.js");
check(sw.ok && (sw.headers.get("content-type") ?? "").includes("javascript"), "Service worker /sw.js");
check((await fetch(SITE + "/offline")).ok, "Halaman /offline");
check((await fetch(SITE + "/games?category=music-world")).ok, "Deep link /games?category=… (muat semula tanpa 404)");
check((await fetch(SITE + "/creator")).ok, "Halaman Creator");
check((await fetch(SITE + "/kit")).ok, "Halaman Kit Pembelajaran Muzik");
check((await fetch(SITE + "/kuiz")).ok, "Halaman Kuiz");

const upload = await fetch(SITE + "/api/admin/upload", { method: "POST", headers: { Origin: SITE } });
check(upload.status === 401, `API admin tanpa log masuk → ${upload.status} (dijangka 401)`);
const dash = await fetch(SITE + "/admin/dashboard", { redirect: "manual" });
check([302, 303, 307, 308].includes(dash.status), `/admin/dashboard tanpa log masuk dialihkan (${dash.status})`);
const forged = await fetch(SITE + "/admin/dashboard", {
  redirect: "manual",
  headers: { Cookie: `dz_admin=${Date.now()}.x.forged; dz_admin_seen=${Date.now()}` },
});
check([302, 303, 307, 308].includes(forged.status), "Cookie sesi palsu ditolak");

console.log(failures ? `\n✘ ${failures} semakan gagal.` : "\n✔ Semua semakan lulus. Seterusnya: log masuk di /admin/login dan cuba Add New Game.");
process.exit(failures ? 1 : 0);
