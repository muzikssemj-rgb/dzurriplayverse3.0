"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { PublicGame } from "@/lib/types";
import { clearRecent, getFavorites, getRecent, subscribeStorage } from "@/lib/client-storage";
import { GameThumb } from "@/components/games/GameThumb";
import { FavoriteButton } from "@/components/games/FavoriteButton";

/** Senarai permainan daripada storan peranti (kegemaran / baru dimainkan). */
export function SavedGamesList({ kind, emptyText }: { kind: "favorites" | "recent"; emptyText: string }) {
  const idsJson = useSyncExternalStore(
    subscribeStorage,
    () => JSON.stringify(kind === "favorites" ? getFavorites() : getRecent()),
    () => "null",
  );
  const [games, setGames] = useState<PublicGame[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ids = JSON.parse(idsJson) as string[] | null;
    if (ids === null) return;
    if (ids.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGames([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/games?ids=${ids.join(",")}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: { games: PublicGame[] }) => {
        if (cancelled) return;
        const byId = new Map(j.games.map((g) => [g.id, g]));
        setGames(ids.map((id) => byId.get(id)).filter(Boolean) as PublicGame[]);
        setError(false);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [idsJson]);

  if (error) return <p className="glass p-5 text-sm text-ink-muted">Could not load your games. Check your internet connection.</p>;
  if (!games) return <p className="text-sm text-ink-muted" role="status">Loading…</p>;
  if (games.length === 0) return <p className="glass p-6 text-center text-ink-muted">{emptyText}</p>;

  return (
    <div className="space-y-3">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => (
          <li key={g.id} className="glass flex items-center gap-3 p-3">
            <GameThumb src={g.thumbnail_url} alt="" icon={g.category?.icon} className="size-16 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <Link href={`/games/${g.slug}`} className="block truncate font-semibold hover:text-cyan-electric">
                {g.title}
              </Link>
              <p className="truncate text-xs text-ink-muted">{g.category?.name ?? "Game"}</p>
            </div>
            <FavoriteButton gameId={g.id} title={g.title} />
            <Link href={`/games/${g.slug}`} className="btn-cyan !min-h-10 !px-3" aria-label={`Play ${g.title}`}>
              ▶
            </Link>
          </li>
        ))}
      </ul>
      {kind === "recent" && (
        <button className="btn-ghost" onClick={() => clearRecent()}>
          Clear history
        </button>
      )}
    </div>
  );
}
