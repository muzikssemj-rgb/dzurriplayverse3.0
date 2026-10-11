import { getMedia } from "@/lib/data/store";
import { isDataConfigured } from "@/lib/env";
import { ID_RE } from "@/lib/types";

/** GET /media/:id — imej yang dimuat naik oleh pemilik (ID unik → boleh dicache selama-lamanya). */
export async function GET(_req: Request, ctx: RouteContext<"/media/[id]">) {
  const { id } = await ctx.params;
  if (!ID_RE.test(id) || !isDataConfigured()) return new Response("Not found", { status: 404 });
  try {
    const m = await getMedia(id);
    if (!m) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(m.data), {
      headers: {
        "Content-Type": m.mime === "image/webp" ? "image/webp" : "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return new Response("Unavailable", { status: 503 });
  }
}
