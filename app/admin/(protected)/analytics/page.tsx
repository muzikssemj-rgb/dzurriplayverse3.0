import type { Metadata } from "next";
import { getDailyStats, summarize } from "@/lib/data/analytics";
import { getGameTitles } from "@/lib/data/store";
import { BarChart } from "@/components/admin/BarChart";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const PAGE_LABEL: Record<string, string> = {
  home: "Halaman utama", games: "Senarai permainan", game: "Halaman permainan", favorites: "Kegemaran",
  me: "My Playverse", about: "About", creator: "Creator", install: "Install App", other: "Lain-lain",
};
const DEVICE_LABEL: Record<string, string> = { mobile: "📱 Telefon", tablet: "📲 Tablet", desktop: "💻 Komputer" };

function fmtDay(iso: string, withWeekday = false) {
  const d = new Date(`${iso}T00:00:00+08:00`);
  return new Intl.DateTimeFormat("ms-MY", { day: "numeric", month: "short", ...(withWeekday ? { weekday: "short" } : {}), timeZone: "Asia/Kuala_Lumpur" }).format(d);
}

export default async function AnalyticsPage() {
  const [rows, gameName] = await Promise.all([getDailyStats(60), getGameTitles()]);
  const s = summarize(rows);
  const verdict = makeVerdict(s);

  const kpis = [
    { label: "Pelawat hari ini", value: s.today.visitors, sub: `${s.today.views} paparan · ${s.today.plays} main` },
    { label: "Pelawat 7 hari", value: s.week.visitors, sub: changeText(s.week.visitorsChange) },
    { label: "Pelawat 30 hari", value: s.month.visitors, sub: `${s.month.activeDays}/30 hari ada pelawat` },
    { label: "Sesi main 7 hari", value: s.week.plays, sub: changeText(s.week.playsChange) },
    { label: "Main / pelawat (30 hari)", value: s.month.playsPerVisitor, sub: "purata sesi main seorang" },
    {
      label: "Guna sebagai App (PWA)",
      value: s.month.visitors ? `${Math.round((s.month.appVisitors / s.month.visitors) * 100)}%` : "—",
      sub: `${s.month.appVisitors} pelawat 30 hari`,
    },
  ];

  const topGames = Object.entries(s.games).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const pages = Object.entries(s.pages).sort((a, b) => b[1] - a[1]);
  const devices = Object.entries(s.devices).sort((a, b) => b[1] - a[1]);
  const deviceTotal = devices.reduce((a, [, v]) => a + v, 0);
  const returningPct = s.month.newVisitors + s.month.returningVisitors
    ? Math.round((s.month.returningVisitors / (s.month.newVisitors + s.month.returningVisitors)) * 100)
    : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-black tracking-wide">Analitik Pengguna</h1>
        <p className="text-sm text-ink-muted">
          Data tanpa nama (tiada nama, e-mel atau IP disimpan). Lawatan anda sendiri semasa log masuk tidak dikira. Waktu Malaysia.
        </p>
      </header>

      <section className={`glass p-5 ${verdict.tone}`} aria-labelledby="verdict">
        <h2 id="verdict" className="text-lg font-bold">{verdict.title}</h2>
        <p className="mt-1 text-sm text-white/85">{verdict.body}</p>
      </section>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
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

      <div className="grid gap-6 lg:grid-cols-3">
        <ListCard title="🎮 Permainan paling dimain · 30 hari" empty="Belum ada sesi main." rows={topGames.map(([id, v]) => [gameName.get(id) ?? "(permainan dipadam)", v])} />
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
              <tr><th className="py-1.5">Tarikh</th><th>Pelawat</th><th>Paparan</th><th>Sesi main</th></tr>
            </thead>
            <tbody>
              {[...s.daily].reverse().map((d) => (
                <tr key={d.date} className="border-t border-white/5">
                  <td className="py-1.5">{fmtDay(d.date, true)}</td><td>{d.visitors}</td><td>{d.views}</td><td>{d.plays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
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
