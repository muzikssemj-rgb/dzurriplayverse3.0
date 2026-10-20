import { incrementPlay } from "@/lib/data/store";
import { deviceFromUA, recordEvent } from "@/lib/data/analytics";
import { isDataConfigured } from "@/lib/env";
import { isSameOrigin, jsonError } from "@/lib/http";
import { ID_RE } from "@/lib/types";
import { getAdmin } from "@/lib/auth";

/** POST — rekod satu sesi main (permainan published sahaja). */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/play">) {
  const { id } = await ctx.params;
  if (!isSameOrigin(request)) return jsonError("Forbidden", 403);
  if (!ID_RE.test(id)) return jsonError("Not found", 404);
  if (!isDataConfigured()) return jsonError("Not configured", 503);
  // Pemilik yang sedang log masuk tidak dikira (sama seperti analitik paparan)
  if (await getAdmin()) return new Response(null, { status: 204 });
  try {
    if (await incrementPlay(id)) {
      await recordEvent({ type: "play", gameId: id, device: deviceFromUA(request.headers.get("user-agent") ?? ""), standalone: false, firstToday: false, isNew: false });
    }
  } catch {
    return jsonError("Gagal", 502);
  }
  return new Response(null, { status: 204 });
}
