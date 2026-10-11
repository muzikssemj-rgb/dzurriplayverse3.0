import { z } from "zod";

/**
 * URL yang dibenarkan: https:// sahaja, atau laluan dalaman bermula "/" (contoh
 * permainan terbina dalam di /play/...). Protokol seperti javascript:, data:,
 * vbscript:, file:, http: dan URL "//host" ditolak.
 */
export function normalizeSafeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value || value.length > 2048) return null;
  // Tiada aksara kawalan / ruang kosong tersembunyi
  if (/[\u0000-\u001F\u007F\s]/.test(value)) return null;
  if (value.startsWith("/")) {
    if (value.startsWith("//") || value.startsWith("/\\")) return null;
    try {
      const u = new URL(value, "https://local.invalid");
      if (u.origin !== "https://local.invalid") return null;
      return u.pathname + u.search + u.hash;
    } catch {
      return null;
    }
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  if (!parsed.hostname || parsed.username || parsed.password) return null;
  return parsed.toString();
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 70)
    .replace(/-+$/g, "");
}

export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const t = part.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 30);
    if (t) seen.add(t);
    if (seen.size >= 10) break;
  }
  return [...seen];
}

const safeUrl = (label: string) =>
  z
    .string()
    .transform((v, ctx) => {
      const n = normalizeSafeUrl(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: `${label} mesti bermula dengan https:// (atau laluan dalaman /...).` });
        return z.NEVER;
      }
      return n;
    });

const optionalSafeUrl = (label: string) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v || !v.trim()) return null;
      const n = normalizeSafeUrl(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: `${label} mesti bermula dengan https:// (atau laluan dalaman /...).` });
        return z.NEVER;
      }
      return n;
    });

const uuidOrNull = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : null))
  .refine((v) => v === null || /^[A-Za-z0-9_-]{1,64}$/.test(v), "Kategori tidak sah.");

export const gameInputSchema = z.object({
  title: z.string().trim().min(2, "Nama permainan sekurang-kurangnya 2 aksara.").max(120, "Nama terlalu panjang (maks 120)."),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? slugify(v) : "")),
  game_url: safeUrl("Game URL"),
  description: z.string().trim().max(300, "Penerangan ringkas maksimum 300 aksara.").default(""),
  full_description: z.string().trim().max(5000, "Penerangan penuh maksimum 5000 aksara.").default(""),
  thumbnail_url: optionalSafeUrl("Thumbnail URL"),
  category_id: uuidOrNull,
  tags: z
    .string()
    .optional()
    .transform((v) => parseTags(v ?? "")),
  difficulty: z
    .enum(["", "easy", "medium", "hard"])
    .optional()
    .transform((v) => (v ? v : null)),
  target_age: z
    .string()
    .trim()
    .max(40, "Kumpulan umur maksimum 40 aksara.")
    .optional()
    .transform((v) => (v ? v : null)),
  launch_mode: z.enum(["embedded", "external"], { message: "Pilih Embedded atau External." }),
  is_featured: z
    .union([z.literal("on"), z.literal("true"), z.literal(""), z.undefined(), z.null()])
    .transform((v) => v === "on" || v === "true"),
  status: z.enum(["draft", "published", "unpublished"]).default("draft"),
  display_order: z.coerce
    .number()
    .int("Susunan mesti nombor bulat.")
    .min(0, "Susunan minimum 0.")
    .max(9999, "Susunan maksimum 9999.")
    .default(0),
});

export type GameInput = z.output<typeof gameInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Nama kategori sekurang-kurangnya 2 aksara.").max(60, "Nama kategori maksimum 60 aksara."),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? slugify(v) : "")),
  description: z
    .string()
    .trim()
    .max(300, "Penerangan maksimum 300 aksara.")
    .optional()
    .transform((v) => (v ? v : null)),
  icon: z
    .string()
    .trim()
    .max(16, "Ikon maksimum 16 aksara (cth. emoji).")
    .optional()
    .transform((v) => (v ? v : null)),
  image_url: optionalSafeUrl("Image URL"),
  display_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export type CategoryInput = z.output<typeof categoryInputSchema>;

export const reportInputSchema = z.object({
  reason: z.enum(["not_loading", "blocked_embed", "wrong_content", "other"]),
  message: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : null)),
});

export const passwordSchema = z
  .string()
  .min(12, "Kata laluan baharu sekurang-kurangnya 12 aksara.")
  .max(128, "Kata laluan terlalu panjang.")
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v), "Gunakan huruf kecil, huruf besar dan nombor.");

/** Semakan "magic bytes" — jenis fail sebenar, bukan sekadar sambungan nama fail. */
export function detectImageType(bytes: Uint8Array): { mime: string; ext: string } | null {
  const b = bytes;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a)
    return { mime: "image/png", ext: "png" };
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61)
    return { mime: "image/gif", ext: "gif" };
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return { mime: "image/webp", ext: "webp" };
  return null;
}

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * Menilai pengepala respons laman sumber untuk menentukan sama ada ia membenarkan
 * dipaparkan dalam iframe oleh origin kita. Kita TIDAK memintas sekatan — hanya membaca.
 */
export function evaluateFramePolicy(
  headers: { xFrameOptions: string | null; csp: string | null },
  ourOrigin: string,
): { embeddable: boolean; reason: string | null } {
  const xfo = headers.xFrameOptions?.trim().toLowerCase() ?? "";
  if (xfo) {
    if (xfo.includes("deny")) return { embeddable: false, reason: "X-Frame-Options: DENY" };
    if (xfo.includes("sameorigin")) return { embeddable: false, reason: "X-Frame-Options: SAMEORIGIN" };
  }
  const csp = headers.csp ?? "";
  const directive = csp
    .split(",")
    .flatMap((p) => p.split(";"))
    .map((d) => d.trim())
    .find((d) => d.toLowerCase().startsWith("frame-ancestors"));
  if (directive) {
    const sources = directive.split(/\s+/).slice(1).map((s) => s.toLowerCase());
    if (sources.includes("'none'") || sources.length === 0) return { embeddable: false, reason: "CSP frame-ancestors 'none'" };
    if (sources.includes("*")) return { embeddable: true, reason: null };
    const origin = ourOrigin.toLowerCase();
    const host = (() => {
      try {
        return new URL(origin).host;
      } catch {
        return origin;
      }
    })();
    const allowed = sources.some((s) => {
      if (s === origin || s === host || s === `https://${host}`) return true;
      if (s === "https:" ) return true;
      const wildcard = s.replace(/^https?:\/\//, "");
      if (wildcard.startsWith("*.")) return host.endsWith(wildcard.slice(1));
      return false;
    });
    if (!allowed) return { embeddable: false, reason: "CSP frame-ancestors" };
  }
  return { embeddable: true, reason: null };
}
