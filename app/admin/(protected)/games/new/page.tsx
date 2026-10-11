import type { Metadata } from "next";
import Link from "next/link";
import { GameForm } from "@/components/admin/GameForm";
import { listAdminCategories } from "@/lib/data/store";

export const metadata: Metadata = { title: "Add New Game" };

export default async function NewGamePage() {
  const categories = await listAdminCategories();
  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/games" className="text-sm text-white/70 hover:underline">‹ Games</Link>
        <h1 className="font-display text-2xl font-black tracking-wide">Add New Game</h1>
        <p className="text-sm text-ink-muted">Fill in the details → Preview → Publish. No code changes or redeploy needed.</p>
      </header>
      <GameForm categories={categories} />
    </div>
  );
}
