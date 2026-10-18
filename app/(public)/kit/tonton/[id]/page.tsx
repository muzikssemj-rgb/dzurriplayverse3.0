import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKit, getPublishedVideo } from "@/lib/data/kit";
import { getPublishedQuizzes } from "@/lib/data/quiz";
import { DataNotice } from "@/components/ui/DataNotice";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { VideoRow } from "@/components/kit/KitCards";
import { YouTubePlayer } from "@/components/kit/YouTubePlayer";
import { ShareButton } from "@/components/kit/ShareButton";
import { QuizGrid } from "@/components/quiz/QuizCard";
import { linkInfo, resourceThumb, subjectPath } from "@/lib/kit";
import { LinkViewer } from "@/components/kit/LinkViewer";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/kit/tonton/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const r = await getPublishedVideo(id);
  if (!r.ok || !r.data) return { title: "Video" };
  const img = resourceThumb(r.data);
  return { title: r.data.title, description: r.data.description || undefined, openGraph: img?.startsWith("https://") ? { images: [img] } : undefined };
}

export default async function WatchPage(props: PageProps<"/kit/tonton/[id]">) {
  const { id } = await props.params;
  const [res, kit, quizzes] = await Promise.all([getPublishedVideo(id), getKit(), getPublishedQuizzes()]);
  if (!res.ok) return <DataNotice error={res.error} />;
  const video = res.data;
  if (!video) notFound();
  const subjects = kit.ok ? kit.data.subjects : [];
  const path = subjectPath(subjects, video.subject_id);
  const subject = path[path.length - 1];
  const related = kit.ok ? kit.data.videos.filter((v) => v.subject_id === video.subject_id && v.id !== video.id).slice(0, 10) : [];
  const relQuiz = quizzes.ok && video.subject_id ? quizzes.data.filter((q) => q.subject_id === video.subject_id) : [];

  return (
    <div className="space-y-6">
      <nav aria-label="Laluan" className="flex flex-wrap gap-1 text-sm text-ink-muted">
        <Link href="/kit" className="hover:text-cyan-electric">Kit Pembelajaran</Link>
        {path.map((p) => (
          <span key={p.id}>
            {" "}/{" "}
            <Link href={`/kit/${p.slug}`} className="hover:text-cyan-electric">{p.name}</Link>
          </span>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {video.kind === "youtube" ? (
            <YouTubePlayer id={video.youtube_id} start={video.start_seconds} title={video.title} />
          ) : video.open_mode === "embed" ? (
            <LinkViewer url={video.url} title={video.title} />
          ) : (
            <LinkCard url={video.url} thumb={video.thumbnail_url} title={video.title} />
          )}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-display text-xl font-black tracking-wide sm:text-2xl">{video.title}</h1>
            <ShareButton title={video.title} path={`/kit/tonton/${video.id}`} />
          </div>
          {video.description && (
            <section className="glass p-4" aria-labelledby="nota">
              <h2 id="nota" className="mb-1 text-sm font-bold text-gold">📌 Nota cikgu</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-white/85">{video.description}</p>
            </section>
          )}
        </div>
        <aside className="space-y-3">
          {subject && (
            <Link href={`/kit/${subject.slug}`} className="glass flex items-center gap-3 p-4 hover:border-cyan-electric/40">
              <span className="text-3xl" aria-hidden="true">{subject.icon || "🎵"}</span>
              <span>
                <span className="block text-xs text-ink-muted">Subjek</span>
                <span className="font-semibold">{subject.name}</span>
              </span>
            </Link>
          )}
          {relQuiz.length > 0 && (
            <div className="glass border-gold/40 p-4">
              <p className="text-sm font-bold text-gold">Sudah tonton? Uji diri anda!</p>
              <Link href={`/kuiz/${relQuiz[0].slug}`} className="btn-primary mt-3 w-full">🎮 {relQuiz[0].title}</Link>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related">
          <SectionHeader id="related" title={`Lagi dalam ${subject?.name ?? "subjek ini"}`} icon="🎬" href={subject ? `/kit/${subject.slug}` : undefined} />
          <VideoRow videos={related} />
        </section>
      )}
      {relQuiz.length > 1 && (
        <section aria-labelledby="rq">
          <SectionHeader id="rq" title="Kuiz Berkaitan" icon="📝" />
          <QuizGrid quizzes={relQuiz} subjects={subjects} />
        </section>
      )}
    </div>
  );
}

function LinkCard({ url, thumb, title }: { url: string; thumb: string | null; title: string }) {
  const li = linkInfo(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group glass neon-border relative block overflow-hidden"
      aria-label={`Buka ${title} di tab baharu`}
    >
      <div className="relative aspect-video bg-space">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="size-full object-cover opacity-80 transition group-hover:opacity-100" />
        ) : (
          <span className="grid size-full place-items-center bg-gradient-to-br from-galaxy/50 via-space-3 to-cyan-electric/25 text-8xl" aria-hidden="true">
            {li.icon}
          </span>
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/30" aria-hidden="true">
          <span className="btn-primary pointer-events-none !min-h-14 !px-6 text-base shadow-2xl">↗ Buka {li.isClaude ? "Artifak Claude" : "Laman"}</span>
        </span>
      </div>
      <p className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs text-ink-muted">
        <span>
          {li.icon} {li.label} · <span className="text-white">{li.host}</span>
        </span>
        <span>Dibuka di tab baharu — kembali ke tab ini selepas selesai.</span>
      </p>
    </a>
  );
}
