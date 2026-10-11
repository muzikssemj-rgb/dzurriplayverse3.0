import type { Metadata } from "next";
import { SavedGamesList } from "@/components/games/SavedGamesList";

export const metadata: Metadata = { title: "Favorites" };

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-black tracking-wide sm:text-3xl">
          <span aria-hidden="true">⭐ </span>
          <span className="text-gradient">Favorites</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Saved on this device only — no account needed.</p>
      </header>
      <SavedGamesList kind="favorites" emptyText="No favorites yet. Tap the ☆ on any game to save it here." />
    </div>
  );
}
