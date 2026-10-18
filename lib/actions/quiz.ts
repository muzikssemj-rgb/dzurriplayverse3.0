"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/auth";
import { DATA_TAG } from "@/lib/data/store";
import { getAdminKit } from "@/lib/data/kit";
import { clearResults, deleteQuiz, deleteResult, getAdminQuiz, RESULTS_TAG, saveQuiz, setQuizStatus, uniqueQuizSlug } from "@/lib/data/quiz";
import { quizInputSchema, slugify } from "@/lib/validation";
import { ID_RE } from "@/lib/types";
import type { ActionState } from "@/lib/actions/state";

function revalidateAll() {
  updateTag(DATA_TAG);
  revalidatePath("/", "layout");
}

/** Simpan kuiz. Soalan dihantar sebagai JSON dalam medan `questions`. intent: draft | publish | save */
export async function saveQuizAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminAction();
  } catch {
    return { error: "Sesi tamat. Sila log masuk semula. (Salin soalan anda dahulu jika perlu.)" };
  }
  const id = String(formData.get("id") ?? "");
  const intent = String(formData.get("intent") ?? "save");
  if (id && !ID_RE.test(id)) return { error: "ID kuiz tidak sah." };

  let questions: unknown;
  try {
    const raw = String(formData.get("questions") ?? "[]");
    if (raw.length > 200_000) return { error: "Terlalu banyak data soalan." };
    questions = JSON.parse(raw);
  } catch {
    return { error: "Data soalan rosak. Muat semula halaman dan cuba lagi." };
  }
  const parsed = quizInputSchema.safeParse({
    ...Object.fromEntries(["title", "slug", "description", "subject_id", "time_limit", "shuffle", "show_leaderboard", "status", "display_order"].map((k) => [k, formData.get(k) ?? undefined])),
    questions,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      // Ralat soalan → kunci "q<indeks>" supaya editor boleh tandakan soalan berkenaan
      const k = i.path[0] === "questions" && typeof i.path[1] === "number" ? `q${i.path[1]}` : String(i.path[0] ?? "form");
      if (!fieldErrors[k]) fieldErrors[k] = i.message;
    }
    const qErr = Object.keys(fieldErrors).find((k) => /^q\d+$/.test(k));
    return {
      error: qErr ? `Soalan ${Number(qErr.slice(1)) + 1}: ${fieldErrors[qErr]}` : "Sila semak medan yang ditanda.",
      fieldErrors,
    };
  }
  const input = parsed.data;
  if (intent === "publish") input.status = "published";
  else if (intent === "draft") input.status = "draft";
  if (input.status === "published" && input.questions.length === 0) return { error: "Tambah sekurang-kurangnya satu soalan sebelum menerbitkan kuiz." };
  const ids = new Set(input.questions.map((q) => q.id));
  if (ids.size !== input.questions.length) return { error: "ID soalan berulang. Muat semula halaman dan cuba lagi." };

  let savedId = id;
  try {
    if (input.subject_id) {
      const { subjects } = await getAdminKit();
      if (!subjects.some((s) => s.id === input.subject_id)) return { fieldErrors: { subject_id: "Subjek tidak wujud." }, error: "Sila semak medan yang ditanda." };
    }
    const slug = await uniqueQuizSlug(input.slug || slugify(input.title), id || undefined);
    const r = await saveQuiz(id || null, { ...input, slug });
    if (!r) return { error: "Kuiz tidak dijumpai." };
    savedId = r;
  } catch (e) {
    console.error("[quiz] save", e instanceof Error ? e.message : e);
    return { error: "Gagal menyimpan kuiz. Sila cuba lagi." };
  }
  revalidateAll();
  redirect(`/admin/kuiz?msg=${input.status === "published" ? "quiz_published" : "quiz_saved"}&q=${savedId}`);
}

export async function setQuizStatusAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!ID_RE.test(id) || (status !== "published" && status !== "draft")) redirect("/admin/kuiz?msg=error");
  if (status === "published") {
    const q = await getAdminQuiz(id);
    if (!q || q.questions.length === 0) redirect("/admin/kuiz?msg=quiz_empty");
  }
  const ok = await setQuizStatus(id, status).catch(() => false);
  revalidateAll();
  redirect(`/admin/kuiz?msg=${ok ? (status === "published" ? "quiz_published" : "draft") : "error"}`);
}

export async function deleteQuizAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = String(formData.get("id") ?? "");
  if (!ID_RE.test(id)) redirect("/admin/kuiz?msg=error");
  const ok = await deleteQuiz(id).catch(() => false);
  revalidateAll();
  updateTag(RESULTS_TAG(id));
  redirect(`/admin/kuiz?msg=${ok ? "deleted" : "error"}`);
}

export async function deleteResultAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const quizId = String(formData.get("quiz_id") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!ID_RE.test(quizId) || !ID_RE.test(id)) redirect("/admin/kuiz?msg=error");
  const ok = await deleteResult(id).catch(() => false);
  updateTag(RESULTS_TAG(quizId));
  redirect(`/admin/kuiz/${quizId}/keputusan?msg=${ok ? "deleted" : "error"}`);
}

export async function clearResultsAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const quizId = String(formData.get("quiz_id") ?? "");
  if (!ID_RE.test(quizId)) redirect("/admin/kuiz?msg=error");
  await clearResults(quizId).catch(() => 0);
  updateTag(RESULTS_TAG(quizId));
  redirect(`/admin/kuiz/${quizId}/keputusan?msg=cleared`);
}
