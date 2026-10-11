import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";
import type { Db } from "@/lib/db/types";
import { SEED_CATEGORIES, SEED_GAMES } from "@/lib/data/seed";
import {
  DEFAULT_PROFILE,
  type Category,
  type CategoryRef,
  type CreatorProfile,
  type Game,
  type GameStatus,
  type PublicGame,
} from "@/lib/types";

/**
 * Lapisan data DZURRI PLAYVERSE (Firestore di production).
 * Koleksi: categories, games, reports, activity, settings, media, loginAttempts, meta.
 * Semua pertanyaan menggunakan bacaan koleksi penuh atau penapis medan tunggal —
 * tiada indeks komposit diperlukan, jadi tiada konfigurasi Firestore tambahan.
 */

export type DataError = "not_configured" | "unavailable";
export type DataResult<T> = { ok: true; data: T } | { ok: false; error: DataError };

const now = () => new Date().toISOString();

/**
 * Tag cache data awam. Bacaan dicache merentas permintaan (jimat kuota bacaan Firestore
 * pelan percuma) dan dibatalkan serta-merta oleh updateTag(DATA_TAG) dalam Server Actions admin.
 */
export const DATA_TAG = "dz-data";
const CACHE_SECONDS = 600;

function db(): Db {
  const d = getDb();
  if (!d) throw new NotConfiguredError();
  return d;
}

export class NotConfiguredError extends Error {
  constructor() {
    super("NOT_CONFIGURED");
  }
}

async function safe<T>(fn: () => Promise<T>, label: string): Promise<DataResult<T>> {
  if (!getDb()) return { ok: false, error: "not_configured" };
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    console.error(`[data] ${label}`, e instanceof Error ? e.message : e);
    return { ok: false, error: "unavailable" };
  }
}

// ------------------------------------------------------------------ seed
let seedPromise: Promise<void> | null = null;
export function ensureSeeded(): Promise<void> {
  seedPromise ??= (async () => {
    const d = db();
    if (await d.get("meta", "seed")) return;
    // ID tetap (slug) → selamat walaupun dua instance serverless menjalankan seed serentak
    if ((await d.list("categories")).length === 0) {
      for (const c of SEED_CATEGORIES) await d.set("categories", c.slug, { ...c, created_at: now(), updated_at: now() });
    }
    if ((await d.list("games")).length === 0) {
      const cats = await d.list<{ slug: string }>("categories");
      const bySlug = new Map(cats.map((c) => [c.data.slug, c.id]));
      for (const g of SEED_GAMES) {
        const { category, ...rest } = g;
        await d.set("games", g.slug, {
          ...rest,
          tags: [...rest.tags],
          category_id: bySlug.get(category) ?? null,
          launch_mode: "embedded",
          status: "published",
          play_count: 0,
          published_at: now(),
          created_at: now(),
          updated_at: now(),
        });
      }
    }
    await d.set("meta", "seed", { done: true, at: now() });
  })().catch((e) => {
    seedPromise = null;
    throw e;
  });
  return seedPromise;
}

// ------------------------------------------------------------------ reads (cached per request)
const loadCategoriesRaw = async (): Promise<Category[]> => {
  await ensureSeeded();
  const rows = await db().list<Omit<Category, "id">>("categories");
  return rows
    .map((r) => ({ ...normalizeCategory(r.data), id: r.id }))
    .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));
};
const loadCategories = cache(
  unstable_cache(loadCategoriesRaw, ["dz-categories"], { tags: [DATA_TAG], revalidate: CACHE_SECONDS }),
);

const loadGamesRaw = async (): Promise<Game[]> => {
  await ensureSeeded();
  const [rows, cats] = await Promise.all([db().list<Omit<Game, "id">>("games"), loadCategories()]);
  const catMap = new Map<string, CategoryRef>(cats.map((c) => [c.id, { id: c.id, name: c.name, slug: c.slug, icon: c.icon }]));
  return rows.map((r) => {
    const g = normalizeGame(r.data);
    return { ...g, id: r.id, category: g.category_id ? (catMap.get(g.category_id) ?? null) : null };
  });
};
const loadGames = cache(unstable_cache(loadGamesRaw, ["dz-games"], { tags: [DATA_TAG], revalidate: CACHE_SECONDS }));

function normalizeCategory(d: Partial<Category>): Omit<Category, "id"> {
  return {
    name: String(d.name ?? ""),
    slug: String(d.slug ?? ""),
    description: d.description ?? null,
    icon: d.icon ?? null,
    image_url: d.image_url ?? null,
    display_order: Number(d.display_order ?? 0),
    created_at: String(d.created_at ?? ""),
    updated_at: String(d.updated_at ?? ""),
  };
}

function normalizeGame(d: Partial<Game>): Omit<Game, "id" | "category"> {
  return {
    title: String(d.title ?? ""),
    slug: String(d.slug ?? ""),
    description: String(d.description ?? ""),
    full_description: String(d.full_description ?? ""),
    game_url: String(d.game_url ?? ""),
    thumbnail_url: d.thumbnail_url ?? null,
    category_id: d.category_id ?? null,
    tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
    difficulty: d.difficulty ?? null,
    target_age: d.target_age ?? null,
    launch_mode: d.launch_mode === "external" ? "external" : "embedded",
    is_featured: Boolean(d.is_featured),
    status: (["draft", "published", "unpublished"] as const).includes(d.status as GameStatus) ? (d.status as GameStatus) : "draft",
    display_order: Number(d.display_order ?? 0),
    play_count: Number(d.play_count ?? 0),
    published_at: d.published_at ?? null,
    created_at: String(d.created_at ?? ""),
    updated_at: String(d.updated_at ?? ""),
  };
}

function toPublic(g: Game): PublicGame {
  return {
    id: g.id,
    title: g.title,
    slug: g.slug,
    description: g.description,
    full_description: g.full_description,
    game_url: g.game_url,
    thumbnail_url: g.thumbnail_url,
    category_id: g.category_id,
    tags: g.tags,
    difficulty: g.difficulty,
    target_age: g.target_age,
    launch_mode: g.launch_mode,
    is_featured: g.is_featured,
    published_at: g.published_at,
    created_at: g.created_at,
    category: g.category ?? null,
  };
}

// ------------------------------------------------------------------ public API
export function sanitizeSearch(q: string): string {
  return q
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

export const getCategories = () => safe(loadCategories, "getCategories");

export type GameQuery = {
  q?: string;
  categoryId?: string | null;
  tag?: string;
  featured?: boolean;
  sort?: "order" | "popular" | "recent" | "title";
  limit?: number;
  offset?: number;
};

export function filterGames(all: Game[], query: GameQuery): Game[] {
  let list = all.filter((g) => g.status === "published");
  if (query.categoryId) list = list.filter((g) => g.category_id === query.categoryId);
  if (query.featured) list = list.filter((g) => g.is_featured);
  if (query.tag) {
    const tag = sanitizeSearch(query.tag).toLowerCase();
    if (tag) list = list.filter((g) => g.tags.includes(tag));
  }
  if (query.q) {
    const q = sanitizeSearch(query.q).toLowerCase();
    if (q)
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.tags.some((t) => t.includes(q)) ||
          (g.category?.name.toLowerCase().includes(q) ?? false),
      );
  }
  const byOrder = (a: Game, b: Game) => a.display_order - b.display_order || a.title.localeCompare(b.title);
  switch (query.sort) {
    case "popular":
      list.sort((a, b) => b.play_count - a.play_count || byOrder(a, b));
      break;
    case "recent":
      list.sort((a, b) => String(b.published_at ?? b.created_at).localeCompare(String(a.published_at ?? a.created_at)));
      break;
    case "title":
      list.sort((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      list.sort(byOrder);
  }
  return list;
}

export function getPublishedGames(query: GameQuery = {}): Promise<DataResult<{ games: PublicGame[]; total: number }>> {
  return safe(async () => {
    const list = filterGames(await loadGames(), query);
    const limit = Math.min(Math.max(query.limit ?? 24, 1), 60);
    const offset = Math.max(query.offset ?? 0, 0);
    return { games: list.slice(offset, offset + limit).map(toPublic), total: list.length };
  }, "getPublishedGames");
}

export function getPublishedGameBySlug(slug: string): Promise<DataResult<PublicGame | null>> {
  return safe(async () => {
    if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
    const g = (await loadGames()).find((x) => x.slug === slug && x.status === "published");
    return g ? toPublic(g) : null;
  }, "getPublishedGameBySlug");
}

export function getPublishedGamesByIds(ids: string[]): Promise<DataResult<PublicGame[]>> {
  return safe(async () => {
    const set = new Set(ids.slice(0, 60));
    return (await loadGames()).filter((g) => set.has(g.id) && g.status === "published").map(toPublic);
  }, "getPublishedGamesByIds");
}

export async function getPublishedGameUrl(id: string): Promise<string | null> {
  const g = (await loadGames()).find((x) => x.id === id);
  return g && g.status === "published" ? g.game_url : null;
}

export async function incrementPlay(id: string): Promise<void> {
  const g = (await loadGames()).find((x) => x.id === id && x.status === "published");
  if (g) await db().increment("games", id, "play_count", 1);
}

export async function addReport(gameId: string, reason: string, message: string | null): Promise<boolean> {
  const g = (await loadGames()).find((x) => x.id === gameId && x.status === "published");
  if (!g) return false;
  await db().create("reports", { game_id: gameId, reason, message, status: "open", created_at: now() });
  return true;
}

const loadProfile = unstable_cache(
  async () => ({ ...DEFAULT_PROFILE, ...((await db().get<Partial<CreatorProfile>>("settings", "creator")) ?? {}) }),
  ["dz-profile"],
  { tags: [DATA_TAG], revalidate: CACHE_SECONDS },
);
export const getCreatorProfile = cache(async (): Promise<CreatorProfile> => {
  if (!getDb()) return DEFAULT_PROFILE;
  try {
    return await loadProfile();
  } catch (e) {
    console.error("[data] getCreatorProfile", e instanceof Error ? e.message : e);
    return DEFAULT_PROFILE;
  }
});

// ------------------------------------------------------------------ admin reads
export async function getDashboardStats() {
  const [games, cats, reports] = await Promise.all([loadGames(), loadCategories(), db().where("reports", "status", "open")]);
  return {
    total: games.length,
    published: games.filter((g) => g.status === "published").length,
    draft: games.filter((g) => g.status === "draft").length,
    unpublished: games.filter((g) => g.status === "unpublished").length,
    categories: cats.length,
    openReports: reports.length,
  };
}

export async function getRecentlyUpdatedGames(limit = 5) {
  return [...(await loadGames())].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, limit);
}

export type ActivityRow = { id: string; action: string; entity_type: string; entity_id: string | null; summary: string | null; created_at: string };
export async function getActivity(limit = 15): Promise<ActivityRow[]> {
  const rows = await db().latest<Omit<ActivityRow, "id">>("activity", "created_at", limit);
  return rows.map((r) => ({ ...r.data, id: r.id }));
}

export const ADMIN_PAGE_SIZE = 20;
export async function listAdminGames(opts: { q?: string; categoryId?: string; status?: string; page?: number }) {
  let list = await loadGames();
  if (opts.status && ["draft", "published", "unpublished"].includes(opts.status)) list = list.filter((g) => g.status === opts.status);
  if (opts.categoryId === "none") list = list.filter((g) => !g.category_id);
  else if (opts.categoryId) list = list.filter((g) => g.category_id === opts.categoryId);
  const q = sanitizeSearch(opts.q ?? "").toLowerCase();
  if (q) list = list.filter((g) => g.title.toLowerCase().includes(q) || g.slug.includes(q));
  list = [...list].sort((a, b) => a.display_order - b.display_order || b.updated_at.localeCompare(a.updated_at));
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  return { games: list.slice(from, from + ADMIN_PAGE_SIZE), total: list.length, page };
}

export async function getAdminGame(id: string): Promise<Game | null> {
  return (await loadGames()).find((g) => g.id === id) ?? null;
}

export async function listAdminCategories() {
  const [cats, games] = await Promise.all([loadCategories(), loadGames()]);
  return cats.map((c) => ({ ...c, game_count: games.filter((g) => g.category_id === c.id).length }));
}

export type ReportRow = {
  id: string;
  reason: string;
  message: string | null;
  status: "open" | "resolved";
  created_at: string;
  game: { id: string; title: string; slug: string; game_url: string } | null;
};
export async function listReports(status: "open" | "resolved" | "all" = "open"): Promise<ReportRow[]> {
  const [rows, games] = await Promise.all([
    status === "all" ? db().list<Omit<ReportRow, "id" | "game"> & { game_id: string }>("reports") : db().where<Omit<ReportRow, "id" | "game"> & { game_id: string }>("reports", "status", status),
    loadGames(),
  ]);
  const gm = new Map(games.map((g) => [g.id, g]));
  return rows
    .map((r) => {
      const g = gm.get(r.data.game_id);
      return {
        id: r.id,
        reason: r.data.reason,
        message: r.data.message ?? null,
        status: r.data.status,
        created_at: r.data.created_at,
        game: g ? { id: g.id, title: g.title, slug: g.slug, game_url: g.game_url } : null,
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 100);
}

// ------------------------------------------------------------------ admin writes
export async function logActivity(action: string, entity_type: "game" | "category" | "profile", entity_id: string | null, summary: string | null) {
  await db().create("activity", { action, entity_type, entity_id, summary: summary?.slice(0, 200) ?? null, created_at: now() });
}

export async function slugTaken(slug: string, excludeId?: string): Promise<boolean> {
  return (await db().list<{ slug: string }>("games")).some((r) => r.data.slug === slug && r.id !== excludeId);
}

export async function uniqueGameSlug(base: string, excludeId?: string): Promise<string> {
  const taken = new Set((await db().list<{ slug: string }>("games")).filter((r) => r.id !== excludeId).map((r) => r.data.slug));
  const root = base || "game";
  if (!taken.has(root)) return root;
  for (let i = 2; i < 500; i++) {
    const c = `${root.slice(0, 74)}-${i}`;
    if (!taken.has(c)) return c;
  }
  return `${root.slice(0, 60)}-${Date.now().toString(36)}`;
}

type GameWrite = Omit<Game, "id" | "category" | "play_count" | "published_at" | "created_at" | "updated_at">;

export async function createGame(input: GameWrite): Promise<string> {
  const id = await db().create("games", {
    ...input,
    play_count: 0,
    published_at: input.status === "published" ? now() : null,
    created_at: now(),
    updated_at: now(),
  });
  await logActivity(input.status === "published" ? "publish" : "create", "game", id, input.title);
  return id;
}

export async function updateGame(id: string, input: Partial<GameWrite>): Promise<boolean> {
  const d = db();
  const before = await d.get<Game>("games", id);
  if (!before) return false;
  const patch: Record<string, unknown> = { ...input, updated_at: now() };
  if (input.status === "published" && before.status !== "published") patch.published_at = now();
  await d.update("games", id, patch);
  const action =
    input.status && input.status !== before.status
      ? input.status === "published"
        ? "publish"
        : input.status === "unpublished"
          ? "unpublish"
          : "move_to_draft"
      : "update";
  await logActivity(action, "game", id, input.title ?? before.title);
  return true;
}

export async function deleteGame(id: string): Promise<boolean> {
  const d = db();
  const before = await d.get<Game>("games", id);
  if (!before || !(await d.delete("games", id))) return false;
  for (const r of await d.where("reports", "game_id", id)) await d.delete("reports", r.id);
  await logActivity("delete", "game", id, before.title);
  return true;
}

type CategoryWrite = Omit<Category, "id" | "created_at" | "updated_at">;

export async function categorySlugTaken(slug: string, excludeId?: string) {
  return (await db().list<{ slug: string }>("categories")).some((r) => r.data.slug === slug && r.id !== excludeId);
}

export async function saveCategory(id: string | null, input: CategoryWrite): Promise<string | null> {
  const d = db();
  if (id) {
    if (!(await d.update("categories", id, { ...input, updated_at: now() }))) return null;
    await logActivity("update", "category", id, input.name);
    return id;
  }
  const newId = await d.create("categories", { ...input, created_at: now(), updated_at: now() });
  await logActivity("create", "category", newId, input.name);
  return newId;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const d = db();
  const before = await d.get<Category>("categories", id);
  if (!before || !(await d.delete("categories", id))) return false;
  for (const g of await d.where("games", "category_id", id)) await d.update("games", g.id, { category_id: null, updated_at: now() });
  await logActivity("delete", "category", id, before.name);
  return true;
}

export async function updateReport(id: string, op: "resolve" | "reopen" | "delete"): Promise<boolean> {
  if (op === "delete") return db().delete("reports", id);
  return db().update("reports", id, { status: op === "resolve" ? "resolved" : "open" });
}

export async function saveCreatorProfile(patch: Partial<CreatorProfile>) {
  await db().set("settings", "creator", { ...patch, updated_at: now() }, { merge: true });
  await logActivity("update", "profile", "creator", "Creator profile");
}

// ------------------------------------------------------------------ media (imej disimpan dalam Firestore, ≤ ~900 KB)
export async function saveMedia(bytes: Buffer, mime: string): Promise<string> {
  return db().create("media", { data: bytes, mime, size: bytes.length, created_at: now() });
}

export async function getMedia(id: string): Promise<{ data: Buffer; mime: string } | null> {
  const m = await db().get<{ data: Buffer | Uint8Array; mime: string }>("media", id);
  if (!m) return null;
  return { data: Buffer.from(m.data), mime: m.mime };
}

// ------------------------------------------------------------------ login rate limiting (dalam DB — serverless tiada memori kongsi)
export async function countRecentAttempts(key: string, sinceMs: number): Promise<number> {
  const rows = await db().where<{ at: number }>("loginAttempts", "key", key);
  return rows.filter((r) => r.data.at >= sinceMs).length;
}

export async function recordAttempt(key: string) {
  await db().create("loginAttempts", { key, at: Date.now() });
}

export async function clearAttempts(key: string) {
  const d = db();
  for (const r of await d.where("loginAttempts", "key", key)) await d.delete("loginAttempts", r.id);
}
