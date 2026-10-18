import Link from "next/link";
import { linkInfo, resourceThumb, type Subject, type SubjectNode, type Video } from "@/lib/kit";

const GRADIENTS = [
  "from-fuchsia-700/80 via-violet-800/70 to-space",
  "from-sky-600/80 via-blue-800/70 to-space",
  "from-emerald-600/80 via-teal-800/70 to-space",
  "from-amber-600/80 via-orange-800/70 to-space",
  "from-cyan-600/80 via-sky-800/70 to-space",
  "from-rose-600/80 via-pink-800/70 to-space",
];

export function VideoCard({ video, subject }: { video: Video; subject?: Pick<Subject, "name" | "icon"> | null }) {
  const thumb = resourceThumb(video);
  const li = video.kind === "link" ? linkInfo(video.url) : null;
  return (
    <article className="group glass relative flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-cyan-electric/40 focus-within:border-cyan-electric/60">
      <div className="relative aspect-video overflow-hidden bg-space">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" loading="lazy" decoding="async" className="size-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <span className="grid size-full place-items-center bg-gradient-to-br from-galaxy/50 via-space-3 to-cyan-electric/25 text-6xl transition duration-500 group-hover:scale-105" aria-hidden="true">
            {li?.icon}
          </span>
        )}
        {video.kind === "youtube" ? (
          <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
            <span className="grid size-14 place-items-center rounded-full bg-red-600/90 text-2xl text-white shadow-lg ring-4 ring-white/20 transition group-hover:scale-110">▶</span>
          </span>
        ) : (
          <span className="absolute left-2 top-2 rounded-full bg-space/85 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/20">
            {li?.icon} {li?.label}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug text-white">
          <Link href={`/kit/tonton/${video.id}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
            {video.title}
          </Link>
        </h3>
        {video.description && <p className="line-clamp-2 text-sm text-ink-muted">{video.description}</p>}
        {subject && (
          <span className="mt-auto inline-flex w-fit rounded-full border border-galaxy/50 bg-galaxy/15 px-2 py-0.5 text-[11px] text-violet-200">
            {subject.icon} {subject.name}
          </span>
        )}
      </div>
    </article>
  );
}

export function VideoGrid({ videos, subjects }: { videos: Video[]; subjects?: Subject[] }) {
  const map = new Map((subjects ?? []).map((s) => [s.id, s]));
  return (
    <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {videos.map((v) => (
        <li key={v.id}>
          <VideoCard video={v} subject={v.subject_id ? map.get(v.subject_id) : null} />
        </li>
      ))}
    </ul>
  );
}

export function VideoRow({ videos, subjects }: { videos: Video[]; subjects?: Subject[] }) {
  const map = new Map((subjects ?? []).map((s) => [s.id, s]));
  return (
    <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {videos.map((v) => (
        <li key={v.id} className="w-[72vw] max-w-[300px] shrink-0 snap-start sm:w-[280px]">
          <VideoCard video={v} subject={v.subject_id ? map.get(v.subject_id) : null} />
        </li>
      ))}
    </ul>
  );
}

/** Kad subjek — ikon besar, nama, bilangan video & kumpulan di dalamnya. */
export function SubjectCard({ node, index }: { node: SubjectNode; index: number }) {
  return (
    <Link
      href={`/kit/${node.slug}`}
      className={`group relative flex h-full min-h-40 flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-4 transition hover:-translate-y-1 hover:border-cyan-electric/50 ${GRADIENTS[index % GRADIENTS.length]}`}
    >
      <span className="absolute -right-3 -top-3 text-7xl opacity-25 transition group-hover:scale-110 group-hover:opacity-40" aria-hidden="true">
        {node.icon || "🎵"}
      </span>
      <span className="text-4xl drop-shadow-[0_0_14px_rgba(34,211,238,.6)]" aria-hidden="true">
        {node.icon || "🎵"}
      </span>
      <span>
        <span className="block font-display text-base font-black uppercase leading-tight tracking-wide drop-shadow">{node.name}</span>
        {node.description && <span className="mt-1 line-clamp-2 block text-xs text-white/80">{node.description}</span>}
        <span className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
          <span className="rounded-full bg-black/30 px-2 py-0.5">📚 {node.video_count} bahan</span>
          {node.children.length > 0 && <span className="rounded-full bg-black/30 px-2 py-0.5">🗂️ {node.children.length} kumpulan</span>}
        </span>
      </span>
    </Link>
  );
}

export function SubjectGrid({ nodes }: { nodes: SubjectNode[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {nodes.map((n, i) => (
        <li key={n.id}>
          <SubjectCard node={n} index={i} />
        </li>
      ))}
    </ul>
  );
}
