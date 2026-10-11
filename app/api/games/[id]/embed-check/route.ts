import { getAdminGame, getPublishedGameUrl } from "@/lib/data/store";
import { getSiteUrl, isDataConfigured } from "@/lib/env";
import { evaluateFramePolicy } from "@/lib/validation";
import { getAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { ID_RE } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET — semak pengepala laman sumber (X-Frame-Options / CSP frame-ancestors) untuk
 * permainan yang SUDAH ada dalam DB (bukan URL sembarangan → elak SSRF).
 */
export async function GET(request: Request, ctx: RouteContext<"/api/games/[id]/embed-check">) {
  const { id } = await ctx.params;
  if (!ID_RE.test(id)) return jsonError("Not found", 404);
  if (!isDataConfigured()) return jsonError("Not configured", 503);

  const preview = new URL(request.url).searchParams.get("preview") === "1";
  let gameUrl: string | null = null;
  try {
    gameUrl = preview && (await getAdmin()) ? ((await getAdminGame(id))?.game_url ?? null) : await getPublishedGameUrl(id);
  } catch {
    return Response.json({ embeddable: true, reason: null, checked: false });
  }
  if (!gameUrl) return jsonError("Not found", 404);
  if (gameUrl.startsWith("/")) return Response.json({ embeddable: true, reason: null, checked: true });

  try {
    const res = await fetch(gameUrl, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "DzurriPlayverse-EmbedCheck/1.0", Accept: "text/html,*/*" },
      cache: "no-store",
    });
    res.body?.cancel().catch(() => {});
    const verdict = evaluateFramePolicy(
      { xFrameOptions: res.headers.get("x-frame-options"), csp: res.headers.get("content-security-policy") },
      getSiteUrl(),
    );
    return Response.json({ ...verdict, checked: true, status: res.status });
  } catch {
    return Response.json({ embeddable: true, reason: null, checked: false });
  }
}
