import { getPublishedGamesByIds } from "@/lib/data/store";
import { jsonError } from "@/lib/http";
import { ID_RE } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/games?ids=a,b,c — permainan published sahaja (Kegemaran / Baru dimainkan). */
export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").filter((x) => ID_RE.test(x));
  const result = await getPublishedGamesByIds(ids);
  if (!result.ok) return jsonError("Data tidak tersedia buat masa ini.", result.error === "not_configured" ? 503 : 502);
  return Response.json({ games: result.data }, { headers: { "Cache-Control": "no-store" } });
}
