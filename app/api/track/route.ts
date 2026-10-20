import { z } from "zod";
import { deviceFromUA, pageKeyFromPath, recordEvent } from "@/lib/data/analytics";
import { isDataConfigured } from "@/lib/env";
import { isSameOrigin } from "@/lib/http";
import { getAdmin } from "@/lib/auth";

const schema = z.object({
  path: z.string().max(200),
  standalone: z.boolean(),
  firstToday: z.boolean(),
  isNew: z.boolean(),
});

/** POST /api/track — rekod satu paparan halaman (tanpa data peribadi). */
export async function POST(request: Request) {
  if (!isSameOrigin(request) || !isDataConfigured()) return new Response(null, { status: 204 });
  // Lawatan pemilik sendiri (sesi admin aktif dalam pelayar ini) tidak dikira
  if (await getAdmin()) return new Response(null, { status: 204 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const p = schema.safeParse(body);
  if (!p.success || !p.data.path.startsWith("/") || p.data.path.startsWith("/admin")) return new Response(null, { status: 400 });
  try {
    await recordEvent({
      type: "view",
      page: pageKeyFromPath(p.data.path),
      resourceId: /^\/kit\/tonton\/([A-Za-z0-9_-]{1,64})$/.exec(p.data.path)?.[1],
      device: deviceFromUA(request.headers.get("user-agent") ?? ""),
      standalone: p.data.standalone,
      firstToday: p.data.firstToday,
      isNew: p.data.isNew,
    });
  } catch (e) {
    console.error("[track]", e instanceof Error ? e.message : e);
  }
  return new Response(null, { status: 204 });
}
