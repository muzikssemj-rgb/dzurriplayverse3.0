import { incrementPlay } from "@/lib/data/store";
import { isDataConfigured } from "@/lib/env";
import { isSameOrigin, jsonError } from "@/lib/http";
import { ID_RE } from "@/lib/types";

/** POST — rekod satu sesi main (permainan published sahaja). */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/play">) {
  const { id } = await ctx.params;
  if (!isSameOrigin(request)) return jsonError("Forbidden", 403);
  if (!ID_RE.test(id)) return jsonError("Not found", 404);
  if (!isDataConfigured()) return jsonError("Not configured", 503);
  try {
    await incrementPlay(id);
  } catch {
    return jsonError("Gagal", 502);
  }
  return new Response(null, { status: 204 });
}
