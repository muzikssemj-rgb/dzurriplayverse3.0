import type { Metadata } from "next";
import Link from "next/link";
import { listAdminQuizzes } from "@/lib/data/quiz";
import { getAdminKit } from "@/lib/data/kit";
import { deleteQuizAction, setQuizStatusAction } from "@/lib/actions/quiz";
import { Flash } from "@/components/admin/Flash";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Kuiz Guru" };

export default async function AdminQuizPage(props: PageProps<"/admin/kuiz">) {
  const sp = await props.searchParams;
  const [quizzes, { subjects }] = await Promise.all([listAdminQuizzes(), getAdminKit()]);
  const subj = new Map(subjects.map((s) => [s.id, s]));
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-wide">Kuiz Guru</h1>
          <p className="text-sm text-ink-muted">
            Cipta soalan aneka pilihan atau Betul/Salah. Murid bermain sebagai game pantas dengan pemasa, mata & combo, dan skor mereka direkod di sini.
          </p>
        </div>
        <Link href="/admin/kuiz/new" className="btn-primary">＋ Cipta Kuiz</Link>
      </header>
      <Flash msg={typeof sp.msg === "string" ? sp.msg : undefined} />

      {quizzes.length === 0 ? (
        <div className="glass p-8 text-center text-ink-muted">
          Belum ada kuiz. <Link href="/admin/kuiz/new" className="text-cyan-electric underline">Cipta kuiz pertama anda</Link>.
        </div>
      ) : (
        <ul className="space-y-3">
          {quizzes.map((q) => (
            <li key={q.id} className="glass flex flex-col gap-3 p-4 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/kuiz/${q.id}`} className="truncate font-semibold hover:text-cyan-electric">{q.title}</Link>
                  <StatusBadge status={q.status} />
                </p>
                <p className="text-xs text-ink-muted">
                  {q.questions.length} soalan · {q.time_limit}s/soalan
                  {q.subject_id && subj.get(q.subject_id) ? ` · ${subj.get(q.subject_id)!.name}` : ""} · {q.result_count} keputusan · {formatDateTime(q.updated_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/kuiz/${q.id}`} className="btn-ghost !min-h-9 !px-3">Edit</Link>
                <Link href={`/admin/kuiz/${q.id}/keputusan`} className="btn-ghost !min-h-9 !px-3">🏆 Keputusan ({q.result_count})</Link>
                {q.status === "published" && (
                  <Link href={`/kuiz/${q.slug}`} target="_blank" className="btn-ghost !min-h-9 !px-3">Main ↗</Link>
                )}
                <form action={setQuizStatusAction}>
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="status" value={q.status === "published" ? "draft" : "published"} />
                  <button className="btn-ghost !min-h-9 !px-3">{q.status === "published" ? "Jadikan Draf" : "Terbitkan"}</button>
                </form>
                <ConfirmSubmit
                  action={deleteQuizAction}
                  fields={{ id: q.id }}
                  label="Padam"
                  confirmLabel="Ya, padam"
                  title={`Padam kuiz “${q.title}”?`}
                  message={`Kuiz dan ${q.result_count} keputusan murid akan dipadam. Tindakan ini tidak boleh diundur.`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
