import sharp from "sharp";
import { requireAdminAction } from "@/lib/auth";
import { saveMedia } from "@/lib/data/store";
import { detectImageType, MAX_UPLOAD_BYTES } from "@/lib/validation";
import { isSameOrigin, jsonError } from "@/lib/http";

export const runtime = "nodejs";

const PRESETS = {
  thumbnail: { width: 800, height: 500, fit: "cover" as const },
  photo: { width: 600, height: 600, fit: "cover" as const },
  hero: { width: 1000, height: 1000, fit: "inside" as const },
};

/**
 * POST multipart/form-data { file, kind: thumbnail|photo|hero }
 * - Pemilik sahaja. Jenis disahkan melalui magic bytes (PNG/JPEG/WEBP/GIF; SVG ditolak), ≤ 4 MB.
 * - Imej diproses semula (sharp → WEBP, metadata EXIF/GPS dibuang) dan disimpan dalam Firestore.
 *   Ini mengelakkan keperluan Firebase Storage (yang memerlukan pelan berbayar Blaze).
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Forbidden", 403);
  try {
    await requireAdminAction();
  } catch {
    return jsonError("Tidak dibenarkan.", 401);
  }
  const len = Number(request.headers.get("content-length") ?? 0);
  if (len > MAX_UPLOAD_BYTES + 64 * 1024) return jsonError("Fail melebihi 4 MB.", 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Permintaan tidak sah.", 400);
  }
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "thumbnail") as keyof typeof PRESETS;
  const preset = PRESETS[kind] ?? PRESETS.thumbnail;
  if (!(file instanceof File)) return jsonError("Tiada fail.", 400);
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) return jsonError("Saiz fail mesti antara 1 bait dan 4 MB.", 413);

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!detectImageType(bytes)) return jsonError("Hanya imej PNG, JPEG, WEBP atau GIF dibenarkan.", 415);

  let out: Buffer;
  try {
    let quality = 82;
    out = await sharp(bytes, { animated: false }).rotate().resize({ ...preset, withoutEnlargement: true }).webp({ quality }).toBuffer();
    while (out.length > 850_000 && quality > 40) {
      quality -= 15;
      out = await sharp(bytes).rotate().resize({ ...preset, withoutEnlargement: true }).webp({ quality }).toBuffer();
    }
  } catch {
    return jsonError("Imej tidak dapat diproses.", 415);
  }
  try {
    const id = await saveMedia(out, "image/webp");
    return Response.json({ url: `/media/${id}` }, { status: 201 });
  } catch {
    return jsonError("Muat naik gagal. Semak sambungan Firebase.", 502);
  }
}
