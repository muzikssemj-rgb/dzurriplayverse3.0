"use client";

import { useSyncExternalStore } from "react";
import { getFavorites, subscribeStorage, toggleFavorite } from "@/lib/client-storage";

export function FavoriteButton({ gameId, title, className = "" }: { gameId: string; title: string; className?: string }) {
  const favs = useSyncExternalStore(
    subscribeStorage,
    () => JSON.stringify(getFavorites()),
    () => "[]",
  );
  const active = (JSON.parse(favs) as string[]).includes(gameId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(gameId);
      }}
      aria-pressed={active}
      aria-label={active ? `Buang ${title} daripada kegemaran` : `Tambah ${title} ke kegemaran`}
      className={`grid size-10 place-items-center rounded-full bg-space/70 backdrop-blur transition hover:bg-space ${className}`}
    >
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill={active ? "#F59E0B" : "none"} stroke={active ? "#F59E0B" : "currentColor"} strokeWidth="2" strokeLinejoin="round">
        <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
      </svg>
    </button>
  );
}
