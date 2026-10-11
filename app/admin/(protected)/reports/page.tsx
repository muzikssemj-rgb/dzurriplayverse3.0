import type { Metadata } from "next";
import Link from "next/link";
import { listReports } from "@/lib/data/store";
import { updateReportAction } from "@/lib/actions/reports";
import { Flash } from "@/components/admin/Flash";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Broken Link Reports" };

const REASON: Record<string, string> = {
  not_loading: "Does not load",
  blocked_embed: "Blocked / refused to connect",
  wrong_content: "Wrong / inappropriate content",
  other: "Other",
};

export default async function ReportsPage(props: PageProps<"/admin/reports">) {
  const sp = await props.searchParams;
  const view = sp.view === "resolved" ? "resolved" : sp.view === "all" ? "all" : "open";
  const reports = await listReports(view);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-wide">Broken Link Reports</h1>
          <p className="text-sm text-ink-muted">Sent by players from the game launcher.</p>
        </div>
        <nav className="flex gap-2" aria-label="Report filter">
          {(["open", "resolved", "all"] as const).map((k) => (
            <Link key={k} href={`/admin/reports?view=${k}`} className={`chip !min-h-9 capitalize ${view === k ? "chip-active" : ""}`} aria-current={view === k ? "page" : undefined}>
              {k}
            </Link>
          ))}
        </nav>
      </header>
      <Flash msg={typeof sp.msg === "string" ? sp.msg : undefined} />
      {reports.length === 0 ? (
        <p className="glass p-8 text-center text-ink-muted">No {view === "all" ? "" : view} reports. 🎉</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="glass flex flex-col gap-3 p-4 md:flex-row md:items-center">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-semibold">
                  {r.game ? <Link href={`/admin/games/${r.game.id}/edit`} className="hover:text-cyan-electric">{r.game.title}</Link> : "Deleted game"}
                  <span className="ml-2 text-xs font-normal text-ink-muted">{formatDateTime(r.created_at)}</span>
                </p>
                <p className="text-sm text-amber-200">{REASON[r.reason] ?? r.reason}</p>
                {r.message && <p className="whitespace-pre-line text-sm text-white/80">“{r.message}”</p>}
                {r.game && <p className="truncate font-mono text-xs text-ink-muted">{r.game.game_url}</p>}
              </div>
              <div className="flex gap-2">
                <form action={updateReportAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="op" value={r.status === "open" ? "resolve" : "reopen"} />
                  <button className="btn-ghost !min-h-9 !px-3">{r.status === "open" ? "✓ Mark resolved" : "Reopen"}</button>
                </form>
                <form action={updateReportAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="op" value="delete" />
                  <button className="btn-ghost !min-h-9 !px-3 text-red-300">Delete</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
