/**
 * Kit Pembelajaran Muzik — jenis data & utiliti YouTube (dikongsi klien + server).
 */

export type ContentStatus = "published" | "draft";

export type Subject = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type Video = {
  id: string;
  title: string;
  youtube_id: string;
  start_seconds: number;
  description: string;
  subject_id: string | null;
  display_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
};

/** Subjek dengan anak & bilangan video (termasuk subjek di bawahnya). */
export type SubjectNode = Subject & { depth: number; children: SubjectNode[]; video_count: number };

export const MAX_SUBJECT_DEPTH = 3; // cth. Alat Muzik Utama › Strings › Violin
export const RESERVED_SUBJECT_SLUGS = new Set(["tonton", "semua", "baru"]);

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);

function parseStart(v: string | null): number {
  if (!v) return 0;
  if (/^\d+$/.test(v)) return Math.min(Number(v), 86_400);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(v);
  if (!m || !m[0]) return 0;
  return Math.min(Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0), 86_400);
}

/**
 * Terima pautan YouTube biasa (watch?v=, youtu.be/, shorts/, embed/, live/) atau ID 11 aksara.
 * Pulangkan null untuk pautan lain — tiada URL sewenang-wenang dibenamkan.
 */
export function parseYouTubeUrl(raw: string): { id: string; start: number } | null {
  const value = raw.trim();
  if (YT_ID.test(value)) return { id: value, start: 0 };
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase();
  if (!YT_HOSTS.has(host)) return null;
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.split("/")[1] ?? null;
  else if (u.pathname === "/watch") id = u.searchParams.get("v");
  else {
    const m = /^\/(?:shorts|embed|live|v)\/([^/?#]+)/.exec(u.pathname);
    id = m?.[1] ?? null;
  }
  if (!id || !YT_ID.test(id)) return null;
  return { id, start: parseStart(u.searchParams.get("t") ?? u.searchParams.get("start")) };
}

export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const ytWatch = (id: string, start = 0) => `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ""}`;
export function ytEmbed(id: string, start = 0) {
  const p = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
  if (start) p.set("start", String(start));
  return `https://www.youtube-nocookie.com/embed/${id}?${p}`;
}

/** Bina pokok subjek (disusun ikut display_order, kemudian nama). */
export function buildSubjectTree(subjects: Subject[], videos: Pick<Video, "subject_id" | "status">[] = [], publishedOnly = true): SubjectNode[] {
  const byParent = new Map<string | null, Subject[]>();
  const ids = new Set(subjects.map((s) => s.id));
  for (const s of subjects) {
    const p = s.parent_id && ids.has(s.parent_id) && s.parent_id !== s.id ? s.parent_id : null;
    byParent.set(p, [...(byParent.get(p) ?? []), s]);
  }
  const own = new Map<string, number>();
  for (const v of videos) {
    if (publishedOnly && v.status !== "published") continue;
    if (v.subject_id) own.set(v.subject_id, (own.get(v.subject_id) ?? 0) + 1);
  }
  const sort = (a: Subject, b: Subject) => a.display_order - b.display_order || a.name.localeCompare(b.name);
  const seen = new Set<string>();
  const build = (parent: string | null, depth: number): SubjectNode[] =>
    (byParent.get(parent) ?? [])
      .filter((s) => !seen.has(s.id) && (seen.add(s.id), true))
      .sort(sort)
      .map((s) => {
        const children = build(s.id, depth + 1);
        return { ...s, depth, children, video_count: (own.get(s.id) ?? 0) + children.reduce((n, c) => n + c.video_count, 0) };
      });
  return build(null, 0);
}

export function flattenTree(nodes: SubjectNode[]): SubjectNode[] {
  return nodes.flatMap((n) => [n, ...flattenTree(n.children)]);
}

/** ID subjek ini + semua subjek di bawahnya. */
export function descendantIds(node: SubjectNode): string[] {
  return [node.id, ...node.children.flatMap(descendantIds)];
}

/** Laluan dari akar ke subjek (untuk breadcrumb). */
export function subjectPath(subjects: Subject[], id: string | null): Subject[] {
  const map = new Map(subjects.map((s) => [s.id, s]));
  const out: Subject[] = [];
  let cur = id ? map.get(id) : undefined;
  while (cur && out.length < 10 && !out.includes(cur)) {
    out.unshift(cur);
    cur = cur.parent_id ? map.get(cur.parent_id) : undefined;
  }
  return out;
}
