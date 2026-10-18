import { requireAdminAction } from "@/lib/auth";
import { getAdminQuiz, listResults } from "@/lib/data/quiz";
import { jsonError } from "@/lib/http";
import { rankLeaders } from "@/lib/quiz";
import { slugify } from "@/lib/validation";

export const runtime = "nodejs";

/** Elak "formula injection" apabila dibuka dalam Excel / Google Sheets. */
function cell(v: string | number) {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** GET — keputusan kuiz sebagai CSV (pemilik sahaja). */
export async function GET(request: Request, ctx: RouteContext<"/api/admin/kuiz/[id]/csv">) {
  try {
    await requireAdminAction();
  } catch {
    return jsonError("Tidak dibenarkan.", 401);
  }
  const { id } = await ctx.params;
  const quiz = await getAdminQuiz(id);
  if (!quiz) return jsonError("Tidak dijumpai.", 404);
  const kelas = new URL(request.url).searchParams.get("kelas") ?? "";
  const rows = (await listResults(id)).filter((r) => !kelas || r.kelas === kelas);
  const ranked = rankLeaders(rows);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const lines = [
    ["Kedudukan", "Nama", "Kelas", "Skor", "Betul", "Jumlah Soalan", "Peratus", "Masa (saat)", "Tarikh"].join(","),
    ...ranked.map((e, i) => {
      const r = byId.get(e.id)!;
      const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(r.created_at));
      return [i + 1, r.name, r.kelas, r.score, r.correct, r.total, `${Math.round((r.correct / Math.max(r.total, 1)) * 100)}%`, Math.round(r.duration_ms / 1000), date].map(cell).join(",");
    }),
  ];
  const name = `keputusan-${slugify(quiz.title) || "kuiz"}${kelas ? `-${slugify(kelas)}` : ""}.csv`;
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
