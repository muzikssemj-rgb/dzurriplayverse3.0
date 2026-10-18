import { revalidateTag } from "next/cache";
import { getLeaderboard, getPlayableQuiz, RESULTS_TAG, resultExists, saveResult } from "@/lib/data/quiz";
import { verifyAttemptToken } from "@/lib/quiz-token";
import { isDataConfigured } from "@/lib/env";
import { isSameOrigin, jsonError } from "@/lib/http";
import { cleanPlayerText, rankLeaders, scoreAttempt, type AnswerInput, type LeaderEntry } from "@/lib/quiz";

const MIN_MS = 300; // masa reaksi manusia minimum untuk bonus kelajuan

/**
 * POST { token, name, kelas, answers: [{ q, choice, ms }] }
 * Skor dikira di server. Setiap token hanya boleh dihantar sekali (ID keputusan = nonce token).
 */
export async function POST(request: Request, ctx: RouteContext<"/api/kuiz/[id]/hantar">) {
  if (!isSameOrigin(request)) return jsonError("Forbidden", 403);
  if (!isDataConfigured()) return jsonError("Not configured", 503);
  const { id } = await ctx.params;
  if (Number(request.headers.get("content-length") ?? 0) > 20_000) return jsonError("Terlalu besar.", 413);
  let body: { token?: unknown; name?: unknown; kelas?: unknown; answers?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Permintaan tidak sah.", 400);
  }
  const att = verifyAttemptToken(body.token, id);
  if (!att) return jsonError("Sesi kuiz tamat. Mula semula.", 401);
  const name = cleanPlayerText(body.name, 40);
  const kelas = cleanPlayerText(body.kelas, 20);
  if (name.length < 2) return jsonError("Sila isi nama (sekurang-kurangnya 2 aksara).", 400);
  if (!Array.isArray(body.answers) || body.answers.length > 60) return jsonError("Jawapan tidak sah.", 400);

  try {
    const quiz = await getPlayableQuiz(id);
    if (!quiz) return jsonError("Kuiz tidak dijumpai.", 404);
    if (await resultExists(att.nonce)) return jsonError("Keputusan ini sudah dihantar.", 409);
    const limitMs = quiz.time_limit * 1000;
    const answers: AnswerInput[] = (body.answers as unknown[]).slice(0, quiz.questions.length).map((a) => {
      const o = (a ?? {}) as Record<string, unknown>;
      return {
        q: typeof o.q === "string" ? o.q.slice(0, 24) : "",
        choice: Number.isInteger(o.choice) ? (o.choice as number) : -1,
        ms: Math.min(Math.max(Number(o.ms) || limitMs, MIN_MS), limitMs),
      };
    });
    const r = scoreAttempt(quiz.questions, answers, quiz.time_limit);
    const elapsed = Date.now() - att.start;
    const duration_ms = Math.max(Math.min(elapsed, quiz.questions.length * (limitMs + 15_000)), r.answeredMs);
    await saveResult(att.nonce, { quiz_id: quiz.id, name, kelas, score: r.score, correct: r.correct, total: r.total, duration_ms, wrong: r.wrong });
    revalidateTag(RESULTS_TAG(quiz.id), { expire: 0 });

    const me: LeaderEntry = { id: att.nonce, name, kelas, score: r.score, correct: r.correct, total: r.total, duration_ms };
    let board: LeaderEntry[] = [];
    let rank: number | null = null;
    if (quiz.show_leaderboard) {
      const merged = rankLeaders([...(await getLeaderboard(quiz.id, 50)).filter((e) => e.id !== me.id), me]);
      const idx = merged.findIndex((e) => e.id === me.id);
      rank = idx >= 0 && idx < 50 ? idx + 1 : null;
      board = merged.slice(0, 10);
    }
    return Response.json(
      { score: r.score, correct: r.correct, total: r.total, bestStreak: r.bestStreak, duration_ms, rank, board, me: me.id },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("[quiz] submit", e instanceof Error ? e.message : e);
    return jsonError("Gagal menghantar keputusan.", 502);
  }
}
