"use client";

import { useActionState, useState } from "react";
import { saveCategoryAction } from "@/lib/actions/categories";
import { initialActionState } from "@/lib/actions/state";
import { SubmitButton } from "@/components/admin/SubmitButton";
import type { Category } from "@/lib/types";

export function CategoryForm({ category }: { category?: Category }) {
  const [state, action] = useActionState(saveCategoryAction, initialActionState);
  const [v, setV] = useState({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    icon: category?.icon ?? "",
    description: category?.description ?? "",
    image_url: category?.image_url ?? "",
    display_order: String(category?.display_order ?? 0),
  });
  const fe = state.fieldErrors ?? {};
  const p = category?.id ?? "new";
  const field = (k: keyof typeof v, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
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
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_80px_1.6fr_1.4fr_90px_auto] lg:items-end">
      {category && <input type="hidden" name="id" value={category.id} />}
      {field("name", "Name *", { required: true, maxLength: 60 })}
      {field("slug", "Slug", { placeholder: "auto", maxLength: 60 })}
      {field("icon", "Icon", { maxLength: 16, placeholder: "🎮" })}
      {field("description", "Description", { maxLength: 300 })}
      {field("image_url", "Image URL", { placeholder: "https://… (optional)" })}
      {field("display_order", "Order", { type: "number", min: 0, max: 9999 })}
      <div className="flex items-center gap-2">
        <SubmitButton className="btn-cyan !min-h-10 w-full lg:w-auto">{category ? "Save" : "＋ Add"}</SubmitButton>
      </div>
      {(state.error || state.message) && (
        <p className={`sm:col-span-2 lg:col-span-7 text-sm ${state.error ? "text-red-300" : "text-emerald-300"}`} role={state.error ? "alert" : "status"}>
          {state.error ?? state.message}
        </p>
      )}
    </form>
  );
}
