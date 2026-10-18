import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminQuiz, listResults } from "@/lib/data/quiz";
import { clearResultsAction, deleteResultAction } from "@/lib/actions/quiz";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { Flash } from "@/components/admin/Flash";
import { rankLeaders } from "@/lib/quiz";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Keputusan Kuiz" };

const fmtTime = (ms: number) => {
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
};

export default async function ResultsPage(props: PageProps<"/admin/kuiz/[id]/keputusan">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const kelas = typeof sp.kelas === "string" ? sp.kelas.slice(0, 30) : "";
  const sort = sp.sort === "terkini" ? "terkini" : "skor";
  const [quiz, all] = await Promise.all([getAdminQuiz(id), listResults(id)]);
  if (!quiz) notFound();
  const classes = [...new Set(all.map((r) => r.kelas).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const rows = all.filter((r) => !kelas || r.kelas === kelas);
  const ranked = rankLeaders(rows);
  const list = sort === "terkini" ? rows : ranked.map((e) => rows.find((r) => r.id === e.id)!);
  const rankOf = new Map(ranked.map((r, i) => [r.id, i + 1]));
  const avg = rows.length ? Math.round((rows.reduce((n, r) => n + r.correct / Math.max(r.total, 1), 0) / rows.length) * 100) : 0;
  const perQuestion = quiz.questions.map((q, i) => {
    const wrong = rows.filter((r) => r.wrong.includes(q.id)).length;
    const pct = rows.length ? Math.round(((rows.length - wrong) / rows.length) * 100) : 0;
    return { i, q, pct };
  });
  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams({ ...(kelas ? { kelas } : {}), ...(sort !== "skor" ? { sort } : {}), ...over });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    const s = p.toString();
    return `/admin/kuiz/${id}/keputusan${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/kuiz" className="text-sm text-white/70 hover:underline">‹ Kuiz Guru</Link>
          <h1 className="font-display text-2xl font-black tracking-wide">🏆 Keputusan: {quiz.title}</h1>
          <p className="text-sm text-ink-muted">{quiz.questions.length} soalan · {quiz.time_limit}s setiap soalan</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/admin/kuiz/${id}/csv${kelas ? `?kelas=${encodeURIComponent(kelas)}` : ""}`} className="btn-ghost">⬇ Muat turun CSV (Excel)</a>
          {all.length > 0 && (
            <ConfirmSubmit
              action={clearResultsAction}
              fields={{ quiz_id: id }}
              label="Padam semua"
              confirmLabel="Ya, padam semua"
              title="Padam SEMUA keputusan kuiz ini?"
              message={`${all.length} keputusan murid akan dipadam (sesuai sebelum kelas baharu bermula). Tindakan ini tidak boleh diundur.`}
            />
          )}
        </div>
      </header>
      <Flash msg={typeof sp.msg === "string" ? sp.msg : undefined} />

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Murid bermain", value: rows.length, tone: "text-cyan-electric" },
          { label: "Purata betul", value: `${avg}%`, tone: "text-gold" },
          { label: "Skor tertinggi", value: ranked[0]?.score ?? 0, tone: "text-emerald-300" },
          { label: "Kelas", value: classes.length, tone: "text-violet-300" },
        ].map((c) => (
          <li key={c.label} className="glass p-4">
            <p className={`font-display text-3xl font-black ${c.tone}`}>{c.value}</p>
            <p className="mt-1 text-sm text-ink-muted">{c.label}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink-muted">Kelas:</span>
        <Link href={qs({ kelas: "" })} className={`chip !min-h-9 !py-1 text-xs ${!kelas ? "chip-active" : ""}`}>Semua</Link>
        {classes.map((c) => (
          <Link key={c} href={qs({ kelas: c })} className={`chip !min-h-9 !py-1 text-xs ${kelas === c ? "chip-active" : ""}`}>{c}</Link>
        ))}
        <span className="ml-auto text-sm text-ink-muted">Susun:</span>
        <Link href={qs({ sort: "" })} className={`chip !min-h-9 !py-1 text-xs ${sort === "skor" ? "chip-active" : ""}`}>Skor</Link>
        <Link href={qs({ sort: "terkini" })} className={`chip !min-h-9 !py-1 text-xs ${sort === "terkini" ? "chip-active" : ""}`}>Terkini</Link>
      </div>

      {list.length === 0 ? (
        <p className="glass p-8 text-center text-ink-muted">
          Belum ada murid bermain.{" "}
          {quiz.status === "published" ? (
            <>
              Kongsi pautan <code className="text-white">/kuiz/{quiz.slug}</code> kepada murid.
            </>
          ) : (
            "Terbitkan kuiz dahulu."
          )}
        </p>
      ) : (
        <div className="glass overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Nama</th>
                <th className="p-3">Kelas</th>
                <th className="p-3 text-right">Skor</th>
                <th className="p-3 text-right">Betul</th>
                <th className="p-3 text-right">Masa</th>
                <th className="p-3">Tarikh</th>
                <th className="p-3"><span className="sr-only">Tindakan</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {list.map((r) => (
                <tr key={r.id}>
                  <td className="p-3 font-bold text-gold">{rankOf.get(r.id)}</td>
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3">{r.kelas || "—"}</td>
                  <td className="p-3 text-right font-display font-bold text-cyan-electric">{r.score}</td>
                  <td className="p-3 text-right">
                    {r.correct}/{r.total}
                  </td>
                  <td className="p-3 text-right">{fmtTime(r.duration_ms)}</td>
                  <td className="p-3 text-xs text-ink-muted">{formatDateTime(r.created_at)}</td>
                  <td className="p-3 text-right">
                    <ConfirmSubmit
                      action={deleteResultAction}
                      fields={{ id: r.id, quiz_id: id }}
                      label="✕"
                      confirmLabel="Ya, padam"
                      title={`Padam keputusan ${r.name}?`}
                      message="Keputusan ini akan dibuang daripada papan skor."
                      className="btn-ghost !min-h-8 !px-2 text-xs text-red-300"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <section className="glass p-5" aria-labelledby="analisis">
          <h2 id="analisis" className="mb-1 font-bold">📊 Analisis soalan</h2>
          <p className="mb-4 text-xs text-ink-muted">Peratus murid yang menjawab betul. Soalan merah mungkin perlu diulang kaji di kelas.</p>
          <ol className="space-y-3">
            {perQuestion.map(({ i, q, pct }) => (
              <li key={q.id} className="space-y-1">
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-bold text-white/70">S{i + 1}.</span> {q.text}
                  </span>
                  <span className={`shrink-0 font-bold ${pct >= 70 ? "text-emerald-300" : pct >= 40 ? "text-amber-200" : "text-red-300"}`}>{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                  <div className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
