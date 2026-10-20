import "server-only";
import { getDb } from "@/lib/db";

/**
 * Analitik ringkas & mesra privasi.
 * - Tiada kuki penjejakan, tiada IP, tiada data peribadi disimpan.
 * - Setiap peristiwa hanya MENAMBAH pembilang dalam satu dokumen harian
 *   (stats/daily-YYYY-MM-DD, waktu Malaysia) → 1 tulisan Firestore setiap peristiwa.
 * - "Pelawat unik" dikira oleh pelayar pengguna sendiri (penanda hari dalam localStorage),
 *   jadi ia anggaran yang baik, bukan kiraan forensik.
 */

export type TrackInput = {
  type: "view" | "play" | "quiz";
  page?: PageKey;
  gameId?: string;
  /** Bahan Kit yang dibuka (halaman /kit/tonton/<id>). */
  resourceId?: string;
  quizId?: string;
  device: "mobile" | "tablet" | "desktop";
  standalone: boolean;
  firstToday: boolean;
  isNew: boolean;
};

export const PAGE_KEYS = ["home", "games", "game", "kit", "kit_item", "kuiz", "favorites", "me", "about", "creator", "install", "other"] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export function pageKeyFromPath(path: string): PageKey {
  if (path === "/") return "home";
  if (path === "/games") return "games";
  if (path.startsWith("/games/")) return "game";
  if (path.startsWith("/kit/tonton/")) return "kit_item";
  if (path === "/kit" || path.startsWith("/kit/")) return "kit";
  if (path === "/kuiz" || path.startsWith("/kuiz/")) return "kuiz";
  const k = path.replace(/^\//, "").split("/")[0];
  return (PAGE_KEYS as readonly string[]).includes(k) ? (k as PageKey) : "other";
}

export function deviceFromUA(ua: string): TrackInput["device"] {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return "mobile";
  return "desktop";
}

const TZ = "Asia/Kuala_Lumpur";
export function dayKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
function hourKey(d = new Date()): string {
  const h = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(d);
  return `h${h.padStart(2, "0").slice(-2)}`;
}

export async function recordEvent(e: TrackInput, now = new Date()): Promise<void> {
  const db = getDb();
  if (!db) return;
  const c: Record<string, number> = {};
  if (e.type === "view") {
    c.views = 1;
    c[`hours.${hourKey(now)}`] = 1;
    c[`pages.${e.page ?? "other"}`] = 1;
    if (e.standalone) c.app_views = 1;
    if (e.resourceId && /^[A-Za-z0-9_-]{1,64}$/.test(e.resourceId)) {
      c.opens = 1;
      c[`resources.${e.resourceId}`] = 1;
    }
    if (e.firstToday) {
      c.visitors = 1;
      c[`devices.${e.device}`] = 1;
      if (e.standalone) c.app_visitors = 1;
      c[e.isNew ? "new_visitors" : "returning_visitors"] = 1;
    }
  } else if (e.type === "quiz") {
    c.quiz_plays = 1;
    if (e.quizId && /^[A-Za-z0-9_-]{1,64}$/.test(e.quizId)) c[`quizzes.${e.quizId}`] = 1;
  } else {
    c.plays = 1;
    if (e.gameId && /^[A-Za-z0-9_-]{1,64}$/.test(e.gameId)) c[`games.${e.gameId}`] = 1;
  }
  // last_at: masa rekod terakhir diterima — untuk semakan "adakah data masuk?" di admin
  await db.bump("stats", `daily-${dayKey(now)}`, c, { last_at: now.toISOString() });
}

export type DailyStats = {
  date: string;
  views: number;
  visitors: number;
  plays: number;
  opens: number;
  quiz_plays: number;
  app_views: number;
  app_visitors: number;
  new_visitors: number;
  returning_visitors: number;
  hours: Record<string, number>;
  pages: Record<string, number>;
  devices: Record<string, number>;
  games: Record<string, number>;
  last_at?: string | null;
  resources: Record<string, number>;
  quizzes: Record<string, number>;
};

function emptyDay(date: string): DailyStats {
  return {
    date, views: 0, visitors: 0, plays: 0, opens: 0, quiz_plays: 0, app_views: 0, app_visitors: 0, new_visitors: 0, returning_visitors: 0,
    hours: {}, pages: {}, devices: {}, games: {}, resources: {}, quizzes: {},
  };
}

/** Senarai hari (lama → baharu) untuk `days` hari terakhir termasuk hari ini. */
export function lastDays(days: number, now = new Date()): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(dayKey(new Date(now.getTime() - i * 86_400_000)));
  return [...new Set(out)];
}

export async function getDailyStats(days: number): Promise<DailyStats[]> {
  const db = getDb();
  const keys = lastDays(days);
  if (!db) return keys.map(emptyDay);
  const docs = await Promise.all(keys.map((k) => db.get<Partial<DailyStats>>("stats", `daily-${k}`)));
  return keys.map((k, i) => ({ ...emptyDay(k), ...(docs[i] ?? {}), date: k }));
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
function mergeMaps(list: Record<string, number>[]) {
  const out: Record<string, number> = {};
  for (const m of list) for (const [k, v] of Object.entries(m ?? {})) out[k] = (out[k] ?? 0) + Number(v || 0);
  return out;
}

export type AnalyticsSummary = ReturnType<typeof summarize>;

/** Ringkasan untuk halaman admin daripada 60 hari data harian. */
export function summarize(all: DailyStats[]) {
  const last = (n: number) => all.slice(-n);
  const prev = (n: number) => all.slice(-2 * n, -n);
  const total = (rows: DailyStats[], k: keyof DailyStats) => sum(rows.map((r) => Number(r[k] || 0)));
  const today = all[all.length - 1];
  const d7 = last(7);
  const d30 = last(30);
  const pct = (cur: number, before: number) => (before === 0 ? (cur > 0 ? null : 0) : Math.round(((cur - before) / before) * 100));
  const visitors7 = total(d7, "visitors");
  const visitorsPrev7 = total(prev(7), "visitors");
  const plays7 = total(d7, "plays");
  const playsPrev7 = total(prev(7), "plays");
  const hours7 = mergeMaps(d7.map((r) => r.hours));
  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, views: hours7[`h${String(h).padStart(2, "0")}`] ?? 0 }));
  const peak = hourly.reduce((a, b) => (b.views > a.views ? b : a), hourly[0]);
  const visitors30 = total(d30, "visitors");
  const activeDays30 = d30.filter((r) => r.visitors > 0).length;
  return {
    today: { visitors: today.visitors, views: today.views, plays: today.plays, opens: today.opens, quizPlays: today.quiz_plays },
    week: {
      visitors: visitors7,
      visitorsChange: pct(visitors7, visitorsPrev7),
      views: total(d7, "views"),
      plays: plays7,
      playsChange: pct(plays7, playsPrev7),
    },
    month: {
      visitors: visitors30,
      views: total(d30, "views"),
      plays: total(d30, "plays"),
      newVisitors: total(d30, "new_visitors"),
      returningVisitors: total(d30, "returning_visitors"),
      appVisitors: total(d30, "app_visitors"),
      activeDays: activeDays30,
      opens: total(d30, "opens"),
      quizPlays: total(d30, "quiz_plays"),
      playsPerVisitor: visitors30 ? Math.round((total(d30, "plays") / visitors30) * 10) / 10 : 0,
    },
    daily: d30.map((r) => ({ date: r.date, visitors: r.visitors, views: r.views, plays: r.plays, opens: r.opens, quizPlays: r.quiz_plays })),
    hourly,
    peakHour: peak.views > 0 ? peak.hour : null,
    devices: mergeMaps(d30.map((r) => r.devices)),
    pages: mergeMaps(d30.map((r) => r.pages)),
    games: mergeMaps(d30.map((r) => r.games)),
    resources: mergeMaps(d30.map((r) => r.resources)),
    quizzes: mergeMaps(d30.map((r) => r.quizzes)),
  };
}
