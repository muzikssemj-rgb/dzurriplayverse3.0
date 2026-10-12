import type { Metadata } from "next";
import Link from "next/link";
import { getActivity, getDashboardStats, getRecentlyUpdatedGames } from "@/lib/data/store";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ACTION_LABEL, formatDateTime } from "@/lib/format";
import { getDailyStats, summarize } from "@/lib/data/analytics";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [stats, recent, activity, daily] = await Promise.all([getDashboardStats(), getRecentlyUpdatedGames(6), getActivity(12), getDailyStats(14)]);
  const a = summarize(daily);
  const cards = [
    { label: "Pelawat hari ini", value: a.today.visitors, href: "/admin/analytics", tone: "text-gold" },
    { label: "Pelawat 7 hari", value: a.week.visitors, href: "/admin/analytics", tone: "text-gold" },
    { label: "Total games", value: stats.total, href: "/admin/games", tone: "text-cyan-electric" },
    { label: "Published", value: stats.published, href: "/admin/games?status=published", tone: "text-emerald-300" },
    { label: "Drafts", value: stats.draft, href: "/admin/games?status=draft", tone: "text-amber-200" },
    { label: "Unpublished", value: stats.unpublished, href: "/admin/games?status=unpublished", tone: "text-slate-300" },
    { label: "Categories", value: stats.categories, href: "/admin/categories", tone: "text-violet-300" },
    { label: "Open reports", value: stats.openReports, href: "/admin/reports", tone: stats.openReports ? "text-red-300" : "text-white/70" },
  ];
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-wide">Dashboard</h1>
          <p className="text-sm text-ink-muted">Live numbers from the database.</p>
        </div>
        <Link href="/admin/games/new" className="btn-primary">＋ Add New Game</Link>
      </header>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <li key={c.label}>
            <Link href={c.href} className="glass block p-4 hover:border-cyan-electric/40">
              <p className={`font-display text-3xl font-black ${c.tone}`}>{c.value}</p>
              <p className="mt-1 text-sm text-ink-muted">{c.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass p-5" aria-labelledby="recent-updated">
          <h2 id="recent-updated" className="mb-3 font-bold">Recently updated games</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-ink-muted">No games yet. <Link href="/admin/games/new" className="text-cyan-electric underline">Add your first game</Link>.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {recent.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/admin/games/${g.id}/edit`} className="min-w-0 truncate font-medium hover:text-cyan-electric">{g.title}</Link>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-ink-muted">
                    <StatusBadge status={g.status} />
                    <span className="hidden sm:inline">{formatDateTime(g.updated_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass p-5" aria-labelledby="activity">
          <h2 id="activity" className="mb-3 font-bold">Admin activity log</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-ink-muted">No activity recorded yet.</p>
          ) : (
            <ol className="space-y-2.5 text-sm">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-cyan-electric" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate">
                      <span className="text-white/70">{a.entity_type === "game" ? "Game" : a.entity_type === "category" ? "Category" : "Profile"}</span>{" "}
                      <strong>{a.summary ?? "—"}</strong> {ACTION_LABEL[a.action] ?? a.action}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {formatDateTime(a.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
