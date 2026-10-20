import type { Metadata } from "next";
import { getDailyStats, summarize } from "@/lib/data/analytics";
import { getGamesBrief } from "@/lib/data/store";
import { getAdminKit } from "@/lib/data/kit";
import { getQuizzesBrief } from "@/lib/data/quiz";
import { linkInfo } from "@/lib/kit";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { BarChart } from "@/components/admin/BarChart";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const PAGE_LABEL: Record<string, string> = {
  home: "Halaman utama", games: "Senarai permainan", game: "Halaman permainan", favorites: "Kegemaran",
  kit: "Kit Pembelajaran (subjek)", kit_item: "Kit Pembelajaran (bahan)", kuiz: "Kuiz",
  me: "My Playverse", about: "About", creator: "Creator", install: "Install App", other: "Lain-lain",
};
const DEVICE_LABEL: Record<string, string> = { mobile: "📱 Telefon", tablet: "📲 Tablet", desktop: "💻 Komputer" };

function fmtDay(iso: string, withWeekday = false) {
  const d = new Date(`${iso}T00:00:00+08:00`);
  return new Intl.DateTimeFormat("ms-MY", { day: "numeric", month: "short", ...(withWeekday ? { weekday: "short" } : {}), timeZone: "Asia/Kuala_Lumpur" }).format(d);
}

export default async function AnalyticsPage() {
  const [rows, games, kit, quizzes] = await Promise.all([getDailyStats(60), getGamesBrief(), getAdminKit(), getQuizzesBrief()]);
  const s = summarize(rows);
  const now = new Date();
  const lastAt = [...rows].reverse().find((r) => r.last_at)?.last_at ?? null;
  const firstDay = rows.find((r) => r.views > 0 || r.plays > 0)?.date ?? null;
  const minsAgo = lastAt ? Math.round((now.getTime() - Date.parse(lastAt)) / 60000) : null;
  const isNew = (iso: string) => now.getTime() - Date.parse(iso) < 14 * 86_400_000;
  const gameRows = [...games]
    .filter((g) => g.status === "published")
    .map((g) => ({ ...g, d30: s.games[g.id] ?? 0 }))
    .sort((a, b) => b.d30 - a.d30 || b.play_count - a.play_count || b.added.localeCompare(a.added));
  const resourceRows = kit.videos
    .filter((v) => v.status === "published")
    .map((v) => ({ id: v.id, title: v.title, icon: v.kind === "link" ? linkInfo(v.url).icon : "▶", added: v.created_at, d30: s.resources[v.id] ?? 0 }))
    .sort((a, b) => b.d30 - a.d30 || b.added.localeCompare(a.added));
  const quizRows = quizzes
    .filter((q) => q.status === "published")
    .map((q) => ({ ...q, d30: s.quizzes[q.id] ?? 0 }))
    .sort((a, b) => b.d30 - a.d30 || b.added.localeCompare(a.added));
  const verdict = makeVerdict(s);

  const kpis = [
    { label: "Pelawat hari ini", value: s.today.visitors, sub: `${s.today.views} paparan · ${s.today.plays} main · ${s.today.opens} bahan · ${s.today.quizPlays} kuiz` },
    { label: "Pelawat 7 hari", value: s.week.visitors, sub: changeText(s.week.visitorsChange) },
    { label: "Pelawat 30 hari", value: s.month.visitors, sub: `${s.month.activeDays}/30 hari ada pelawat` },
    { label: "Sesi main 7 hari", value: s.week.plays, sub: changeText(s.week.playsChange) },
    { label: "Main / pelawat (30 hari)", value: s.month.playsPerVisitor, sub: "purata sesi main seorang" },
    {
      label: "Guna sebagai App (PWA)",
      value: s.month.visitors ? `${Math.round((s.month.appVisitors / s.month.visitors) * 100)}%` : "—",
      sub: `${s.month.appVisitors} pelawat 30 hari`,
    },
    { label: "Bahan Kit dibuka (30 hari)", value: s.month.opens, sub: "video & pautan dalam Kit" },
    { label: "Kuiz dimain (30 hari)", value: s.month.quizPlays, sub: "cubaan kuiz dimulakan" },
  ];

  const pages = Object.entries(s.pages).sort((a, b) => b[1] - a[1]);
  const devices = Object.entries(s.devices).sort((a, b) => b[1] - a[1]);
  const deviceTotal = devices.reduce((a, [, v]) => a + v, 0);
  const returningPct = s.month.newVisitors + s.month.returningVisitors
    ? Math.round((s.month.returningVisitors / (s.month.newVisitors + s.month.returningVisitors)) * 100)
    : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-wide">Analitik Pengguna</h1>
          <p className="text-sm text-ink-muted">Data tanpa nama (tiada nama, e-mel atau IP disimpan). Waktu Malaysia.</p>
        </div>
        <div className="text-right text-xs text-ink-muted">
          <Link href="/admin/analytics" className="btn-ghost !min-h-9 !px-3 text-sm" prefetch={false}>↻ Muat semula</Link>
          <p className="mt-1">Data setakat {formatDateTime(now.toISOString())}</p>
        </div>
      </header>

      <p className="glass px-4 py-3 text-sm" role="status">
        📡 <strong>Rekod terakhir diterima:</strong>{" "}
        {lastAt ? (
          <>
            {formatDateTime(lastAt)} <span className="text-ink-muted">({minsAgo! < 1 ? "baru sahaja" : minsAgo! < 60 ? `${minsAgo} minit lalu` : minsAgo! < 1440 ? `${Math.round(minsAgo! / 60)} jam lalu` : `${Math.round(minsAgo! / 1440)} hari lalu`})</span>
          </>
        ) : (
          <span className="text-ink-muted">tiada lagi selepas kemas kini ini (rekod lama sebelum kemas kini tetap disimpan & dikira di bawah).</span>
        )}
        {firstDay && <span className="block text-xs text-ink-muted">Data analitik pertama: {fmtDay(firstDay, true)} (dalam tempoh 60 hari).</span>}
      </p>

      <p className="rounded-xl border border-cyan-electric/30 bg-cyan-electric/5 px-4 py-3 text-sm text-white/85" role="note">
        ℹ️ <strong>Lawatan anda sendiri tidak dikira</strong> selagi anda log masuk sebagai admin dalam pelayar ini, supaya angka
        menunjukkan murid sebenar. Untuk menguji, buka Playverse dalam <strong>tetingkap Incognito / Private</strong> atau peranti lain.
        Satu sesi main dikira sekali bagi setiap tab (muat semula halaman tidak menambah kiraan).
      </p>

      <section className={`glass p-5 ${verdict.tone}`} aria-labelledby="verdict">
        <h2 id="verdict" className="text-lg font-bold">{verdict.title}</h2>
        <p className="mt-1 text-sm text-white/85">{verdict.body}</p>
      </section>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <li key={k.label} className="glass p-4">
            <p className="font-display text-3xl font-black text-white">{k.value}</p>
            <p className="mt-1 text-sm text-white/85">{k.label}</p>
            <p className="text-xs text-ink-muted">{k.sub}</p>
          </li>
        ))}
      </ul>

      <section className="glass p-5" aria-labelledby="c-visitors">
        <h2 id="c-visitors" className="font-bold">Pelawat unik harian · 30 hari</h2>
        <p className="mb-3 text-xs text-ink-muted">Sentuh / hover bar untuk butiran.</p>
        <BarChart
          ariaLabel="Pelawat unik harian dalam 30 hari"
          labelEvery={5}
          bars={s.daily.map((d) => ({ key: d.date, label: fmtDay(d.date), value: d.visitors, tooltip: `${fmtDay(d.date, true)}: ${d.visitors} pelawat · ${d.views} paparan` }))}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass p-5" aria-labelledby="c-plays">
          <h2 id="c-plays" className="mb-3 font-bold">Sesi main harian · 30 hari</h2>
          <BarChart
            ariaLabel="Sesi main harian dalam 30 hari"
            color="#F59E0B"
            width={400}
            labelEvery={7}
            bars={s.daily.map((d) => ({ key: d.date, label: fmtDay(d.date), value: d.plays, tooltip: `${fmtDay(d.date, true)}: ${d.plays} sesi main` }))}
          />
        </section>
        <section className="glass p-5" aria-labelledby="c-hours">
          <h2 id="c-hours" className="font-bold">Waktu paling aktif · 7 hari</h2>
          <p className="mb-3 text-xs text-ink-muted">
            {s.peakHour === null ? "Belum ada data." : `Paling ramai sekitar ${String(s.peakHour).padStart(2, "0")}:00–${String((s.peakHour + 1) % 24).padStart(2, "0")}:00.`}
          </p>
          <BarChart
            ariaLabel="Paparan halaman mengikut jam dalam 7 hari"
            color="#8B5CF6"
            width={400}
            labelEvery={4}
            bars={s.hourly.map((h) => ({ key: String(h.hour), label: String(h.hour).padStart(2, "0"), value: h.views, tooltip: `${String(h.hour).padStart(2, "0")}:00 – ${h.views} paparan` }))}
          />
        </section>
      </div>

      <section className="glass p-5" aria-labelledby="t-games">
        <h2 id="t-games" className="font-bold">🎮 Semua permainan / apps diterbitkan ({gameRows.length})</h2>
        <p className="mb-3 text-xs text-ink-muted">Apps baharu terus muncul di sini dengan 0 sesi main sehingga ada pemain membukanya.</p>
        <AppTable rows={gameRows.map((g) => ({ id: g.id, title: g.title, d30: g.d30, total: g.play_count, isNew: isNew(g.added), href: `/admin/games/${g.id}/edit`, note: g.launch_mode === "external" ? "tab baharu" : undefined }))} unit="sesi main" empty="Belum ada permainan diterbitkan." />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass p-5" aria-labelledby="t-kit">
          <h2 id="t-kit" className="mb-3 font-bold">📚 Bahan Kit Pembelajaran ({resourceRows.length})</h2>
          <AppTable rows={resourceRows.map((r) => ({ id: r.id, title: `${r.icon} ${r.title}`, d30: r.d30, isNew: isNew(r.added), href: `/admin/kit/video/${r.id}` }))} unit="kali dibuka" empty="Belum ada bahan diterbitkan." />
        </section>
        <section className="glass p-5" aria-labelledby="t-quiz">
          <h2 id="t-quiz" className="mb-3 font-bold">📝 Kuiz ({quizRows.length})</h2>
          <AppTable rows={quizRows.map((q) => ({ id: q.id, title: q.title, d30: q.d30, isNew: isNew(q.added), href: `/admin/kuiz/${q.id}/keputusan` }))} unit="kali dimain" empty="Belum ada kuiz diterbitkan." />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ListCard
          title="📱 Peranti pelawat · 30 hari"
          empty="Belum ada data."
          rows={devices.map(([k, v]) => [`${DEVICE_LABEL[k] ?? k} (${deviceTotal ? Math.round((v / deviceTotal) * 100) : 0}%)`, v])}
          footer={returningPct === null ? undefined : `Pelawat kembali: ${returningPct}% · Baharu: ${100 - returningPct}%`}
        />
        <ListCard title="📄 Halaman paling dilawati · 30 hari" empty="Belum ada data." rows={pages.map(([k, v]) => [PAGE_LABEL[k] ?? k, v])} />
      </div>

      <details className="glass p-5">
        <summary className="cursor-pointer font-semibold">Jadual data harian (30 hari)</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="text-ink-muted">
              <tr><th className="py-1.5">Tarikh</th><th>Pelawat</th><th>Paparan</th><th>Sesi main</th><th>Bahan</th><th>Kuiz</th></tr>
            </thead>
            <tbody>
              {[...s.daily].reverse().map((d) => (
                <tr key={d.date} className="border-t border-white/5">
                  <td className="py-1.5">{fmtDay(d.date, true)}</td><td>{d.visitors}</td><td>{d.views}</td><td>{d.plays}</td><td>{d.opens}</td><td>{d.quizPlays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function AppTable({ rows, unit, empty }: { rows: { id: string; title: string; d30: number; total?: number; isNew: boolean; href: string; note?: string }[]; unit: string; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-ink-muted">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.d30));
  const hasTotal = rows.some((r) => r.total !== undefined);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="py-1.5">Nama</th>
            <th className="w-2/5">30 hari ({unit})</th>
            {hasTotal && <th className="text-right">Keseluruhan</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-white/5">
              <td className="py-2 pr-3">
                <Link href={r.href} className="hover:text-cyan-electric">{r.title}</Link>
                {r.isNew && <span className="ml-2 rounded-full bg-cyan-electric px-2 py-0.5 text-[10px] font-bold text-space">BAHARU</span>}
                {r.note && <span className="ml-2 text-[11px] text-ink-muted">({r.note})</span>}
              </td>
              <td className="pr-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-cyan-electric" style={{ width: `${(r.d30 / max) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right font-semibold tabular-nums">{r.d30}</span>
                </div>
              </td>
              {hasTotal && <td className="text-right tabular-nums text-ink-muted">{r.total ?? "—"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListCard({ title, rows, empty, footer }: { title: string; rows: [string, number][]; empty: string; footer?: string }) {
  const max = Math.max(1, ...rows.map(([, v]) => v));
  return (
    <section className="glass p-5">
      <h2 className="mb-3 font-bold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map(([label, v]) => (
            <li key={label}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate">{label}</span>
                <span className="font-semibold tabular-nums">{v}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-cyan-electric" style={{ width: `${(v / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {footer && <p className="mt-3 text-xs text-ink-muted">{footer}</p>}
    </section>
  );
}

function changeText(p: number | null) {
  if (p === null) return "baharu minggu ini";
  if (p === 0) return "sama seperti minggu lepas";
  return `${p > 0 ? "▲" : "▼"} ${Math.abs(p)}% berbanding minggu lepas`;
}

function makeVerdict(s: ReturnType<typeof summarize>) {
  if (s.month.visitors === 0)
    return {
      title: "📭 Belum ada pelawat direkodkan",
      body: "Data mula dikumpul selepas kemas kini ini. Kongsi pautan atau QR kod Playverse kepada murid dan rakan untuk mula melihat sambutan.",
      tone: "",
    };
  const ch = s.week.visitorsChange;
  const trend =
    ch === null ? "Minggu ini adalah minggu pertama ada pelawat."
    : ch >= 20 ? `Pelawat meningkat ${ch}% berbanding minggu lepas.`
    : ch <= -20 ? `Pelawat menurun ${Math.abs(ch)}% berbanding minggu lepas.`
    : "Bilangan pelawat stabil berbanding minggu lepas.";
  const engagement =
    s.month.playsPerVisitor >= 2 ? "Pelawat aktif bermain (purata ≥ 2 sesi seorang)."
    : s.month.playsPerVisitor >= 1 ? "Kebanyakan pelawat mencuba sekurang-kurangnya satu permainan."
    : "Ramai pelawat melihat-lihat tetapi belum bermain — cuba tonjolkan permainan Featured.";
  const good = (ch ?? 100) > -20 && s.month.playsPerVisitor >= 1;
  return {
    title: good ? "📈 Sambutan positif" : "💡 Ruang untuk tingkatkan sambutan",
    body: `${s.month.visitors} pelawat dalam 30 hari, aktif ${s.month.activeDays} hari. ${trend} ${engagement}`,
    tone: good ? "border-emerald-400/40" : "border-gold/40",
  };
}
