import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeaderboard, getPublishedQuizBySlug } from "@/lib/data/quiz";
import { DataNotice } from "@/components/ui/DataNotice";
import { QuizGame } from "@/components/quiz/QuizGame";
import { ShareButton } from "@/components/kit/ShareButton";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/kuiz/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const r = await getPublishedQuizBySlug(slug);
  return r.ok && r.data ? { title: `${r.data.title} · Kuiz`, description: r.data.description || undefined } : { title: "Kuiz" };
}

export default async function QuizPlayPage(props: PageProps<"/kuiz/[slug]">) {
  const { slug } = await props.params;
  const res = await getPublishedQuizBySlug(slug);
  if (!res.ok) return <DataNotice error={res.error} />;
  const quiz = res.data;
  if (!quiz) notFound();
  const board = quiz.show_leaderboard ? await getLeaderboard(quiz.id, 10).catch(() => []) : [];
  return (
    <div className="space-y-4">
      <nav aria-label="Laluan" className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
        <span>
          <Link href="/kuiz" className="hover:text-cyan-electric">Kuiz</Link> / <span className="text-white">{quiz.title}</span>
        </span>
        <ShareButton title={quiz.title} path={`/kuiz/${quiz.slug}`} label="Kongsi kuiz" />
      </nav>
      <QuizGame quiz={quiz} initialBoard={board} />
    </div>
  );
}
