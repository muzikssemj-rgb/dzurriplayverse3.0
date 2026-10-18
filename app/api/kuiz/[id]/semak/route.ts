import { getPlayableQuiz } from "@/lib/data/quiz";
import { verifyAttemptToken } from "@/lib/quiz-token";
import { isSameOrigin, jsonError } from "@/lib/http";

/**
 * POST { token, q, choice } — semak satu jawapan (untuk maklum balas segera dalam game).
 * Skor rasmi tetap dikira semula semasa /hantar.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/kuiz/[id]/semak">) {
  if (!isSameOrigin(request)) return jsonError("Forbidden", 403);
  const { id } = await ctx.params;
  let body: { token?: unknown; q?: unknown; choice?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Permintaan tidak sah.", 400);
  }
  if (!verifyAttemptToken(body.token, id)) return jsonError("Sesi kuiz tamat. Mula semula.", 401);
  try {
    const quiz = await getPlayableQuiz(id);
    const q = quiz?.questions.find((x) => x.id === body.q);
    if (!q) return jsonError("Soalan tidak dijumpai.", 404);
    const choice = Number.isInteger(body.choice) ? (body.choice as number) : -1;
    return Response.json(
      { correct: choice === q.answer, answer: q.answer, explanation: q.explanation },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return jsonError("Gagal", 502);
  }
}
