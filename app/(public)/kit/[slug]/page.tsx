import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKit } from "@/lib/data/kit";
import { getPublishedQuizzes } from "@/lib/data/quiz";
import { DataNotice } from "@/components/ui/DataNotice";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SubjectGrid, VideoGrid, VideoRow } from "@/components/kit/KitCards";
import { QuizGrid } from "@/components/quiz/QuizCard";
import { ShareButton } from "@/components/kit/ShareButton";
import { descendantIds, flattenTree, subjectPath } from "@/lib/kit";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/kit/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const kit = await getKit();
  const s = kit.ok ? kit.data.subjects.find((x) => x.slug === slug) : null;
  return s ? { title: `${s.name} · Kit Pembelajaran`, description: s.description ?? undefined } : { title: "Kit Pembelajaran" };
}

export default async function SubjectPage(props: PageProps<"/kit/[slug]">) {
  const { slug } = await props.params;
  const [kit, quizzes] = await Promise.all([getKit(), getPublishedQuizzes()]);
  if (!kit.ok) return <DataNotice error={kit.error} />;
  const { tree, videos, subjects } = kit.data;
  const node = flattenTree(tree).find((n) => n.slug === slug);
  if (!node) notFound();
  const path = subjectPath(subjects, node.id);
  const own = videos.filter((v) => v.subject_id === node.id);
  const allIds = new Set(descendantIds(node));
  const relatedQuizzes = quizzes.ok ? quizzes.data.filter((q) => q.subject_id && allIds.has(q.subject_id)) : [];

  return (
    <div className="space-y-8">
      <nav aria-label="Laluan" className="flex flex-wrap gap-1 text-sm text-ink-muted">
        <Link href="/kit" className="hover:text-cyan-electric">Kit Pembelajaran</Link>
        {path.map((p) => (
          <span key={p.id}>
            {" "}/{" "}
            {p.id === node.id ? (
              <span className="text-white" aria-current="page">{p.name}</span>
            ) : (
              <Link href={`/kit/${p.slug}`} className="hover:text-cyan-electric">{p.name}</Link>
            )}
          </span>
        ))}
      </nav>

      <header className="glass relative flex flex-wrap items-center justify-between gap-4 overflow-hidden p-5 sm:p-6">
        <span className="absolute -right-4 -top-6 text-[7rem] opacity-10" aria-hidden="true">{node.icon || "🎵"}</span>
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-space text-4xl ring-1 ring-cyan-electric/40" aria-hidden="true">
            {node.icon || "🎵"}
          </span>
          <div>
            <h1 className="font-display text-2xl font-black tracking-wide sm:text-3xl">{node.name}</h1>
            {node.description && <p className="mt-1 text-sm text-ink-muted">{node.description}</p>}
            <p className="mt-1 text-xs text-white/70">
              🎬 {node.video_count} video{node.children.length > 0 && ` · 🗂️ ${node.children.length} kumpulan`}
            </p>
          </div>
        </div>
        <ShareButton title={`${node.name} — Kit Pembelajaran Muzik`} path={`/kit/${node.slug}`} />
      </header>

      {node.children.length > 0 && (
        <section aria-labelledby="sub-groups">
          <SectionHeader id="sub-groups" title={`Kumpulan dalam ${node.name}`} icon="🗂️" />
          <SubjectGrid nodes={node.children} />
        </section>
      )}

      {own.length > 0 && (
        <section aria-labelledby="own-videos">
          <SectionHeader id="own-videos" title={node.children.length ? `Video ${node.name}` : "Video"} icon="🎬" />
          <VideoGrid videos={own} />
        </section>
      )}

      {node.children.map((c) => {
        const ids = new Set(descendantIds(c));
        const vids = videos.filter((v) => v.subject_id && ids.has(v.subject_id)).slice(0, 10);
        if (!vids.length) return null;
        return (
          <section key={c.id} aria-labelledby={`grp-${c.id}`}>
            <SectionHeader id={`grp-${c.id}`} title={c.name} icon={c.icon ?? "🎵"} href={`/kit/${c.slug}`} />
            <VideoRow videos={vids} subjects={subjects} />
          </section>
        );
      })}

      {node.video_count === 0 && (
        <p className="glass p-6 text-center text-ink-muted">Belum ada video dalam {node.name}. Cikgu akan menambah video tidak lama lagi!</p>
      )}

      {relatedQuizzes.length > 0 && (
        <section aria-labelledby="sub-quiz">
          <SectionHeader id="sub-quiz" title="Kuiz Berkaitan" icon="📝" />
          <QuizGrid quizzes={relatedQuizzes} subjects={subjects} />
        </section>
      )}
    </div>
  );
}
