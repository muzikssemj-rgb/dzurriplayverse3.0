import type { Metadata } from "next";
import Link from "next/link";
import { SavedGamesList } from "@/components/games/SavedGamesList";
import { InstallButton } from "@/components/pwa/InstallButton";

export const metadata: Metadata = { title: "Profil Saya" };

export default function MePage() {
  return (
    <div className="space-y-8">
      <header className="glass neon-border flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <div className="grid size-20 place-items-center rounded-full border-2 border-cyan-electric bg-space-3 text-4xl" aria-hidden="true">
          🧑‍🚀
        </div>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-black tracking-wide">Profil Saya</h1>
          <p className="text-sm text-ink-muted">
            Profil penjelajah untuk peranti ini. Kegemaran dan permainan terkini disimpan dalam pelayar ini sahaja.
          </p>
        </div>
        <InstallButton />
      </header>

      <section aria-labelledby="recent-h">
        <h2 id="recent-h" className="mb-3 text-lg font-bold">🕹️ Baru dimainkan</h2>
        <SavedGamesList kind="recent" emptyText="Anda belum bermain apa-apa lagi." />
      </section>

      <section aria-labelledby="fav-h">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="fav-h" className="text-lg font-bold">⭐ Kegemaran</h2>
          <Link href="/favorites" className="text-sm text-white/75 hover:text-cyan-electric">Buka ›</Link>
        </div>
        <SavedGamesList kind="favorites" emptyText="Belum ada kegemaran." />
      </section>
    </div>
  );
}
