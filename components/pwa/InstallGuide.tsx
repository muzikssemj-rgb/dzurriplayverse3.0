import type { Platform } from "@/lib/install-prompt";

type Guide = { id: Platform | "windows-linux"; title: string; steps: string[]; note?: string };

/**
 * Panduan pemasangan manual. Sokongan PWA berbeza antara pelayar — panduan ini
 * tidak mendakwa semua pelayar boleh memasang aplikasi dengan cara yang sama.
 */
export const INSTALL_GUIDES: Guide[] = [
  {
    id: "ios",
    title: "iPhone (Safari)",
    steps: [
      "Buka laman ini dalam Safari.",
      "Tekan butang Share (kotak dengan anak panah ke atas).",
      "Pilih “Add to Home Screen”, kemudian tekan “Add”.",
    ],
    note: "Pada iOS 16.4 dan ke atas, sesetengah pelayar lain (cth. Chrome/Edge) juga menyokong Add to Home Screen melalui menu Share.",
  },
  {
    id: "ipados",
    title: "iPad (Safari)",
    steps: [
      "Buka laman ini dalam Safari.",
      "Tekan butang Share di bahagian atas skrin.",
      "Pilih “Add to Home Screen”, kemudian “Add”.",
    ],
  },
  {
    id: "android",
    title: "Android (Chrome, Edge, Samsung Internet)",
    steps: [
      "Tekan butang “Install App” — jika pelayar menyokong, dialog pemasangan akan muncul.",
      "Atau buka menu pelayar (⋮) dan pilih “Install app” / “Add to Home screen”.",
    ],
    note: "Firefox untuk Android menyokong “Install” / “Add to Home screen” melalui menu ⋮.",
  },
  {
    id: "desktop-chromium",
    title: "Windows, macOS, Linux & ChromeOS (Chrome / Edge)",
    steps: [
      "Klik ikon pasang (monitor dengan anak panah) di hujung bar alamat, atau tekan “Install App”.",
      "Chrome: menu ⋮ → “Cast, save and share” → “Install page as app…”.",
      "Edge: menu … → “Apps” → “Install this site as an app”.",
    ],
  },
  {
    id: "macos-safari",
    title: "macOS (Safari 17+)",
    steps: ["Dalam Safari, pilih menu File → “Add to Dock…”.", "Sahkan nama aplikasi dan klik “Add”."],
  },
  {
    id: "firefox-desktop",
    title: "Firefox (desktop)",
    steps: [
      "Firefox desktop secara umumnya tidak menyediakan pemasangan PWA seperti Chrome/Edge.",
      "Anda boleh menanda buku (bookmark) laman ini, atau buka dalam Chrome/Edge untuk memasang.",
    ],
  },
];

export function InstallGuide({ platform, compact = false }: { platform?: Platform; compact?: boolean }) {
  const guides =
    compact && platform && platform !== "other" ? INSTALL_GUIDES.filter((g) => g.id === platform) : INSTALL_GUIDES;
  const list = guides.length ? guides : INSTALL_GUIDES;
  return (
    <div className="space-y-4">
      {list.map((g) => (
        <section key={g.id} className="rounded-xl border border-white/10 bg-space/60 p-4">
          <h3 className="mb-2 font-semibold text-cyan-electric">{g.title}</h3>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-white/85">
            {g.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          {g.note && <p className="mt-2 text-xs text-ink-muted">{g.note}</p>}
        </section>
      ))}
      <p className="text-xs text-ink-muted">
        Nota: Aplikasi yang dipasang masih memerlukan internet untuk senarai permainan terkini dan permainan luaran. Hanya
        shell aplikasi dan permainan terbina dalam yang pernah dibuka disimpan untuk luar talian.
      </p>
    </div>
  );
}
