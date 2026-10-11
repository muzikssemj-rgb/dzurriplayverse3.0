import type { Metadata } from "next";
import Link from "next/link";
import { CategoryChips } from "@/components/games/CategoryChips";
import { GameGrid } from "@/components/games/GameCard";
import { DataNotice } from "@/components/ui/DataNotice";
import { getCategories, getPublishedGames } from "@/lib/data/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Explore Games" };

const PAGE_SIZE = 24;
const SORTS = { order: "Recommended order", popular: "Popular", recent: "Recently added", title: "A–Z" } as const;

export default async function GamesPage(props: PageProps<"/games">) {
  const sp = await props.searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = one(sp.q).slice(0, 60);
  const categorySlug = one(sp.category);
  const tag = one(sp.tag).slice(0, 30);
  const featured = one(sp.featured) === "1";
  const sortKey = (Object.keys(SORTS).includes(one(sp.sort)) ? one(sp.sort) : "order") as keyof typeof SORTS;
  const page = Math.max(1, Math.min(500, parseInt(one(sp.page) || "1", 10) || 1));

  const cats = await getCategories();
  if (!cats.ok) return <DataNotice error={cats.error} />;
  const category = cats.data.find((c) => c.slug === categorySlug) ?? null;

  const result = await getPublishedGames({
    q,
    tag,
    featured,
    categoryId: category?.id ?? null,
    sort: sortKey,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const heading = featured ? "Featured Games" : category ? category.name : "All Games";
  const pages = result.ok ? Math.max(1, Math.ceil(result.data.total / PAGE_SIZE)) : 1;
  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    const base = { q, category: category?.slug ?? "", tag, featured: featured ? "1" : "", sort: sortKey === "order" ? "" : sortKey, ...over };
    Object.entries(base).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `/games?${s}` : "/games";
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-black tracking-wide sm:text-3xl">
          {category?.icon && <span aria-hidden="true">{category.icon} </span>}
          <span className="text-gradient">{heading}</span>
        </h1>
        {category?.description && <p className="text-ink-muted">{category.description}</p>}
      </header>

      <form method="get" action="/games" role="search" className="glass grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto]">
        <div>
          <label htmlFor="q" className="sr-only">Search by name or tag</label>
          <input id="q" name="q" defaultValue={q} maxLength={60} placeholder="Search by name or tag…" className="input" />
        </div>
        <div>
          <label htmlFor="category" className="sr-only">Category</label>
          <select id="category" name="category" defaultValue={category?.slug ?? ""} className="input">
            <option value="">All categories</option>
            {cats.data.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="sr-only">Sort</label>
          <select id="sort" name="sort" defaultValue={sortKey} className="input">
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        {tag && <input type="hidden" name="tag" value={tag} />}
        {featured && <input type="hidden" name="featured" value="1" />}
        <button className="btn-cyan" type="submit">Search</button>
      </form>

      <CategoryChips categories={cats.data} active={category?.slug ?? null} />

      {(q || tag || featured) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-muted">Filters:</span>
          {q && <Link className="chip !min-h-9" href={qs({ q: "", page: "" })}>“{q}” ✕</Link>}
          {tag && <Link className="chip !min-h-9" href={qs({ tag: "", page: "" })}>#{tag} ✕</Link>}
          {featured && <Link className="chip !min-h-9" href={qs({ featured: "", page: "" })}>Featured ✕</Link>}
        </div>
      )}

      {!result.ok ? (
        <DataNotice error={result.error} />
      ) : result.data.games.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-lg font-semibold">No games found.</p>
          <p className="mt-1 text-ink-muted">Try another keyword or category.</p>
          <Link href="/games" className="btn-ghost mt-4">Clear filters</Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-muted" aria-live="polite">
            {result.data.total} game{result.data.total === 1 ? "" : "s"}
          </p>
          <GameGrid games={result.data.games} eagerCount={4} />
          {pages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-2">
              {page > 1 ? <Link className="btn-ghost" href={qs({ page: String(page - 1) })}>‹ Previous</Link> : <span />}
              <span className="text-sm text-ink-muted">Page {page} / {pages}</span>
              {page < pages ? <Link className="btn-ghost" href={qs({ page: String(page + 1) })}>Next ›</Link> : <span />}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
