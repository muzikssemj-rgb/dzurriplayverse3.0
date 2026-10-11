import { headers } from "next/headers";
import { addReport, countRecentAttempts, recordAttempt } from "@/lib/data/store";
import { isDataConfigured } from "@/lib/env";
import { isSameOrigin, jsonError } from "@/lib/http";
import { reportInputSchema } from "@/lib/validation";
import { hashKey } from "@/lib/session";
import { ID_RE } from "@/lib/types";

/** POST — laporkan pautan rosak (had 5 laporan / jam setiap rangkaian). */
export async function POST(request: Request, ctx: RouteContext<"/api/games/[id]/report">) {
  const { id } = await ctx.params;
  if (!isSameOrigin(request)) return jsonError("Forbidden", 403);
  if (!ID_RE.test(id)) return jsonError("Permainan tidak dijumpai.", 404);
  if (!isDataConfigured()) return jsonError("Perkhidmatan belum dikonfigurasi.", 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Permintaan tidak sah.", 400);
  }
  const parsed = reportInputSchema.safeParse(body);
  if (!parsed.success) return jsonError("Sila pilih sebab laporan.", 400);

  const h = await headers();
  const key = hashKey("report", h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown");
  try {
    if ((await countRecentAttempts(key, Date.now() - 3_600_000)) >= 5) return jsonError("Terlalu banyak laporan. Cuba lagi kemudian.", 429);
    await recordAttempt(key);
    if (!(await addReport(id, parsed.data.reason, parsed.data.message))) return jsonError("Permainan tidak dijumpai.", 404);
  } catch {
    return jsonError("Laporan tidak dapat dihantar.", 502);
  }
  return Response.json({ ok: true }, { status: 201 });
}
