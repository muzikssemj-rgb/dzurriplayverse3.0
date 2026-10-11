"use server";

import { revalidatePath, updateTag } from "next/cache";
import { DATA_TAG } from "@/lib/data/store";
import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/auth";
import { categorySlugTaken, deleteCategory, saveCategory } from "@/lib/data/store";
import { categoryInputSchema, slugify } from "@/lib/validation";
import { ID_RE } from "@/lib/types";
import type { ActionState } from "@/lib/actions/state";

export async function saveCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminAction();
  } catch {
    return { error: "Sesi tamat. Sila log masuk semula." };
  }
  const id = String(formData.get("id") ?? "");
  if (id && !ID_RE.test(id)) return { error: "ID kategori tidak sah." };
  const parsed = categoryInputSchema.safeParse({
    name: formData.get("name") ?? undefined,
    slug: formData.get("slug") ?? undefined,
    description: formData.get("description") ?? undefined,
    icon: formData.get("icon") ?? undefined,
    image_url: formData.get("image_url") ?? undefined,
    display_order: formData.get("display_order") ?? 0,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => {
      const k = String(i.path[0] ?? "form");
      if (!fieldErrors[k]) fieldErrors[k] = i.message;
    });
    return { error: "Sila semak medan yang ditanda.", fieldErrors };
  }
  const row = { ...parsed.data, slug: parsed.data.slug || slugify(parsed.data.name) };
  if (!row.slug) return { fieldErrors: { slug: "Slug tidak sah." } };
  try {
    if (await categorySlugTaken(row.slug, id || undefined)) return { error: "Slug kategori sudah wujud." };
    if (!(await saveCategory(id || null, row))) return { error: "Kategori tidak dijumpai." };
  } catch {
    return { error: "Gagal menyimpan kategori." };
  }
  updateTag(DATA_TAG);
  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Kategori dikemas kini." : "Kategori ditambah." };
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = String(formData.get("id") ?? "");
  if (!ID_RE.test(id)) redirect("/admin/categories?msg=error");
  const ok = await deleteCategory(id).catch(() => false);
  updateTag(DATA_TAG);
  revalidatePath("/", "layout");
  redirect(`/admin/categories?msg=${ok ? "deleted" : "error"}`);
}
