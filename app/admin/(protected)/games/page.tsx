import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_PAGE_SIZE, listAdminCategories, listAdminGames } from "@/lib/data/store";
import { deleteGameAction, duplicateGameAction, setGameStatusAction } from "@/lib/actions/games";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Flash } from "@/components/admin/Flash";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { GameThumb } from "@/components/games/GameThumb";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Games" };

export default async function AdminGamesPage(props: PageProps<"/admin/games">) {
  const sp = await props.searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = one(sp.q).slice(0, 60);
  const status = one(sp.status);
  const category = one(sp.category);
  const page = Math.max(1, parseInt(one(sp.page) || "1", 10) || 1);
  const [{ games, total }, categories] = await Promise.all([
    listAdminGames({ q, status, categoryId: category, page }),
    listAdminCategories(),
  ]);
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    Object.entries({ q, status, category, ...over }).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return `/admin/games${s ? `?${s}` : ""}`;
  };
  const back = qs({ page: page > 1 ? String(page) : "" });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-wide">Games</h1>
          <p className="text-sm text-ink-muted">{total} game{total === 1 ? "" : "s"}</p>
        </div>
        <Link href="/admin/games/new" className="btn-primary">＋ Add New Game</Link>
      </header>

      <Flash msg={one(sp.msg)} />

      <form method="get" className="glass grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <label className="sr-only" htmlFor="aq">Search</label>
        <input id="aq" name="q" defaultValue={q} placeholder="Search title or slug…" className="input" maxLength={60} />
        <label className="sr-only" htmlFor="acat">Category</label>
        <select id="acat" name="category" defaultValue={category} className="input">
          <option value="">All categories</option>
          <option value="none">— Uncategorized —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="astatus">Status</label>
        <select id="astatus" name="status" defaultValue={status} className="input">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="unpublished">Unpublished</option>
        </select>
        <button className="btn-cyan">Filter</button>
      </form>

      {games.length === 0 ? (
        <div className="glass p-8 text-center text-ink-muted">
          No games match. <Link href="/admin/games/new" className="text-cyan-electric underline">Add a new game</Link>.
        </div>
      ) : (
        <ul className="space-y-3">
          {games.map((g) => (
            <li key={g.id} className="glass flex flex-col gap-3 p-3 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <GameThumb src={g.thumbnail_url} alt="" icon={g.category?.icon} className="h-14 w-20 shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/games/${g.id}/edit`} className="truncate font-semibold hover:text-cyan-electric">{g.title}</Link>
                    <StatusBadge status={g.status} />
                    {g.is_featured && <span className="text-xs text-gold">★ Featured</span>}
                  </p>
                  <p className="truncate text-xs text-ink-muted">
                    {g.category?.name ?? "Uncategorized"} · {g.launch_mode} · order {g.display_order} · updated {formatDateTime(g.updated_at)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Link href={`/admin/games/${g.id}/edit`} className="btn-ghost !min-h-9 !px-3">Edit</Link>
                <Link href={`/admin/games/${g.id}/preview`} className="btn-ghost !min-h-9 !px-3">Preview</Link>
                {g.status !== "published" ? (
                  <form action={setGameStatusAction}>
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="status" value="published" />
                    <input type="hidden" name="back" value={back} />
                    <button className="btn-ghost !min-h-9 !px-3 text-emerald-300">Publish</button>
                  </form>
                ) : (
                  <form action={setGameStatusAction}>
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="status" value="unpublished" />
                    <input type="hidden" name="back" value={back} />
                    <button className="btn-ghost !min-h-9 !px-3">Unpublish</button>
                  </form>
                )}
                <form action={duplicateGameAction}>
                  <input type="hidden" name="id" value={g.id} />
                  <button className="btn-ghost !min-h-9 !px-3">Duplicate</button>
                </form>
                <ConfirmSubmit
                  action={deleteGameAction}
                  fields={{ id: g.id, confirm: "DELETE" }}
                  label="Delete"
                  title={`Delete “${g.title}”?`}
                  message="This permanently removes the game and its broken-link reports. This cannot be undone."
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
          {page > 1 ? <Link className="btn-ghost" href={qs({ page: String(page - 1) })}>‹ Previous</Link> : <span />}
          <span className="text-sm text-ink-muted">Page {page} / {pages}</span>
          {page < pages ? <Link className="btn-ghost" href={qs({ page: String(page + 1) })}>Next ›</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
