import { getPlayableQuiz } from "@/lib/data/quiz";
import { createAttemptToken } from "@/lib/quiz-token";
import { isDataConfigured } from "@/lib/env";
import { isSameOrigin, jsonError } from "@/lib/http";
import { getAdmin } from "@/lib/auth";
import { deviceFromUA, recordEvent } from "@/lib/data/analytics";

/** POST — mula satu cubaan kuiz; pulangkan token bertandatangan (masa mula direkod di server). */
export async function POST(request: Request, ctx: RouteContext<"/api/kuiz/[id]/mula">) {
  if (!isSameOrigin(request)) return jsonError("Forbidden", 403);
  if (!isDataConfigured()) return jsonError("Not configured", 503);
  const { id } = await ctx.params;
  try {
    const quiz = await getPlayableQuiz(id);
    if (!quiz) return jsonError("Kuiz tidak dijumpai.", 404);
    if (!(await getAdmin()))
      await recordEvent({ type: "quiz", quizId: quiz.id, device: deviceFromUA(request.headers.get("user-agent") ?? ""), standalone: false, firstToday: false, isNew: false }).catch(() => {});
    return Response.json({ token: createAttemptToken(quiz.id) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError("Gagal", 502);
  }
}
