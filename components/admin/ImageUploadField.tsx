"use client";

import { useState } from "react";

/** Medan imej: muat naik (diproses di server → WEBP) atau tampal URL https. */
export function ImageUploadField({
  id,
  name,
  label,
  hint,
  kind,
  value,
  onChange,
  previewClass = "aspect-square w-32 rounded-full",
}: {
  id: string;
  name: string;
  label: string;
  hint?: string;
  kind: "photo" | "hero" | "thumbnail" | "question";
  value: string;
  onChange: (v: string) => void;
  previewClass?: string;
}) {
  const [state, setState] = useState<{ busy: boolean; error: string }>({ busy: false, error: "" });

  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return setState({ busy: false, error: "Fail melebihi 4 MB." });
    setState({ busy: true, error: "" });
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", kind);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Muat naik gagal.");
      onChange(j.url);
      setState({ busy: false, error: "" });
    } catch (e) {
      setState({ busy: false, error: e instanceof Error ? e.message : "Muat naik gagal." });
    }
  }

  return (
    <div className="grid items-start gap-4 sm:grid-cols-[auto_1fr]">
      <div className={`grid place-items-center overflow-hidden border-2 border-cyan-electric/50 bg-space ${previewClass}`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={`${label} preview`} className="size-full object-cover" />
        ) : (
          <span className="p-2 text-center text-xs text-ink-muted">Tiada imej</span>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor={`${id}-file`} className="label">{label}</label>
        <input
          id={`${id}-file`}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={state.busy}
          onChange={(e) => upload(e.target.files?.[0])}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white"
        />
        {hint && <p className="text-xs text-ink-muted">{hint}</p>}
        {state.busy && <p className="text-xs text-cyan-electric" role="status">Memuat naik & memproses…</p>}
        {state.error && <p className="field-error" role="alert">{state.error}</p>}
        <input type="hidden" name={name} value={value} />
        {value && (
          <button type="button" className="btn-ghost !min-h-9 !px-3 text-xs" onClick={() => onChange("")}>
            Buang imej
          </button>
        )}
      </div>
    </div>
  );
}
