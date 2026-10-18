import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizEditor } from "@/components/admin/QuizEditor";
import { getAdminKit } from "@/lib/data/kit";
import { getAdminQuiz } from "@/lib/data/quiz";

export const metadata: Metadata = { title: "Edit Kuiz" };

export default async function EditQuizPage(props: PageProps<"/admin/kuiz/[id]">) {
  const { id } = await props.params;
  const [quiz, { flat }] = await Promise.all([getAdminQuiz(id), getAdminKit()]);
  if (!quiz) notFound();
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/kuiz" className="text-sm text-white/70 hover:underline">‹ Kuiz Guru</Link>
          <h1 className="font-display text-2xl font-black tracking-wide">Edit: {quiz.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/kuiz/${quiz.id}/keputusan`} className="btn-ghost">🏆 Keputusan</Link>
          {quiz.status === "published" && (
            <Link href={`/kuiz/${quiz.slug}`} target="_blank" className="btn-ghost">▶ Main</Link>
          )}
        </div>
      </header>
      <QuizEditor key={quiz.updated_at} quiz={quiz} subjects={flat.map((s) => ({ id: s.id, name: s.name, depth: s.depth, icon: s.icon }))} />
    </div>
  );
}
