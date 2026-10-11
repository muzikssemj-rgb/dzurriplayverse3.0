import Link from "next/link";
import { Hero } from "@/components/games/Hero";
import { CategoryChips } from "@/components/games/CategoryChips";
import { GameGrid, GameRow } from "@/components/games/GameCard";
import { WorldCard } from "@/components/games/WorldCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DataNotice } from "@/components/ui/DataNotice";
import { getCategories, getCreatorProfile, getPublishedGames } from "@/lib/data/public";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [profile, cats, featured, popular, recent, all] = await Promise.all([
    getCreatorProfile(),
    getCategories(),
    getPublishedGames({ featured: true, limit: 12 }),
    getPublishedGames({ sort: "popular", limit: 8 }),
    getPublishedGames({ sort: "recent", limit: 8 }),
    getPublishedGames({ limit: 8 }),
  ]);
  const error = !cats.ok ? cats.error : !all.ok ? all.error : null;

  return (
    <div className="space-y-10">
      <Hero image={profile.hero_url || profile.photo_url} creatorName={profile.name} />

      {error ? (
        <DataNotice error={error} />
      ) : (
        <>
          {cats.ok && <CategoryChips categories={cats.data} />}

          {featured.ok && featured.data.games.length > 0 && (
            <section aria-labelledby="featured" className="scroll-mt-24">
              <SectionHeader id="featured" title="Featured Games" icon="⭐" href="/games?featured=1" />
              <GameRow games={featured.data.games} />
            </section>
          )}

          {popular.ok && popular.data.games.length > 0 && (
            <section aria-labelledby="popular">
              <SectionHeader id="popular" title="Popular Games" icon="🔥" href="/games?sort=popular" />
              <GameRow games={popular.data.games} />
            </section>
          )}

          {cats.ok && cats.data.length > 0 && (
            <section aria-labelledby="worlds">
              <SectionHeader id="worlds" title="Game Worlds" icon="🌍" href="/games" linkLabel="All games" />
              <ul className="grid grid-cols-2 gap-3 min-[520px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
                {cats.data.map((c, i) => (
                  <li key={c.id}>
                    <WorldCard category={c} index={i} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recent.ok && recent.data.games.length > 0 && (
            <section aria-labelledby="recent">
              <SectionHeader id="recent" title="Recently Added" icon="🆕" href="/games?sort=recent" />
              <GameRow games={recent.data.games} />
            </section>
          )}

          <ExplorerBanner name={profile.name} photo={profile.photo_url} />

          {all.ok && (
            <section aria-labelledby="explore-all">
              <SectionHeader id="explore-all" title="Explore All Games" icon="🎮" href="/games" />
              {all.data.games.length > 0 ? (
                <GameGrid games={all.data.games} />
              ) : (
                <p className="glass p-6 text-center text-ink-muted">
                  No games have been published yet. New worlds are coming soon!
                </p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ExplorerBanner({ name, photo }: { name: string; photo: string | null }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10" aria-label="DZURRI PLAYVERSE motto">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/brand/explorer-banner.webp"
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-space via-space/70 to-transparent" />
      <div className="relative ml-auto flex max-w-md flex-col items-end gap-2 p-6 text-right sm:p-10">
        <p className="font-display text-sm font-bold leading-relaxed tracking-[0.25em] text-white/90 sm:text-base">
          MORE GAMES.
          <br />
          BRIGHTER MINDS.
          <br />A BETTER TOMORROW.
        </p>
        <p className="text-xs tracking-[0.3em] text-gold">👑 A DZURRI ORIGINAL</p>
        <Link href="/creator" className="btn-ghost mt-2 !pl-1.5">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" width={32} height={32} className="size-8 rounded-full border border-cyan-electric object-cover" />
          )}
          Meet the creator — {name}
        </Link>
      </div>
    </section>
  );
}
