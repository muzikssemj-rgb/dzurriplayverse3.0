import type { Metadata } from "next";
import Link from "next/link";
import { getKit } from "@/lib/data/kit";
import { getPublishedQuizzes } from "@/lib/data/quiz";
import { DataNotice } from "@/components/ui/DataNotice";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SubjectGrid, VideoRow } from "@/components/kit/KitCards";
import { QuizGrid } from "@/components/quiz/QuizCard";
import { descendantIds } from "@/lib/kit";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Kit Pembelajaran Muzik",
  description: "Video pembelajaran muzik mengikut subjek: alat muzik, muzik komputer, aural dan teori.",
};

export default async function KitPage() {
  const [kit, quizzes] = await Promise.all([getKit(), getPublishedQuizzes()]);
  if (!kit.ok) return <DataNotice error={kit.error} />;
  const { tree, videos, subjects } = kit.data;
  const recent = [...videos].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10);

  return (
    <div className="space-y-10">
      <header className="glass neon-border relative overflow-hidden p-6 sm:p-8">
        <span className="absolute -right-6 -top-8 text-[9rem] opacity-10" aria-hidden="true">🎼</span>
        <p className="font-display text-xs font-bold tracking-[0.3em] text-cyan-electric">TONTON · BELAJAR · CUBA</p>
        <h1 className="mt-1 font-display text-3xl font-black tracking-wide sm:text-4xl">
          <span className="text-gradient">Kit Pembelajaran</span> <span className="text-gold-gradient">Muzik</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
          Video pembelajaran pilihan cikgu, disusun mengikut subjek. Pilih subjek, tonton video, kemudian uji kefahaman anda dengan kuiz.
        </p>
      </header>

      {tree.length === 0 ? (
        <p className="glass p-6 text-center text-ink-muted">Belum ada subjek. Kandungan baharu akan tiba tidak lama lagi!</p>
      ) : (
        <section aria-labelledby="kit-subjects">
          <SectionHeader id="kit-subjects" title="Pilih Subjek" icon="🗂️" />
          <SubjectGrid nodes={tree} />
        </section>
      )}

      {recent.length > 0 && (
        <section aria-labelledby="kit-recent">
          <SectionHeader id="kit-recent" title="Video Terbaru" icon="🆕" />
          <VideoRow videos={recent} subjects={subjects} />
        </section>
      )}

      {tree.map((top) => {
        const ids = new Set(descendantIds(top));
        const vids = videos.filter((v) => v.subject_id && ids.has(v.subject_id)).slice(0, 10);
        if (vids.length === 0) return null;
        return (
          <section key={top.id} aria-labelledby={`kit-${top.id}`}>
            <SectionHeader id={`kit-${top.id}`} title={top.name} icon={top.icon ?? "🎵"} href={`/kit/${top.slug}`} />
            {top.children.length > 0 && (
              <ul className="scrollbar-none -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                {top.children.map((c) => (
                  <li key={c.id}>
                    <Link href={`/kit/${c.slug}`} className="chip !min-h-9 !py-1 text-xs">
                      {c.icon} {c.name} <span className="text-ink-muted">({c.video_count})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <VideoRow videos={vids} subjects={subjects} />
          </section>
        );
      })}

      {quizzes.ok && quizzes.data.length > 0 && (
        <section aria-labelledby="kit-quiz">
          <SectionHeader id="kit-quiz" title="Uji Diri dengan Kuiz" icon="📝" href="/kuiz" />
          <QuizGrid quizzes={quizzes.data.slice(0, 8)} subjects={subjects} />
        </section>
      )}
    </div>
  );
}
