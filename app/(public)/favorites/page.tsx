import type { Metadata } from "next";
import { SavedGamesList } from "@/components/games/SavedGamesList";

export const metadata: Metadata = { title: "Kegemaran" };

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-black tracking-wide sm:text-3xl">
          <span aria-hidden="true">⭐ </span>
          <span className="text-gradient">Kegemaran</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Disimpan pada peranti ini sahaja — tiada akaun diperlukan.</p>
      </header>
      <SavedGamesList kind="favorites" emptyText="Belum ada kegemaran. Tekan ☆ pada mana-mana permainan untuk simpan di sini." />
    </div>
  );
}
