import type { Metadata } from "next";
import Link from "next/link";
import { getAdminKit } from "@/lib/data/kit";
import { deleteVideoAction, setVideoStatusAction } from "@/lib/actions/kit";
import { Flash } from "@/components/admin/Flash";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { descendantIds, linkInfo, resourceThumb, subjectPath } from "@/lib/kit";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Kit Pembelajaran" };

export default async function AdminKitPage(props: PageProps<"/admin/kit">) {
  const sp = await props.searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const subject = one(sp.subjek);
  const status = one(sp.status);
  const { subjects, flat, videos } = await getAdminKit();
  const node = flat.find((n) => n.id === subject);
  const allowed = node ? new Set(descendantIds(node)) : null;
  const list = videos.filter((v) => (!allowed || (v.subject_id && allowed.has(v.subject_id))) && (!status || v.status === status));
  const pathLabel = (id: string | null) => subjectPath(subjects, id).map((s) => s.name).join(" › ") || "— Tiada subjek —";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-wide">Kit Pembelajaran Muzik</h1>
          <p className="text-sm text-ink-muted">
            {videos.length} bahan · {subjects.length} subjek. Video YouTube & pautan laman web (termasuk artifak Claude) yang diterbitkan dipaparkan di tab <strong>Kit Muzik</strong> dan muka utama.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/kit/subjek" className="btn-ghost">🗂️ Urus Subjek</Link>
          <Link href="/admin/kit/video/new" className="btn-primary">＋ Tambah Bahan</Link>
        </div>
      </header>

      <Flash msg={one(sp.msg)} />

      <form method="get" className="glass grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]" role="search">
        <label className="sr-only" htmlFor="ksub">Subjek</label>
        <select id="ksub" name="subjek" defaultValue={subject} className="input">
          <option value="">Semua subjek</option>
          {flat.map((s) => (
            <option key={s.id} value={s.id}>
              {"— ".repeat(s.depth)}
              {s.icon} {s.name} ({s.video_count})
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="kstat">Status</label>
        <select id="kstat" name="status" defaultValue={status} className="input">
          <option value="">Semua status</option>
          <option value="published">Diterbitkan</option>
          <option value="draft">Draf</option>
        </select>
        <button className="btn-cyan">Tapis</button>
      </form>

      {list.length === 0 ? (
        <div className="glass p-8 text-center text-ink-muted">
          Belum ada bahan{node ? ` dalam ${node.name}` : ""}.{" "}
          <Link href={`/admin/kit/video/new${node ? `?subjek=${node.id}` : ""}`} className="text-cyan-electric underline">
            Tambah video YouTube atau pautan
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((v) => (
            <li key={v.id} className="glass flex flex-col gap-3 p-3 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {resourceThumb(v) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resourceThumb(v)!} alt="" loading="lazy" className="h-14 w-24 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="grid h-14 w-24 shrink-0 place-items-center rounded-lg bg-white/5 text-2xl" aria-hidden="true">{linkInfo(v.url).icon}</span>
                )}
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/kit/video/${v.id}`} className="truncate font-semibold hover:text-cyan-electric">{v.title}</Link>
                    <StatusBadge status={v.status} />
                  </p>
                  <p className="truncate text-xs text-ink-muted">
                    {v.kind === "link" ? `${linkInfo(v.url).icon} ${linkInfo(v.url).label} · ${v.open_mode === "embed" ? "dalam Playverse" : "tab baharu"}` : "▶ YouTube"} · {pathLabel(v.subject_id)} · {formatDateTime(v.updated_at)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/kit/video/${v.id}`} className="btn-ghost !min-h-9 !px-3">Edit</Link>
                {v.status === "published" && (
                  <Link href={`/kit/tonton/${v.id}`} target="_blank" className="btn-ghost !min-h-9 !px-3">Lihat ↗</Link>
                )}
                <form action={setVideoStatusAction}>
                  <input type="hidden" name="id" value={v.id} />
                  <input type="hidden" name="status" value={v.status === "published" ? "draft" : "published"} />
                  <button className="btn-ghost !min-h-9 !px-3">{v.status === "published" ? "Jadikan Draf" : "Terbitkan"}</button>
                </form>
                <ConfirmSubmit
                  action={deleteVideoAction}
                  fields={{ id: v.id }}
                  label="Padam"
                  confirmLabel="Ya, padam"
                  title={`Padam “${v.title}”?`}
                  message="Bahan akan dibuang daripada Kit Pembelajaran. Video / laman asal tidak terjejas."
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
