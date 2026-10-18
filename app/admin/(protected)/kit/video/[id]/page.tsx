import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoForm } from "@/components/admin/VideoForm";
import { getAdminKit, getAdminVideo } from "@/lib/data/kit";

export const metadata: Metadata = { title: "Edit Video" };

export default async function EditVideoPage(props: PageProps<"/admin/kit/video/[id]">) {
  const { id } = await props.params;
  const [video, { flat }] = await Promise.all([getAdminVideo(id), getAdminKit()]);
  if (!video) notFound();
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/kit" className="text-sm text-white/70 hover:underline">‹ Kit Pembelajaran</Link>
          <h1 className="font-display text-2xl font-black tracking-wide">Edit: {video.title}</h1>
        </div>
        {video.status === "published" && (
          <Link href={`/kit/tonton/${video.id}`} target="_blank" className="btn-ghost">👁 Lihat</Link>
        )}
      </header>
      <VideoForm key={video.updated_at} video={video} subjects={flat.map((s) => ({ id: s.id, name: s.name, depth: s.depth, icon: s.icon }))} />
    </div>
  );
}
