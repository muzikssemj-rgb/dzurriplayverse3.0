import type { Metadata } from "next";
import Link from "next/link";
import { VideoForm } from "@/components/admin/VideoForm";
import { getAdminKit } from "@/lib/data/kit";

export const metadata: Metadata = { title: "Tambah Video" };

export default async function NewVideoPage(props: PageProps<"/admin/kit/video/new">) {
  const sp = await props.searchParams;
  const { flat } = await getAdminKit();
  const def = typeof sp.subjek === "string" && flat.some((s) => s.id === sp.subjek) ? sp.subjek : "";
  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/kit" className="text-sm text-white/70 hover:underline">‹ Kit Pembelajaran</Link>
        <h1 className="font-display text-2xl font-black tracking-wide">Tambah Video YouTube</h1>
      </header>
      <VideoForm subjects={flat.map((s) => ({ id: s.id, name: s.name, depth: s.depth, icon: s.icon }))} defaultSubject={def} />
    </div>
  );
}
