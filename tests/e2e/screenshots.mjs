// Jana tangkapan skrin untuk manifest PWA (paparan pemasangan yang lebih kaya).
// Guna: BASE_URL=http://localhost:3000 node tests/e2e/screenshots.mjs
import { chromium } from "playwright";
import sharp from "sharp";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
for (const [name, w, h, dpr] of [["wide", 1280, 720, 1], ["narrow", 390, 844, 2]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr })).newPage();
  await p.goto(BASE + "/");
  await p.waitForLoadState("networkidle");
  await p.waitForTimeout(600);
  await sharp(await p.screenshot()).webp({ quality: 82 }).toFile(`public/screenshots/home-${name}.webp`);
}
await b.close();
console.log("Tangkapan skrin dikemas kini dalam public/screenshots/");
