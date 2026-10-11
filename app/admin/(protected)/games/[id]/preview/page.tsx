import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminGame } from "@/lib/data/store";
import { setGameStatusAction } from "@/lib/actions/games";
import { GameLauncher } from "@/components/games/GameLauncher";
import { GameCard } from "@/components/games/GameCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Flash } from "@/components/admin/Flash";
import type { PublicGame } from "@/lib/types";

export const metadata: Metadata = { title: "Preview Game" };

export default async function PreviewGamePage(props: PageProps<"/admin/games/[id]/preview">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const game = await getAdminGame(id);
  if (!game) notFound();
  const asPublic = { ...game, category: game.category ?? null } as PublicGame;
  const back = `/admin/games/${game.id}/preview`;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/games" className="text-sm text-white/70 hover:underline">‹ Games</Link>
          <h1 className="flex flex-wrap items-center gap-3 font-display text-2xl font-black tracking-wide">
            Preview: {game.title} <StatusBadge status={game.status} />
          </h1>
          <p className="text-sm text-ink-muted">This is how players will see the game. Only you can see this page.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/games/${game.id}/edit`} className="btn-ghost">✎ Edit</Link>
          {game.status === "published" ? (
            <>
              <Link href={`/games/${game.slug}`} target="_blank" className="btn-ghost">View live ↗</Link>
              <form action={setGameStatusAction}>
                <input type="hidden" name="id" value={game.id} />
                <input type="hidden" name="status" value="unpublished" />
                <input type="hidden" name="back" value={back} />
                <button className="btn-ghost">Unpublish</button>
              </form>
            </>
          ) : (
            <form action={setGameStatusAction}>
              <input type="hidden" name="id" value={game.id} />
              <input type="hidden" name="status" value="published" />
              <input type="hidden" name="back" value={back} />
              <button className="btn-primary">🚀 Publish</button>
            </form>
          )}
        </div>
      </header>

      <Flash msg={typeof sp.msg === "string" ? sp.msg : undefined} />

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <section aria-labelledby="card-prev">
          <h2 id="card-prev" className="mb-2 text-sm font-semibold text-ink-muted">Game card</h2>
          <GameCard game={asPublic} />
        </section>
        <section aria-labelledby="launch-prev">
          <h2 id="launch-prev" className="mb-2 text-sm font-semibold text-ink-muted">Game launcher</h2>
          <GameLauncher
            preview
            game={{ id: game.id, title: game.title, slug: game.slug, game_url: game.game_url, launch_mode: game.launch_mode }}
          />
        </section>
      </div>
    </div>
  );
}
