import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameLauncher } from "@/components/games/GameLauncher";
import { FavoriteButton } from "@/components/games/FavoriteButton";
import { DataNotice } from "@/components/ui/DataNotice";
import { getPublishedGameBySlug } from "@/lib/data/public";
import { DIFFICULTY_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/games/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const res = await getPublishedGameBySlug(slug);
  if (!res.ok || !res.data) return { title: "Game" };
  return {
    title: res.data.title,
    description: res.data.description || undefined,
    openGraph: res.data.thumbnail_url?.startsWith("https://") ? { images: [res.data.thumbnail_url] } : undefined,
  };
}

export default async function GamePage(props: PageProps<"/games/[slug]">) {
  const { slug } = await props.params;
  const res = await getPublishedGameBySlug(slug);
  if (!res.ok) return <DataNotice error={res.error} />;
  const game = res.data;
  if (!game) notFound();

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/games" className="hover:text-cyan-electric">Games</Link>
        {game.category && (
          <>
            {" "}/{" "}
            <Link href={`/games?category=${game.category.slug}`} className="hover:text-cyan-electric">
              {game.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-wide sm:text-3xl">{game.title}</h1>
          {game.description && <p className="mt-1 text-ink-muted">{game.description}</p>}
        </div>
        <FavoriteButton gameId={game.id} title={game.title} className="shrink-0 border border-white/15" />
      </div>

      <GameLauncher
        game={{ id: game.id, title: game.title, slug: game.slug, game_url: game.game_url, launch_mode: game.launch_mode }}
      />

      <section className="glass grid gap-6 p-5 md:grid-cols-[2fr_1fr]" aria-labelledby="about-game">
        <div>
          <h2 id="about-game" className="mb-2 text-lg font-bold">About this game</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-white/85">
            {game.full_description || game.description || "No description yet."}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-1">
          {game.category && (
            <div>
              <dt className="text-ink-muted">Category</dt>
              <dd>{game.category.icon} {game.category.name}</dd>
            </div>
          )}
          {game.difficulty && (
            <div>
              <dt className="text-ink-muted">Difficulty</dt>
              <dd>{DIFFICULTY_LABEL[game.difficulty]}</dd>
            </div>
          )}
          {game.target_age && (
            <div>
              <dt className="text-ink-muted">Age group</dt>
              <dd>{game.target_age}</dd>
            </div>
          )}
          <div>
            <dt className="text-ink-muted">Mode</dt>
            <dd>{game.launch_mode === "embedded" ? "Plays inside Playverse" : "Opens external website"}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Connection</dt>
            <dd>{game.game_url.startsWith("/") ? "Built-in (works offline after first visit)" : "Internet required"}</dd>
          </div>
          {game.tags.length > 0 && (
            <div className="col-span-2 md:col-span-1">
              <dt className="text-ink-muted">Tags</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {game.tags.map((t) => (
                  <Link key={t} href={`/games?tag=${encodeURIComponent(t)}`} className="rounded-full bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10">
                    #{t}
                  </Link>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  );
}
