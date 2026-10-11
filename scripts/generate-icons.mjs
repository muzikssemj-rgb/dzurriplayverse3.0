// Jana ikon PWA (PNG) daripada public/icons/logo-mark.svg. Guna: npm run icons
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const svg = await readFile(new URL("../public/icons/logo-mark.svg", import.meta.url));
const out = (p) => new URL(`../public/${p}`, import.meta.url).pathname;

for (const size of [48, 72, 96, 128, 144, 152, 192, 256, 384, 512]) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out(`icons/icon-${size}.png`));
}
// Maskable: logo dalam zon selamat 80% di atas latar penuh
const inner = await sharp(svg, { density: 384 }).resize(410, 410).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: "#0B1020" } })
  .composite([{ input: inner, left: 51, top: 51 }])
  .png()
  .toFile(out("icons/maskable-512.png"));
const inner192 = await sharp(svg, { density: 384 }).resize(154, 154).png().toBuffer();
await sharp({ create: { width: 192, height: 192, channels: 4, background: "#0B1020" } })
  .composite([{ input: inner192, left: 19, top: 19 }])
  .png()
  .toFile(out("icons/maskable-192.png"));
// Apple touch icon (tanpa ketelusan)
await sharp({ create: { width: 180, height: 180, channels: 3, background: "#0B1020" } })
  .composite([{ input: await sharp(svg, { density: 384 }).resize(180, 180).png().toBuffer() }])
  .png()
  .toFile(out("apple-touch-icon.png"));
await sharp(svg, { density: 384 }).resize(32, 32).png().toFile(out("favicon-32.png"));
// favicon.ico (PNG terbenam, 32x32)
const png32 = await sharp(svg, { density: 384 }).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt8(0, 8); header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(png32.length, 14); header.writeUInt32LE(22, 18);
await writeFile(out("favicon.ico"), Buffer.concat([header, png32]));
// Thumbnail Memory Match (permainan terbina dalam)
const mm = `<svg xmlns="http://www.w3.org/2000/svg" width="384" height="224" viewBox="0 0 384 224">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset="1" stop-color="#4c1d95"/></linearGradient>
<linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22D3EE"/><stop offset="1" stop-color="#0EA5E9"/></linearGradient>
<linearGradient id="k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs>
<rect width="384" height="224" fill="url(#g)"/>
${[0,1,2,3].map(i=>[0,1].map(j=>{const x=42+i*80,y=28+j*90,flip=(i+j)%3===0;return `<rect x="${x}" y="${y}" width="64" height="76" rx="10" fill="${flip?'url(#k)':'url(#c)'}" stroke="#0B1020" stroke-width="4" transform="rotate(${(i-1.5)*4} ${x+32} ${y+38})"/>${flip?`<circle cx="${x+32}" cy="${y+38}" r="14" fill="#0B1020"/>`:`<text x="${x+32}" y="${y+50}" font-size="34" font-family="Arial" font-weight="700" text-anchor="middle" fill="#0B1020">?</text>`}`}).join('')).join('')}
</svg>`;
await sharp(Buffer.from(mm)).webp({ quality: 88 }).toFile(out("images/games/memory-match.webp"));
console.log("Ikon dijana.");
