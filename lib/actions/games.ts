"use server";

import { revalidatePath, updateTag } from "next/cache";
import { DATA_TAG } from "@/lib/data/store";
import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/auth";
import { createGame, deleteGame, getAdminGame, updateGame, uniqueGameSlug } from "@/lib/data/store";
import { gameInputSchema, slugify } from "@/lib/validation";
import { ID_RE } from "@/lib/types";
import type { ActionState } from "@/lib/actions/state";

function revalidateAll() {
  updateTag(DATA_TAG);
  revalidatePath("/", "layout");
}

/**
 * Cipta / kemas kini permainan. `intent`: "draft" | "preview" | "publish" | "save".
 */
export async function saveGameAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminAction();
  } catch {
    return { error: "Sesi tamat. Sila log masuk semula." };
  }
  const id = String(formData.get("id") ?? "");
  const intent = String(formData.get("intent") ?? "save");
  if (id && !ID_RE.test(id)) return { error: "ID permainan tidak sah." };

  const raw = Object.fromEntries(
    ["title", "slug", "game_url", "description", "full_description", "thumbnail_url", "category_id", "tags", "difficulty", "target_age", "launch_mode", "is_featured", "status", "display_order"].map(
      (k) => [k, formData.get(k) ?? undefined],
    ),
  );
  const parsed = gameInputSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Sila semak medan yang ditanda.", fieldErrors };
  }
  const input = parsed.data;
  if (intent === "publish") input.status = "published";
  else if (intent === "draft") input.status = "draft";
  else if (intent === "preview" && !id) input.status = "draft";

  let savedId = id;
  try {
    const slug = await uniqueGameSlug(input.slug || slugify(input.title), id || undefined);
    const row = { ...input, slug };
    if (id) {
      if (!(await updateGame(id, row))) return { error: "Permainan tidak dijumpai." };
    } else {
      savedId = await createGame(row);
    }
  } catch (e) {
    console.error("[games] save", e instanceof Error ? e.message : e);
    return { error: "Gagal menyimpan. Sila cuba lagi." };
  }

  revalidateAll();
  if (intent === "preview") redirect(`/admin/games/${savedId}/preview`);
  redirect(`/admin/games?msg=${intent === "publish" ? "published" : id ? "updated" : "created"}`);
}

export async function setGameStatusAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const back = safeBack(formData.get("back"));
  if (!ID_RE.test(id) || !["draft", "published", "unpublished"].includes(status)) redirect(`${back}${sep(back)}msg=error`);
  const ok = await updateGame(id, { status: status as "draft" | "published" | "unpublished" }).catch(() => false);
  revalidateAll();
  redirect(`${back}${sep(back)}msg=${ok ? status : "error"}`);
}

export async function duplicateGameAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = String(formData.get("id") ?? "");
  if (!ID_RE.test(id)) redirect("/admin/games?msg=error");
  const src = await getAdminGame(id);
  if (!src) redirect("/admin/games?msg=error");
  const newId = await createGame({
    title: `${src.title.slice(0, 110)} (Copy)`,
    slug: await uniqueGameSlug(slugify(`${src.slug}-copy`)),
    description: src.description,
    full_description: src.full_description,
    game_url: src.game_url,
    thumbnail_url: src.thumbnail_url,
    category_id: src.category_id,
    tags: src.tags,
    difficulty: src.difficulty,
    target_age: src.target_age,
    launch_mode: src.launch_mode,
    is_featured: false,
    status: "draft",
    display_order: src.display_order,
  });
  revalidateAll();
  redirect(`/admin/games/${newId}/edit?msg=duplicated`);
}

export async function deleteGameAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = String(formData.get("id") ?? "");
  const confirmText = String(formData.get("confirm") ?? "");
  if (!ID_RE.test(id) || confirmText !== "DELETE") redirect("/admin/games?msg=error");
  const ok = await deleteGame(id).catch(() => false);
  revalidateAll();
  redirect(`/admin/games?msg=${ok ? "deleted" : "error"}`);
}

function safeBack(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/admin/") && !s.startsWith("//") ? s.replace(/[?&]msg=[^&]*/g, "") : "/admin/games";
}
function sep(url: string) {
  return url.includes("?") ? "&" : "?";
}
