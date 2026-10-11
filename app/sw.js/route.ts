/**
 * Service worker dihidangkan melalui Route Handler supaya VERSI berubah secara
 * automatik pada setiap deployment (commit SHA Vercel) → pengguna mendapat
 * notifikasi "versi baharu" dan cache lama dibuang.
 */
export const dynamic = "force-static";

const VERSION = (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_DEPLOYMENT_ID ?? `build-${Date.now()}`).slice(0, 12);

const PRECACHE = [
  "/offline",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/icons/logo-mark.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/play/shared.css",
  "/play/music-quest/index.html",
  "/play/quiz-arena/index.html",
  "/play/rhythm-runner/index.html",
  "/play/memory-match/index.html",
];

const SOURCE = `/* DZURRI PLAYVERSE service worker — ${VERSION} */
const VERSION = ${JSON.stringify(VERSION)};
const STATIC_CACHE = "dz-static-" + VERSION;
const PAGES_CACHE = "dz-pages-" + VERSION;
const ASSET_CACHE = "dz-next-assets";
const PRECACHE = ${JSON.stringify(PRECACHE)};
const NEVER_CACHE = ["/admin", "/api", "/auth", "/sw.js"];
const MAX_PAGES = 40;
const MAX_ASSETS = 250;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(PRECACHE.filter((u) => u !== "/offline"));
    // Halaman offline + aset JS/CSS yang diperlukan untuk memaparkannya
    const res = await fetch("/offline", { cache: "no-store" });
    if (res.ok) {
      const html = await res.clone().text();
      await (await caches.open(PAGES_CACHE)).put("/offline", res);
      const assets = [...new Set([...html.matchAll(/\\/_next\\/static\\/[^"'\\s)]+/g)].map((m) => m[0]))];
      const assetCache = await caches.open(ASSET_CACHE);
      await Promise.all(assets.map((a) => assetCache.add(a).catch(() => {})));
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([STATIC_CACHE, PAGES_CACHE, ASSET_CACHE]);
    for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key);
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {});
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // permainan luaran & imej luar: terus ke rangkaian
  if (NEVER_CACHE.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"))) return;
  if (req.headers.get("RSC") || url.searchParams.has("_rsc")) return; // data navigasi React: sentiasa segar

  // Aset Next.js berhash: cache-first (kekal sah selama-lamanya)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok) {
        const c = await caches.open(ASSET_CACHE);
        c.put(req, res.clone()).then(() => trim(ASSET_CACHE, MAX_ASSETS));
      }
      return res;
    })());
    return;
  }

  // Navigasi halaman: network-first (senarai permainan sentiasa terkini), fallback cache → /offline
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        const res = preload || (await fetch(req));
        if (res.ok && res.type === "basic") {
          const c = await caches.open(PAGES_CACHE);
          c.put(req, res.clone()).then(() => trim(PAGES_CACHE, MAX_PAGES));
        }
        return res;
      } catch (err) {
        const cached = await caches.match(req, { ignoreSearch: false });
        if (cached) return cached;
        const offline = await caches.match("/offline");
        return offline || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      }
    })());
    return;
  }

  // Ikon, imej, permainan terbina dalam, manifest: stale-while-revalidate
  if (/^\\/(icons|images|play)\\//.test(url.pathname) || /\\.(png|svg|webp|jpg|jpeg|gif|ico|webmanifest|css|woff2?)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req).then((res) => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || network;
    })());
  }
});
`;

export function GET() {
  return new Response(SOURCE, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
