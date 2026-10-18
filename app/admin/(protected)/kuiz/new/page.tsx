import type { Metadata } from "next";
import Link from "next/link";
import { QuizEditor } from "@/components/admin/QuizEditor";
import { getAdminKit } from "@/lib/data/kit";

export const metadata: Metadata = { title: "Cipta Kuiz" };

export default async function NewQuizPage() {
  const { flat } = await getAdminKit();
  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/kuiz" className="text-sm text-white/70 hover:underline">‹ Kuiz Guru</Link>
        <h1 className="font-display text-2xl font-black tracking-wide">Cipta Kuiz</h1>
      </header>
      <QuizEditor subjects={flat.map((s) => ({ id: s.id, name: s.name, depth: s.depth, icon: s.icon }))} />
    </div>
  );
}
