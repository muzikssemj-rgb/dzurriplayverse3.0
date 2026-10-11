"use server";

import { revalidatePath, updateTag } from "next/cache";
import { DATA_TAG } from "@/lib/data/store";
import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/auth";
import { updateReport } from "@/lib/data/store";
import { ID_RE } from "@/lib/types";

export async function updateReportAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = String(formData.get("id") ?? "");
  const op = String(formData.get("op") ?? "");
  if (!ID_RE.test(id) || !["resolve", "reopen", "delete"].includes(op)) redirect("/admin/reports?msg=error");
  const ok = await updateReport(id, op as "resolve" | "reopen" | "delete").catch(() => false);
  updateTag(DATA_TAG);
  revalidatePath("/admin", "layout");
  redirect(`/admin/reports?msg=${ok ? "saved" : "error"}`);
}
