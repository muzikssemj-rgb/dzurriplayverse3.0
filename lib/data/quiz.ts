import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";
import type { Db } from "@/lib/db/types";
import { DATA_TAG, NotConfiguredError, logActivity, type DataResult } from "@/lib/data/store";
import { rankLeaders, type LeaderEntry, type PublicQuiz, type Question, type Quiz, type QuizResult } from "@/lib/quiz";
import type { ContentStatus } from "@/lib/kit";

/**
 * Kuiz Guru. Koleksi Firestore: quizzes (soalan disimpan dalam dokumen kuiz), quizResults.
 * Jawapan betul TIDAK PERNAH dihantar ke pelayar — lihat toPublicQuiz().
 */
const CACHE_SECONDS = 600;
const now = () => new Date().toISOString();
export const RESULTS_TAG = (quizId: string) => `dz-quiz-results-${quizId}`;

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
    console.error(`[quiz] ${label}`, e instanceof Error ? e.message : e);
    return { ok: false, error: "unavailable" };
  }
}

function normalizeQuestion(q: Partial<Question>, i: number): Question {
  const type = q.type === "tf" ? "tf" : "mcq";
  const options = type === "tf" ? ["Betul", "Salah"] : Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : [];
  return {
    id: String(q.id ?? `q${i}`),
    type,
    text: String(q.text ?? ""),
    image_url: q.image_url ?? null,
    options,
    answer: Math.min(Math.max(Number(q.answer ?? 0), 0), Math.max(options.length - 1, 0)),
    explanation: q.explanation ?? null,
  };
}

function normalizeQuiz(id: string, d: Partial<Quiz>): Quiz {
  return {
    id,
    title: String(d.title ?? ""),
    slug: String(d.slug ?? id),
    description: String(d.description ?? ""),
    subject_id: d.subject_id ?? null,
    time_limit: Math.min(Math.max(Number(d.time_limit ?? 20), 5), 120),
    shuffle: Boolean(d.shuffle),
    show_leaderboard: d.show_leaderboard !== false,
    status: d.status === "published" ? "published" : "draft",
    questions: Array.isArray(d.questions) ? d.questions.map(normalizeQuestion) : [],
    display_order: Number(d.display_order ?? 0),
    created_at: String(d.created_at ?? ""),
    updated_at: String(d.updated_at ?? ""),
  };
}

const loadQuizzes = cache(
  unstable_cache(
    async (): Promise<Quiz[]> => (await db().list<Partial<Quiz>>("quizzes")).map((r) => normalizeQuiz(r.id, r.data)),
    ["dz-quizzes"],
    { tags: [DATA_TAG], revalidate: CACHE_SECONDS },
  ),
);

export function toPublicQuiz(q: Quiz): PublicQuiz {
  return {
    id: q.id,
    title: q.title,
    slug: q.slug,
    description: q.description,
    subject_id: q.subject_id,
    time_limit: q.time_limit,
    shuffle: q.shuffle,
    show_leaderboard: q.show_leaderboard,
    question_count: q.questions.length,
    questions: q.questions.map(({ id, type, text, image_url, options }) => ({ id, type, text, image_url, options })),
  };
}

const sortQuiz = (a: Quiz, b: Quiz) => a.display_order - b.display_order || b.updated_at.localeCompare(a.updated_at);
const isPlayable = (q: Quiz) => q.status === "published" && q.questions.length > 0;

/** Senarai kuiz awam (tanpa soalan — ringan untuk kad). */
export function getPublishedQuizzes(): Promise<DataResult<PublicQuiz[]>> {
  return safe(async () => (await loadQuizzes()).filter(isPlayable).sort(sortQuiz).map((q) => ({ ...toPublicQuiz(q), questions: [] })), "getPublishedQuizzes");
}

export function getPublishedQuizBySlug(slug: string): Promise<DataResult<PublicQuiz | null>> {
  return safe(async () => {
    if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
    const q = (await loadQuizzes()).find((x) => x.slug === slug && isPlayable(x));
    return q ? toPublicQuiz(q) : null;
  }, "getPublishedQuizBySlug");
}

/** Kuiz penuh (dengan jawapan) — untuk semakan di server sahaja. */
export async function getPlayableQuiz(id: string): Promise<Quiz | null> {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return null;
  return (await loadQuizzes()).find((q) => q.id === id && isPlayable(q)) ?? null;
}

// ------------------------------------------------------------------ keputusan & papan skor
async function readResults(quizId: string): Promise<QuizResult[]> {
  return (await db().where<Omit<QuizResult, "id">>("quizResults", "quiz_id", quizId)).map((r) => ({
    ...r.data,
    wrong: Array.isArray(r.data.wrong) ? r.data.wrong.map(String) : [],
    id: r.id,
  }));
}

/** Papan skor dicache 20 saat (jimat bacaan Firestore apabila satu kelas bermain serentak). */
export function getLeaderboard(quizId: string, limit = 10): Promise<LeaderEntry[]> {
  return unstable_cache(
    async () =>
      rankLeaders(
        (await readResults(quizId)).map((r) => ({ id: r.id, name: r.name, kelas: r.kelas, score: r.score, correct: r.correct, total: r.total, duration_ms: r.duration_ms })),
      ).slice(0, 50),
    ["dz-board", quizId],
    { tags: [RESULTS_TAG(quizId)], revalidate: 20 },
  )().then((rows) => rows.slice(0, limit));
}

export async function resultExists(id: string) {
  return Boolean(await db().get("quizResults", id));
}

export async function saveResult(id: string, r: Omit<QuizResult, "id" | "created_at">) {
  await db().set("quizResults", id, { ...r, created_at: now() });
}

// ------------------------------------------------------------------ admin
export async function listAdminQuizzes() {
  const [quizzes, counts] = await Promise.all([loadQuizzes(), db().list<{ quiz_id: string }>("quizResults")]);
  const n = new Map<string, number>();
  for (const r of counts) n.set(r.data.quiz_id, (n.get(r.data.quiz_id) ?? 0) + 1);
  return [...quizzes].sort(sortQuiz).map((q) => ({ ...q, result_count: n.get(q.id) ?? 0 }));
}

export async function getAdminQuiz(id: string): Promise<Quiz | null> {
  return (await loadQuizzes()).find((q) => q.id === id) ?? null;
}

export async function listResults(quizId: string): Promise<QuizResult[]> {
  return (await readResults(quizId)).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function deleteResult(id: string) {
  return db().delete("quizResults", id);
}

export async function clearResults(quizId: string): Promise<number> {
  const d = db();
  const rows = await d.where("quizResults", "quiz_id", quizId);
  for (const r of rows) await d.delete("quizResults", r.id);
  return rows.length;
}

export async function uniqueQuizSlug(base: string, excludeId?: string): Promise<string> {
  const taken = new Set((await db().list<{ slug: string }>("quizzes")).filter((r) => r.id !== excludeId).map((r) => r.data.slug));
  const root = base || "kuiz";
  if (!taken.has(root)) return root;
  for (let i = 2; i < 500; i++) if (!taken.has(`${root.slice(0, 70)}-${i}`)) return `${root.slice(0, 70)}-${i}`;
  return `${root.slice(0, 60)}-${Date.now().toString(36)}`;
}

type QuizWrite = Omit<Quiz, "id" | "created_at" | "updated_at">;

export async function saveQuiz(id: string | null, input: QuizWrite): Promise<string | null> {
  const d = db();
  if (id) {
    if (!(await d.update("quizzes", id, { ...input, updated_at: now() }))) return null;
    await logActivity("update", "quiz", id, input.title);
    return id;
  }
  const newId = await d.create("quizzes", { ...input, created_at: now(), updated_at: now() });
  await logActivity(input.status === "published" ? "publish" : "create", "quiz", newId, input.title);
  return newId;
}

export async function setQuizStatus(id: string, status: ContentStatus) {
  const ok = await db().update("quizzes", id, { status, updated_at: now() });
  if (ok) await logActivity(status === "published" ? "publish" : "move_to_draft", "quiz", id, null);
  return ok;
}

export async function deleteQuiz(id: string): Promise<boolean> {
  const d = db();
  const before = await d.get<Quiz>("quizzes", id);
  if (!before || !(await d.delete("quizzes", id))) return false;
  await clearResults(id);
  await logActivity("delete", "quiz", id, before.title);
  return true;
}
