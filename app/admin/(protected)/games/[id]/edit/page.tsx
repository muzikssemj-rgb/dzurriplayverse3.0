import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameForm } from "@/components/admin/GameForm";
import { Flash } from "@/components/admin/Flash";
import { getAdminGame, listAdminCategories } from "@/lib/data/store";

export const metadata: Metadata = { title: "Edit Game" };

export default async function EditGamePage(props: PageProps<"/admin/games/[id]/edit">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const [game, categories] = await Promise.all([getAdminGame(id), listAdminCategories()]);
  if (!game) notFound();
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/games" className="text-sm text-white/70 hover:underline">‹ Games</Link>
          <h1 className="font-display text-2xl font-black tracking-wide">Edit: {game.title}</h1>
        </div>
        <Link href={`/admin/games/${game.id}/preview`} className="btn-ghost">👁 Preview</Link>
      </header>
      <Flash msg={typeof sp.msg === "string" ? sp.msg : undefined} />
      <GameForm key={game.updated_at} game={game} categories={categories} />
    </div>
  );
}
