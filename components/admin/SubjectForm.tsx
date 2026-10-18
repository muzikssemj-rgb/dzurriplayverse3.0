"use client";

import { useActionState, useState } from "react";
import { saveSubjectAction } from "@/lib/actions/kit";
import { initialActionState } from "@/lib/actions/state";
import { SubmitButton } from "@/components/admin/SubmitButton";
import type { Subject } from "@/lib/kit";

type Option = { id: string; name: string; depth: number; icon: string | null };

export function SubjectForm({ subject, parents, defaultParent = "" }: { subject?: Subject; parents: Option[]; defaultParent?: string }) {
  const [state, action] = useActionState(saveSubjectAction, initialActionState);
  const [v, setV] = useState({
    name: subject?.name ?? "",
    slug: subject?.slug ?? "",
    icon: subject?.icon ?? "",
    description: subject?.description ?? "",
    parent_id: subject?.parent_id ?? defaultParent,
    display_order: String(subject?.display_order ?? 0),
  });
  const fe = state.fieldErrors ?? {};
  const p = subject?.id ?? "new";
  const field = (k: Exclude<keyof typeof v, "parent_id">, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`${p}-${k}`} className="label !text-xs">{label}</label>
      <input
        id={`${p}-${k}`}
        name={k}
        className="input !py-2"
        value={v[k]}
        onChange={(e) => setV((s) => ({ ...s, [k]: e.target.value }))}
        aria-invalid={fe[k] ? true : undefined}
        {...extra}
      />
      {fe[k] && <p className="field-error">{fe[k]}</p>}
    </div>
  );
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_1.3fr_70px_1fr_1.6fr_80px_auto] lg:items-end">
      {subject && <input type="hidden" name="id" value={subject.id} />}
      {field("name", "Nama subjek *", { required: true, maxLength: 60, placeholder: "cth. Violin" })}
      <div>
        <label htmlFor={`${p}-parent_id`} className="label !text-xs">Di bawah</label>
        <select
          id={`${p}-parent_id`}
          name="parent_id"
          className="input !py-2"
          value={v.parent_id}
          onChange={(e) => setV((s) => ({ ...s, parent_id: e.target.value }))}
          aria-invalid={fe.parent_id ? true : undefined}
        >
          <option value="">— Subjek utama —</option>
          {parents
            .filter((o) => o.id !== subject?.id)
            .map((o) => (
              <option key={o.id} value={o.id}>
                {"— ".repeat(o.depth + 1)}
                {o.icon} {o.name}
              </option>
            ))}
        </select>
        {fe.parent_id && <p className="field-error">{fe.parent_id}</p>}
      </div>
      {field("icon", "Ikon", { maxLength: 16, placeholder: "🎻" })}
      {field("slug", "Slug", { placeholder: "auto", maxLength: 60 })}
      {field("description", "Penerangan", { maxLength: 300 })}
      {field("display_order", "Susunan", { type: "number", min: 0, max: 9999 })}
      <div className="flex items-center gap-2">
        <SubmitButton className="btn-cyan !min-h-10 w-full lg:w-auto" pendingText="Menyimpan…">
          {subject ? "Simpan" : "＋ Tambah"}
        </SubmitButton>
      </div>
      {(state.error || state.message) && (
        <p className={`sm:col-span-2 lg:col-span-7 text-sm ${state.error ? "text-red-300" : "text-emerald-300"}`} role={state.error ? "alert" : "status"}>
          {state.error ?? state.message}
        </p>
      )}
    </form>
  );
}
