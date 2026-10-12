import Link from "next/link";
import type { PublicGame } from "@/lib/types";
import { DIFFICULTY_LABEL } from "@/lib/types";
import { GameThumb } from "@/components/games/GameThumb";
import { FavoriteButton } from "@/components/games/FavoriteButton";

const NEW_DAYS = 14;

export function isNewGame(game: Pick<PublicGame, "published_at" | "created_at">, now = Date.now()) {
  const ts = Date.parse(game.published_at ?? game.created_at);
  return Number.isFinite(ts) && now - ts < NEW_DAYS * 86_400_000;
}

export function GameCard({ game, eager = false }: { game: PublicGame; eager?: boolean }) {
  const isNew = isNewGame(game);
  return (
    <article className="group glass relative flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-cyan-electric/40 focus-within:border-cyan-electric/60">
      <div className="relative aspect-[16/10] overflow-hidden">
        <GameThumb
          src={game.thumbnail_url}
          alt={`Gambar kecil ${game.title}`}
          icon={game.category?.icon}
          eager={eager}
          className="size-full transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex gap-1.5">
          {game.is_featured && (
            <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-space">Pilihan</span>
          )}
          {isNew && (
            <span className="rounded-full bg-cyan-electric px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-space">Baharu</span>
          )}
        </div>
        <FavoriteButton gameId={game.id} title={game.title} className="absolute right-2 top-2 z-10" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold leading-snug text-white">
          <Link href={`/games/${game.slug}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
            {game.title}
          </Link>
        </h3>
        {game.description && <p className="line-clamp-2 text-sm text-ink-muted">{game.description}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          {game.category && (
            <span className="rounded-full border border-galaxy/50 bg-galaxy/15 px-2 py-0.5 text-violet-200">
              {game.category.icon} {game.category.name}
            </span>
          )}
          {game.difficulty && (
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-white/80">{DIFFICULTY_LABEL[game.difficulty]}</span>
          )}
          {game.tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-white/70">
              #{t}
            </span>
          ))}
        </div>
        <span className="btn-cyan pointer-events-none mt-2 !min-h-10 w-full" aria-hidden="true">
          ▶ Main Sekarang
        </span>
      </div>
    </article>
  );
}

export function GameGrid({ games, eagerCount = 0 }: { games: PublicGame[]; eagerCount?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {games.map((g, i) => (
        <li key={g.id}>
          <GameCard game={g} eager={i < eagerCount} />
        </li>
      ))}
    </ul>
  );
}

export function GameRow({ games }: { games: PublicGame[] }) {
  return (
    <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {games.map((g) => (
        <li key={g.id} className="w-[72vw] max-w-[300px] shrink-0 snap-start sm:w-[280px]">
          <GameCard game={g} />
        </li>
      ))}
    </ul>
  );
}
