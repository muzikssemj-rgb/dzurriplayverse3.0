import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";

export const metadata: Metadata = { title: "Offline" };

/** Halaman statik yang di-precache oleh service worker. */
export default function OfflinePage() {
  const builtIn = [
    ["Music Quest", "/play/music-quest/index.html"],
    ["Quiz Arena", "/play/quiz-arena/index.html"],
    ["Rhythm Runner", "/play/rhythm-runner/index.html"],
    ["Memory Match", "/play/memory-match/index.html"],
  ];
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-5 p-6 text-center">
      <LogoMark size={96} />
      <h1 className="font-display text-2xl font-black tracking-wide">You&apos;re offline</h1>
      <p className="text-sm text-ink-muted">
        DZURRI PLAYVERSE needs an internet connection to load the latest games. External games always require internet.
        Pages you visited before may still open from the cache.
      </p>
      <section className="glass w-full p-4 text-left">
        <h2 className="mb-2 text-sm font-semibold text-cyan-electric">Available offline (built-in games)</h2>
        <ul className="space-y-1.5 text-sm">
          {builtIn.map(([name, href]) => (
            <li key={href}>
              <a className="underline hover:text-cyan-electric" href={href}>{name}</a>
            </li>
          ))}
        </ul>
      </section>
      <div className="flex gap-2">
        <Link href="/" className="btn-cyan">Try again</Link>
        <Link href="/favorites" className="btn-ghost">Favorites</Link>
      </div>
    </main>
  );
}
