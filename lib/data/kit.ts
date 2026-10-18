import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";
import type { Db } from "@/lib/db/types";
import { DATA_TAG, NotConfiguredError, logActivity, type DataResult } from "@/lib/data/store";
import { buildSubjectTree, flattenTree, type ContentStatus, type Subject, type SubjectNode, type Video } from "@/lib/kit";

/**
 * Kit Pembelajaran Muzik. Koleksi Firestore: subjects, videos.
 * Bacaan dicache (tag DATA_TAG) dan dibatalkan serta-merta apabila admin menyimpan.
 */
const CACHE_SECONDS = 600;
const now = () => new Date().toISOString();

function db(): Db {
  const d = getDb();
  if (!d) throw new NotConfiguredError();
  return d;
}

async function safe<T>(fn: () => Promise<T>, label: string): Promise<DataResult<T>> {
  if (!getDb()) return { ok: false, error: "not_configured" };
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    console.error(`[kit] ${label}`, e instanceof Error ? e.message : e);
    return { ok: false, error: "unavailable" };
  }
}

// ------------------------------------------------------------------ seed (struktur subjek permulaan; TIADA video rekaan)
export const SEED_SUBJECTS: { slug: string; name: string; icon: string; description: string; parent: string | null; order: number }[] = [
  { slug: "alat-muzik-utama", name: "Alat Muzik Utama", icon: "🎻", description: "Kenali dan pelajari alat muzik mengikut keluarga.", parent: null, order: 1 },
  { slug: "strings", name: "Strings", icon: "🎻", description: "Violin, viola, cello dan double bass.", parent: "alat-muzik-utama", order: 1 },
  { slug: "bass", name: "Bass", icon: "🎸", description: "Gitar bass dan teknik asas bass.", parent: "alat-muzik-utama", order: 2 },
  { slug: "woodwind", name: "Woodwind", icon: "🎷", description: "Rekoder, flut, klarinet dan saksofon.", parent: "alat-muzik-utama", order: 3 },
  { slug: "rhythm-section", name: "Rhythm Section", icon: "🥁", description: "Dram, perkusi, keyboard dan gitar.", parent: "alat-muzik-utama", order: 4 },
  { slug: "muzik-komputer", name: "Muzik Komputer", icon: "💻", description: "DAW, MIDI, rakaman dan gubahan digital.", parent: null, order: 2 },
  { slug: "aural-dan-teori", name: "Aural dan Teori", icon: "🎼", description: "Latihan pendengaran, notasi dan teori muzik.", parent: null, order: 3 },
];

let seedPromise: Promise<void> | null = null;
export function ensureKitSeeded(): Promise<void> {
  seedPromise ??= (async () => {
    const d = db();
    if (await d.get("meta", "seed-kit")) return;
    if ((await d.list("subjects")).length === 0) {
      for (const s of SEED_SUBJECTS) {
        await d.set("subjects", s.slug, {
          name: s.name,
          slug: s.slug,
          icon: s.icon,
          description: s.description,
          parent_id: s.parent,
          display_order: s.order,
          created_at: now(),
          updated_at: now(),
        });
      }
    }
    await d.set("meta", "seed-kit", { done: true, at: now() });
  })().catch((e) => {
    seedPromise = null;
    throw e;
  });
  return seedPromise;
}

// ------------------------------------------------------------------ reads
function normalizeSubject(id: string, d: Partial<Subject>): Subject {
  return {
    id,
    name: String(d.name ?? ""),
    slug: String(d.slug ?? id),
    description: d.description ?? null,
    icon: d.icon ?? null,
    parent_id: d.parent_id ?? null,
    display_order: Number(d.display_order ?? 0),
    created_at: String(d.created_at ?? ""),
    updated_at: String(d.updated_at ?? ""),
  };
}

function normalizeVideo(id: string, d: Partial<Video>): Video {
  return {
    id,
    title: String(d.title ?? ""),
    youtube_id: String(d.youtube_id ?? ""),
    start_seconds: Number(d.start_seconds ?? 0),
    description: String(d.description ?? ""),
    subject_id: d.subject_id ?? null,
    display_order: Number(d.display_order ?? 0),
    status: d.status === "draft" ? "draft" : "published",
    created_at: String(d.created_at ?? ""),
    updated_at: String(d.updated_at ?? ""),
  };
}

const loadSubjects = cache(
  unstable_cache(
    async (): Promise<Subject[]> => {
      await ensureKitSeeded();
      return (await db().list<Partial<Subject>>("subjects")).map((r) => normalizeSubject(r.id, r.data));
    },
    ["dz-subjects"],
    { tags: [DATA_TAG], revalidate: CACHE_SECONDS },
  ),
);

const loadVideos = cache(
  unstable_cache(
    async (): Promise<Video[]> => (await db().list<Partial<Video>>("videos")).map((r) => normalizeVideo(r.id, r.data)),
    ["dz-videos"],
    { tags: [DATA_TAG], revalidate: CACHE_SECONDS },
  ),
);

const byOrder = (a: Video, b: Video) => a.display_order - b.display_order || b.created_at.localeCompare(a.created_at);

export type KitData = { subjects: Subject[]; tree: SubjectNode[]; videos: Video[] };

/** Data awam: subjek + video published sahaja. */
export function getKit(): Promise<DataResult<KitData>> {
  return safe(async () => {
    const [subjects, videos] = await Promise.all([loadSubjects(), loadVideos()]);
    const pub = videos.filter((v) => v.status === "published").sort(byOrder);
    return { subjects, tree: buildSubjectTree(subjects, pub), videos: pub };
  }, "getKit");
}

export function getPublishedVideo(id: string): Promise<DataResult<Video | null>> {
  return safe(async () => {
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return null;
    return (await loadVideos()).find((v) => v.id === id && v.status === "published") ?? null;
  }, "getPublishedVideo");
}

// ------------------------------------------------------------------ admin
export async function getAdminKit() {
  const [subjects, videos] = await Promise.all([loadSubjects(), loadVideos()]);
  const tree = buildSubjectTree(subjects, videos, false);
  return { subjects, tree, flat: flattenTree(tree), videos: [...videos].sort(byOrder) };
}

export async function getAdminVideo(id: string): Promise<Video | null> {
  return (await loadVideos()).find((v) => v.id === id) ?? null;
}

export async function subjectSlugTaken(slug: string, excludeId?: string) {
  return (await db().list<{ slug: string }>("subjects")).some((r) => (r.data.slug ?? r.id) === slug && r.id !== excludeId);
}

type SubjectWrite = Omit<Subject, "id" | "created_at" | "updated_at">;

export async function saveSubject(id: string | null, input: SubjectWrite): Promise<string | null> {
  const d = db();
  if (id) {
    if (!(await d.update("subjects", id, { ...input, updated_at: now() }))) return null;
    await logActivity("update", "subject", id, input.name);
    return id;
  }
  const newId = await d.create("subjects", { ...input, created_at: now(), updated_at: now() });
  await logActivity("create", "subject", newId, input.name);
  return newId;
}

/** Padam subjek. Subjek anak & video dialihkan ke subjek induk (tiada data hilang). */
export async function deleteSubject(id: string): Promise<boolean> {
  const d = db();
  const before = await d.get<Subject>("subjects", id);
  if (!before || !(await d.delete("subjects", id))) return false;
  const parent = before.parent_id ?? null;
  for (const c of await d.where("subjects", "parent_id", id)) await d.update("subjects", c.id, { parent_id: parent, updated_at: now() });
  for (const v of await d.where("videos", "subject_id", id)) await d.update("videos", v.id, { subject_id: parent, updated_at: now() });
  for (const q of await d.where("quizzes", "subject_id", id)) await d.update("quizzes", q.id, { subject_id: parent, updated_at: now() });
  await logActivity("delete", "subject", id, before.name);
  return true;
}

type VideoWrite = Omit<Video, "id" | "created_at" | "updated_at">;

export async function saveVideo(id: string | null, input: VideoWrite): Promise<string | null> {
  const d = db();
  if (id) {
    if (!(await d.update("videos", id, { ...input, updated_at: now() }))) return null;
    await logActivity("update", "video", id, input.title);
    return id;
  }
  const newId = await d.create("videos", { ...input, created_at: now(), updated_at: now() });
  await logActivity(input.status === "published" ? "publish" : "create", "video", newId, input.title);
  return newId;
}

export async function setVideoStatus(id: string, status: ContentStatus): Promise<boolean> {
  const ok = await db().update("videos", id, { status, updated_at: now() });
  if (ok) await logActivity(status === "published" ? "publish" : "move_to_draft", "video", id, null);
  return ok;
}

export async function deleteVideo(id: string): Promise<boolean> {
  const d = db();
  const before = await d.get<Video>("videos", id);
  if (!before || !(await d.delete("videos", id))) return false;
  await logActivity("delete", "video", id, before.title);
  return true;
}

/** Tajuk video melalui oEmbed YouTube (tiada kunci API). `blocked` = pemilik video melarang benaman. */
export async function fetchYouTubeInfo(id: string): Promise<{ title: string | null; status: "ok" | "blocked" | "missing" | "unknown" }> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) return { title: null, status: "blocked" };
    if (res.status === 404 || res.status === 400) return { title: null, status: "missing" };
    if (!res.ok) return { title: null, status: "unknown" };
    const j = (await res.json()) as { title?: unknown };
    return { title: typeof j.title === "string" ? j.title.slice(0, 150) : null, status: "ok" };
  } catch {
    return { title: null, status: "unknown" };
  }
}
