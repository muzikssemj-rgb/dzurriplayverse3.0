/**
 * Kuiz Guru — jenis data & pengiraan skor (dikongsi klien + server).
 * Skor SENTIASA dikira semula di server daripada jawapan murid; klien hanya memaparkan.
 */
import type { ContentStatus } from "@/lib/kit";

export type QuestionType = "mcq" | "tf";

export type Question = {
  id: string;
  type: QuestionType;
  text: string;
  image_url: string | null;
  /** mcq: 2–4 pilihan. tf: sentiasa ["Betul", "Salah"]. */
  options: string[];
  /** Indeks jawapan betul dalam `options`. */
  answer: number;
  explanation: string | null;
};

export type Quiz = {
  id: string;
  title: string;
  slug: string;
  description: string;
  subject_id: string | null;
  time_limit: number; // saat setiap soalan
  shuffle: boolean;
  show_leaderboard: boolean;
  status: ContentStatus;
  questions: Question[];
  display_order: number;
  created_at: string;
  updated_at: string;
};

/** Soalan tanpa jawapan — selamat dihantar ke pelayar murid. */
export type PublicQuestion = Omit<Question, "answer" | "explanation">;
export type PublicQuiz = Omit<Quiz, "questions" | "status" | "created_at" | "updated_at" | "display_order"> & {
  questions: PublicQuestion[];
  question_count: number;
};

export type QuizResult = {
  id: string;
  quiz_id: string;
  name: string;
  kelas: string;
  score: number;
  correct: number;
  total: number;
  duration_ms: number;
  /** ID soalan yang dijawab salah / tidak dijawab — untuk analisis soalan guru. */
  wrong: string[];
  created_at: string;
};

export type LeaderEntry = Pick<QuizResult, "name" | "kelas" | "score" | "correct" | "total" | "duration_ms"> & { id: string };

export const TF_OPTIONS = ["Betul", "Salah"] as const;
export const TIME_LIMITS = [10, 15, 20, 30, 45, 60, 90] as const;
export const MAX_QUESTIONS = 50;

export const POINTS_CORRECT = 100;
export const POINTS_SPEED_MAX = 50;
export const POINTS_COMBO_STEP = 10;
export const COMBO_CAP = 5;

export type AnswerInput = { q: string; choice: number; ms: number };

/** Mata untuk satu jawapan betul: asas + bonus kelajuan + bonus combo (streak termasuk jawapan ini). */
export function pointsFor(ms: number, limitMs: number, streak: number): number {
  const t = Math.min(Math.max(ms, 0), limitMs);
  const speed = Math.round(POINTS_SPEED_MAX * (1 - t / limitMs));
  const combo = streak >= 2 ? POINTS_COMBO_STEP * (Math.min(streak, COMBO_CAP) - 1) : 0;
  return POINTS_CORRECT + speed + combo;
}

/**
 * Kira skor rasmi. Jawapan untuk soalan yang tiada / berulang diabaikan.
 * Soalan yang tidak dijawab dikira salah. Susunan streak ikut susunan jawapan dihantar.
 */
export function scoreAttempt(questions: Pick<Question, "id" | "answer" | "options">[], answers: AnswerInput[], limitSec: number) {
  const limitMs = limitSec * 1000;
  const byId = new Map(questions.map((q) => [q.id, q]));
  const used = new Set<string>();
  let score = 0;
  let correct = 0;
  let streak = 0;
  let best = 0;
  let totalMs = 0;
  const right = new Set<string>();
  for (const a of answers) {
    const q = byId.get(a.q);
    if (!q || used.has(a.q)) continue;
    used.add(a.q);
    const ms = Math.min(Math.max(Number(a.ms) || 0, 0), limitMs);
    totalMs += ms;
    if (Number.isInteger(a.choice) && a.choice === q.answer) {
      streak++;
      best = Math.max(best, streak);
      correct++;
      right.add(q.id);
      score += pointsFor(ms, limitMs, streak);
    } else streak = 0;
  }
  const wrong = questions.filter((q) => !right.has(q.id)).map((q) => q.id);
  return { score, correct, total: questions.length, bestStreak: best, answeredMs: totalMs, wrong };
}

export function starsFor(correct: number, total: number): 0 | 1 | 2 | 3 {
  if (!total) return 0;
  const p = correct / total;
  return p >= 0.9 ? 3 : p >= 0.6 ? 2 : p > 0 ? 1 : 0;
}

/** Bersihkan nama/kelas murid: buang aksara kawalan & ruang berlebihan. */
export function cleanPlayerText(v: unknown, max: number): string {
  return String(v ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function rankLeaders(rows: LeaderEntry[]): LeaderEntry[] {
  return [...rows].sort((a, b) => b.score - a.score || b.correct - a.correct || a.duration_ms - b.duration_ms);
}
