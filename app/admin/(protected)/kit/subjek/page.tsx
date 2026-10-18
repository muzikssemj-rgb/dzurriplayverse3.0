import type { Metadata } from "next";
import Link from "next/link";
import { getAdminKit } from "@/lib/data/kit";
import { deleteSubjectAction } from "@/lib/actions/kit";
import { SubjectForm } from "@/components/admin/SubjectForm";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { Flash } from "@/components/admin/Flash";
import { MAX_SUBJECT_DEPTH } from "@/lib/kit";

export const metadata: Metadata = { title: "Subjek Kit" };

export default async function SubjectsPage(props: PageProps<"/admin/kit/subjek">) {
  const sp = await props.searchParams;
  const { flat } = await getAdminKit();
  const parents = flat.filter((s) => s.depth < MAX_SUBJECT_DEPTH - 1).map((s) => ({ id: s.id, name: s.name, depth: s.depth, icon: s.icon }));
  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/kit" className="text-sm text-white/70 hover:underline">‹ Kit Pembelajaran</Link>
        <h1 className="font-display text-2xl font-black tracking-wide">Subjek & Kumpulan</h1>
        <p className="max-w-3xl text-sm text-ink-muted">
          Susun kandungan sehingga {MAX_SUBJECT_DEPTH} peringkat, contohnya <strong>Alat Muzik Utama › Strings › Violin</strong>. Pilih “Di bawah” untuk
          meletakkan subjek dalam kumpulan. Subjek utama dipaparkan sebagai kad di muka utama.
        </p>
      </header>
      <Flash msg={typeof sp.msg === "string" ? sp.msg : undefined} />

      <section className="glass neon-border p-4" aria-labelledby="add-subject">
        <h2 id="add-subject" className="mb-3 font-bold">Tambah subjek / jenis alat muzik</h2>
        <SubjectForm parents={parents} />
      </section>

      {flat.length === 0 ? (
        <p className="glass p-6 text-center text-ink-muted">Belum ada subjek.</p>
      ) : (
        <ul className="space-y-3">
          {flat.map((s) => (
            <li key={s.id} className="glass space-y-2 p-4" style={{ marginLeft: `${Math.min(s.depth, 3) * 1.25}rem` }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {s.depth > 0 && <span className="text-ink-muted" aria-hidden="true">↳ </span>}
                  {s.icon} {s.name}{" "}
                  <span className="text-xs font-normal text-ink-muted">
                    · {s.video_count} video{s.children.length ? ` · ${s.children.length} sub-subjek` : ""}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/kit/video/new?subjek=${s.id}`} className="btn-ghost !min-h-9 !px-3">＋ Video</Link>
                  <Link href={`/kit/${s.slug}`} target="_blank" className="btn-ghost !min-h-9 !px-3">Lihat ↗</Link>
                  <ConfirmSubmit
                    action={deleteSubjectAction}
                    fields={{ id: s.id }}
                    label="Padam"
                    confirmLabel="Ya, padam"
                    title={`Padam subjek “${s.name}”?`}
                    message={
                      s.video_count > 0 || s.children.length > 0
                        ? "Video, kuiz dan sub-subjek di dalamnya TIDAK dipadam — ia akan dipindahkan ke subjek induk."
                        : "Subjek ini kosong. Tindakan ini tidak boleh diundur."
                    }
                  />
                </div>
              </div>
              <SubjectForm key={s.updated_at} subject={{ id: s.id, name: s.name, slug: s.slug, description: s.description, icon: s.icon, parent_id: s.parent_id, display_order: s.display_order, created_at: s.created_at, updated_at: s.updated_at }} parents={parents} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
