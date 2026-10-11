"use server";

import { revalidatePath, updateTag } from "next/cache";
import { DATA_TAG } from "@/lib/data/store";
import { z } from "zod";
import { requireAdminAction } from "@/lib/auth";
import { saveCreatorProfile } from "@/lib/data/store";
import { normalizeSafeUrl } from "@/lib/validation";
import type { ActionState } from "@/lib/actions/state";

const imageUrl = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v || !v.trim()) return null;
    const n = normalizeSafeUrl(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "URL imej mesti https:// atau /media/…" });
      return z.NEVER;
    }
    return n;
  });

const schema = z.object({
  name: z.string().trim().min(2, "Nama sekurang-kurangnya 2 aksara.").max(60),
  title: z.string().trim().max(80, "Maksimum 80 aksara."),
  bio: z.string().trim().max(2000, "Profil maksimum 2000 aksara."),
  quote: z.string().trim().max(200, "Petikan maksimum 200 aksara."),
  photo_url: imageUrl,
  hero_url: imageUrl,
});

export async function saveProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminAction();
  } catch {
    return { error: "Sesi tamat. Sila log masuk semula." };
  }
  const parsed = schema.safeParse({
    name: formData.get("name") ?? "",
    title: formData.get("title") ?? "",
    bio: formData.get("bio") ?? "",
    quote: formData.get("quote") ?? "",
    photo_url: formData.get("photo_url") ?? "",
    hero_url: formData.get("hero_url") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => {
      const k = String(i.path[0] ?? "form");
      if (!fieldErrors[k]) fieldErrors[k] = i.message;
    });
    return { error: "Sila semak medan yang ditanda.", fieldErrors };
  }
  try {
    await saveCreatorProfile(parsed.data);
  } catch {
    return { error: "Gagal menyimpan profil." };
  }
  updateTag(DATA_TAG);
  revalidatePath("/", "layout");
  return { ok: true, message: "Profil pencipta disimpan. Ia kini dipaparkan kepada pengguna." };
}
