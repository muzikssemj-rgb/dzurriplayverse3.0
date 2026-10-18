"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/auth";
import { DATA_TAG } from "@/lib/data/store";
import { deleteSubject, deleteVideo, fetchLinkInfo, fetchYouTubeInfo, isAllowedLink, getAdminKit, saveSubject, saveVideo, setVideoStatus, subjectSlugTaken } from "@/lib/data/kit";
import { normalizeSafeUrl, subjectInputSchema, slugify, videoInputSchema } from "@/lib/validation";
import { MAX_SUBJECT_DEPTH, parseYouTubeUrl, RESERVED_SUBJECT_SLUGS, subjectPath } from "@/lib/kit";
import { ID_RE } from "@/lib/types";
import type { ActionState } from "@/lib/actions/state";

function revalidateAll() {
  updateTag(DATA_TAG);
  revalidatePath("/", "layout");
}

function issues(err: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "form");
    if (!fieldErrors[k]) fieldErrors[k] = i.message;
  }
  return { error: "Sila semak medan yang ditanda.", fieldErrors };
}

// ------------------------------------------------------------------ subjek
export async function saveSubjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminAction();
  } catch {
    return { error: "Sesi tamat. Sila log masuk semula." };
  }
  const id = String(formData.get("id") ?? "");
  if (id && !ID_RE.test(id)) return { error: "ID subjek tidak sah." };
  const parsed = subjectInputSchema.safeParse({
    name: formData.get("name") ?? undefined,
    slug: formData.get("slug") ?? undefined,
    description: formData.get("description") ?? undefined,
    icon: formData.get("icon") ?? undefined,
    parent_id: formData.get("parent_id") ?? undefined,
    display_order: formData.get("display_order") ?? 0,
  });
  if (!parsed.success) return issues(parsed.error);
  const row = { ...parsed.data, slug: parsed.data.slug || slugify(parsed.data.name) };
  if (!row.slug) return { fieldErrors: { slug: "Slug tidak sah." }, error: "Sila semak medan yang ditanda." };
  if (RESERVED_SUBJECT_SLUGS.has(row.slug)) return { fieldErrors: { slug: "Slug ini dikhaskan. Pilih slug lain." }, error: "Sila semak medan yang ditanda." };

  try {
    const { subjects, flat } = await getAdminKit();
    if (row.parent_id) {
      if (!subjects.some((s) => s.id === row.parent_id)) return { fieldErrors: { parent_id: "Subjek induk tidak wujud." }, error: "Sila semak medan yang ditanda." };
      const path = subjectPath(subjects, row.parent_id);
      // Elak kitaran: induk tidak boleh subjek ini sendiri atau mana-mana subjek di bawahnya
      if (id && path.some((s) => s.id === id)) return { fieldErrors: { parent_id: "Subjek tidak boleh berada di bawah dirinya sendiri." }, error: "Sila semak medan yang ditanda." };
      const ownDepth = id ? subtreeHeight(flat, id) : 1;
      if (path.length + ownDepth > MAX_SUBJECT_DEPTH)
        return { fieldErrors: { parent_id: `Maksimum ${MAX_SUBJECT_DEPTH} peringkat (cth. Alat Muzik Utama › Strings › Violin).` }, error: "Sila semak medan yang ditanda." };
    }
    if (await subjectSlugTaken(row.slug, id || undefined)) return { fieldErrors: { slug: "Slug subjek sudah wujud." }, error: "Sila semak medan yang ditanda." };
    if (!(await saveSubject(id || null, row))) return { error: "Subjek tidak dijumpai." };
  } catch {
    return { error: "Gagal menyimpan subjek." };
  }
  revalidateAll();
  return { ok: true, message: id ? "Subjek dikemas kini." : "Subjek ditambah." };
}

function subtreeHeight(flat: { id: string; parent_id: string | null }[], id: string): number {
  const kids = flat.filter((s) => s.parent_id === id);
  return 1 + (kids.length ? Math.max(...kids.map((k) => subtreeHeight(flat, k.id))) : 0);
}

export async function deleteSubjectAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = String(formData.get("id") ?? "");
  if (!ID_RE.test(id)) redirect("/admin/kit/subjek?msg=error");
  const ok = await deleteSubject(id).catch(() => false);
  revalidateAll();
  redirect(`/admin/kit/subjek?msg=${ok ? "deleted" : "error"}`);
}

// ------------------------------------------------------------------ video
export async function saveVideoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminAction();
  } catch {
    return { error: "Sesi tamat. Sila log masuk semula." };
  }
  const id = String(formData.get("id") ?? "");
  if (id && !ID_RE.test(id)) return { error: "ID video tidak sah." };
  const parsed = videoInputSchema.safeParse(
    Object.fromEntries(["title", "url", "description", "subject_id", "display_order", "status", "thumbnail_url", "open_mode"].map((k) => [k, formData.get(k) ?? undefined])),
  );
  if (!parsed.success) return issues(parsed.error);
  const input = parsed.data;
  const yt = parseYouTubeUrl(input.url);
  const linkUrl = yt ? null : normalizeSafeUrl(input.url);
  if (!yt && (!linkUrl || !isAllowedLink(linkUrl)))
    return { fieldErrors: { url: "Pautan mesti bermula dengan https:// (cth. https://youtu.be/… atau https://laman-anda.com/…)." }, error: "Sila semak medan yang ditanda." };

  let savedId = id;
  let note = "";
  try {
    const { subjects } = await getAdminKit();
    if (!subjects.some((s) => s.id === input.subject_id)) return { fieldErrors: { subject_id: "Subjek tidak wujud." }, error: "Sila semak medan yang ditanda." };
    let title = input.title;
    let row;
    if (yt) {
      const info = await fetchYouTubeInfo(yt.id);
      if (info.status === "blocked")
        return { fieldErrors: { url: "Pemilik video ini tidak membenarkan ia dipaparkan di laman lain. Pilih video lain." }, error: "Video tidak boleh dibenamkan." };
      if (info.status === "missing") return { fieldErrors: { url: "Video tidak dijumpai, peribadi atau telah dipadam." }, error: "Video tidak dijumpai." };
      if (!title) title = info.title ?? "";
      row = { kind: "youtube" as const, youtube_id: yt.id, start_seconds: yt.start, url: "", thumbnail_url: null, open_mode: "embed" as const };
    } else {
      const info = await fetchLinkInfo(linkUrl!);
      if (!title) title = info.title ?? "";
      let open_mode: "embed" | "tab";
      if (input.open_mode === "auto") {
        open_mode = info.embeddable ? "embed" : "tab";
        if (info.embeddable === false) note = "link_tab";
      } else open_mode = input.open_mode;
      row = { kind: "link" as const, youtube_id: "", start_seconds: 0, url: linkUrl!, thumbnail_url: input.thumbnail_url ?? info.image, open_mode };
    }
    if (title.length < 2) return { fieldErrors: { title: "Tajuk tidak dapat diambil secara automatik. Sila isi tajuk." }, error: "Sila semak medan yang ditanda." };
    const r = await saveVideo(id || null, {
      ...row,
      title,
      description: input.description,
      subject_id: input.subject_id,
      display_order: input.display_order,
      status: input.status,
    });
    if (!r) return { error: "Bahan tidak dijumpai." };
    savedId = r;
  } catch (e) {
    console.error("[kit] save resource", e instanceof Error ? e.message : e);
    return { error: "Gagal menyimpan bahan." };
  }
  revalidateAll();
  redirect(`/admin/kit?msg=${note || (id ? "updated" : "video_added")}&v=${savedId}`);
}

export async function setVideoStatusAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!ID_RE.test(id) || (status !== "published" && status !== "draft")) redirect("/admin/kit?msg=error");
  const ok = await setVideoStatus(id, status).catch(() => false);
  revalidateAll();
  redirect(`/admin/kit?msg=${ok ? (status === "published" ? "video_published" : "draft") : "error"}`);
}

export async function deleteVideoAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = String(formData.get("id") ?? "");
  if (!ID_RE.test(id)) redirect("/admin/kit?msg=error");
  const ok = await deleteVideo(id).catch(() => false);
  revalidateAll();
  redirect(`/admin/kit?msg=${ok ? "deleted" : "error"}`);
}
