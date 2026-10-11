"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveGameAction } from "@/lib/actions/games";
import { initialActionState } from "@/lib/actions/state";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { GameThumb } from "@/components/games/GameThumb";
import type { Category, Game } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

type Values = {
  title: string;
  slug: string;
  game_url: string;
  description: string;
  full_description: string;
  thumbnail_url: string;
  category_id: string;
  tags: string;
  difficulty: string;
  target_age: string;
  launch_mode: "embedded" | "external";
  is_featured: boolean;
  status: "draft" | "published" | "unpublished";
  display_order: string;
};

function toValues(g?: Game | null): Values {
  return {
    title: g?.title ?? "",
    slug: g?.slug ?? "",
    game_url: g?.game_url ?? "",
    description: g?.description ?? "",
    full_description: g?.full_description ?? "",
    thumbnail_url: g?.thumbnail_url ?? "",
    category_id: g?.category_id ?? "",
    tags: (g?.tags ?? []).join(", "),
    difficulty: g?.difficulty ?? "",
    target_age: g?.target_age ?? "",
    launch_mode: g?.launch_mode ?? "embedded",
    is_featured: g?.is_featured ?? false,
    status: g?.status ?? "draft",
    display_order: String(g?.display_order ?? 0),
  };
}

export function GameForm({ game, categories }: { game?: Game | null; categories: Category[] }) {
  const [state, formAction] = useActionState(saveGameAction, initialActionState);
  const [v, setV] = useState<Values>(() => toValues(game));
  const [upload, setUpload] = useState<{ busy: boolean; error: string }>({ busy: false, error: "" });
  const fe = state.fieldErrors ?? {};
  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((s) => ({ ...s, [k]: val }));

  async function onUpload(file: File | undefined) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setUpload({ busy: false, error: "File is larger than 4 MB." });
      return;
    }
    setUpload({ busy: true, error: "" });
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", "thumbnail");
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Upload failed.");
      set("thumbnail_url", j.url);
      setUpload({ busy: false, error: "" });
    } catch (e) {
      setUpload({ busy: false, error: e instanceof Error ? e.message : "Upload failed." });
    }
  }

  const err = (k: string) => (fe[k] ? <p id={`${k}-err`} className="field-error">{fe[k]}</p> : null);
  const aria = (k: string) => (fe[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-err` } : {});

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[1fr_320px]" noValidate>
      {game && <input type="hidden" name="id" value={game.id} />}
      <div className="space-y-5">
        {state.error && (
          <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">{state.error}</p>
        )}

        <fieldset className="glass space-y-4 p-5">
          <legend className="px-1 text-sm font-bold text-cyan-electric">1 · Basics</legend>
          <div>
            <label htmlFor="title" className="label">Game Title *</label>
            <input id="title" name="title" className="input" required maxLength={120} value={v.title} onChange={(e) => set("title", e.target.value)} {...aria("title")} />
            {err("title")}
          </div>
          <div>
            <label htmlFor="game_url" className="label">Game URL *</label>
            <input
              id="game_url"
              name="game_url"
              className="input font-mono"
              required
              inputMode="url"
              placeholder="https://example.com/my-game"
              value={v.game_url}
              onChange={(e) => set("game_url", e.target.value)}
              {...aria("game_url")}
            />
            <p className="mt-1 text-xs text-ink-muted">Must start with https:// (or /play/… for built-in games).</p>
            {err("game_url")}
          </div>
          <div>
            <label htmlFor="description" className="label">Short Description</label>
            <input id="description" name="description" className="input" maxLength={300} value={v.description} onChange={(e) => set("description", e.target.value)} {...aria("description")} />
            <p className="mt-1 text-xs text-ink-muted">{v.description.length}/300 — shown on game cards.</p>
            {err("description")}
          </div>
          <div>
            <label htmlFor="full_description" className="label">Full Description</label>
            <textarea id="full_description" name="full_description" rows={5} className="input" maxLength={5000} value={v.full_description} onChange={(e) => set("full_description", e.target.value)} {...aria("full_description")} />
            {err("full_description")}
          </div>
        </fieldset>

        <fieldset className="glass space-y-4 p-5">
          <legend className="px-1 text-sm font-bold text-cyan-electric">2 · Thumbnail</legend>
          <div className="grid items-start gap-4 sm:grid-cols-[160px_1fr]">
            <GameThumb src={v.thumbnail_url || null} alt="Thumbnail preview" className="aspect-[16/10] w-full rounded-xl border border-white/10" />
            <div className="space-y-3">
              <div>
                <label htmlFor="thumbnail_url" className="label">Thumbnail URL</label>
                <input id="thumbnail_url" name="thumbnail_url" className="input font-mono" inputMode="url" placeholder="https://…" value={v.thumbnail_url} onChange={(e) => set("thumbnail_url", e.target.value)} {...aria("thumbnail_url")} />
                {err("thumbnail_url")}
              </div>
              <div>
                <label htmlFor="thumb-file" className="label">…or upload an image (PNG, JPEG, WEBP, GIF · max 4 MB)</label>
                <input
                  id="thumb-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white"
                  onChange={(e) => onUpload(e.target.files?.[0])}
                  disabled={upload.busy}
                />
                {upload.busy && <p className="mt-1 text-xs text-cyan-electric" role="status">Uploading…</p>}
                {upload.error && <p className="field-error" role="alert">{upload.error}</p>}
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="glass grid gap-4 p-5 sm:grid-cols-2">
          <legend className="px-1 text-sm font-bold text-cyan-electric">3 · Organisation</legend>
          <div>
            <label htmlFor="category_id" className="label">Category</label>
            <select id="category_id" name="category_id" className="input" value={v.category_id} onChange={(e) => set("category_id", e.target.value)}>
              <option value="">— Uncategorized —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            {err("category_id")}
          </div>
          <div>
            <label htmlFor="tags" className="label">Tags</label>
            <input id="tags" name="tags" className="input" placeholder="music, rhythm, notes" value={v.tags} onChange={(e) => set("tags", e.target.value)} />
            <p className="mt-1 text-xs text-ink-muted">Comma-separated, max 10.</p>
          </div>
          <div>
            <label htmlFor="difficulty" className="label">Difficulty Level</label>
            <select id="difficulty" name="difficulty" className="input" value={v.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
              <option value="">— Not set —</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label htmlFor="target_age" className="label">Target Age Group</label>
            <input id="target_age" name="target_age" className="input" maxLength={40} placeholder="e.g. 7–12, 13+" value={v.target_age} onChange={(e) => set("target_age", e.target.value)} {...aria("target_age")} />
            {err("target_age")}
          </div>
          <div>
            <label htmlFor="display_order" className="label">Display Order</label>
            <input id="display_order" name="display_order" type="number" min={0} max={9999} className="input" value={v.display_order} onChange={(e) => set("display_order", e.target.value)} {...aria("display_order")} />
            <p className="mt-1 text-xs text-ink-muted">Lower numbers appear first.</p>
            {err("display_order")}
          </div>
          <div>
            <label htmlFor="slug" className="label">Slug (URL)</label>
            <input id="slug" name="slug" className="input font-mono" placeholder="auto from title" maxLength={80} value={v.slug} onChange={(e) => set("slug", e.target.value)} />
            <p className="mt-1 text-xs text-ink-muted">/games/{v.slug || "…"}</p>
          </div>
        </fieldset>

        <fieldset className="glass space-y-4 p-5">
          <legend className="px-1 text-sm font-bold text-cyan-electric">4 · Launch &amp; visibility</legend>
          <div role="radiogroup" aria-label="Launch Mode" className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["embedded", "Embedded", "Plays inside Playverse (iframe). If the site blocks embedding, players get an Open in New Tab option."],
                ["external", "External", "Opens the game website in a new tab with a “leaving Playverse” notice. Use for sites that block iframes or need camera/AR."],
              ] as const
            ).map(([val, label, hint]) => (
              <label key={val} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${v.launch_mode === val ? "chip-active" : "border-white/10"}`}>
                <input type="radio" name="launch_mode" value={val} checked={v.launch_mode === val} onChange={() => set("launch_mode", val)} className="mt-1" />
                <span>
                  <span className="block font-semibold">{label}</span>
                  <span className="block text-xs text-ink-muted">{hint}</span>
                </span>
              </label>
            ))}
          </div>
          {err("launch_mode")}
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="is_featured" checked={v.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="size-5" />
            <span>Featured — show in the Featured Games section</span>
          </label>
          {game && (
            <div>
              <label htmlFor="status" className="label">Published Status</label>
              <select id="status" name="status" className="input sm:max-w-xs" value={v.status} onChange={(e) => set("status", e.target.value as Values["status"])}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
            </div>
          )}
        </fieldset>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="glass space-y-3 p-5">
          <h2 className="font-bold">Actions</h2>
          {game && (
            <p className="flex items-center gap-2 text-sm">Current status: <StatusBadge status={game.status} /></p>
          )}
          <SubmitButton name="intent" value="preview" className="btn-cyan w-full" pendingText="Saving…">
            👁 {game ? "Save & Preview" : "Save Draft & Preview"}
          </SubmitButton>
          <SubmitButton name="intent" value="publish" className="btn-primary w-full" pendingText="Publishing…">
            🚀 {game?.status === "published" ? "Save & keep Published" : "Publish"}
          </SubmitButton>
          {game ? (
            <SubmitButton name="intent" value="save" className="btn-ghost w-full">💾 Save changes</SubmitButton>
          ) : (
            <SubmitButton name="intent" value="draft" className="btn-ghost w-full">💾 Save as Draft</SubmitButton>
          )}
          <Link href="/admin/games" className="block text-center text-sm text-white/70 hover:underline">Cancel</Link>
        </div>
        <div className="glass space-y-1 p-5 text-sm">
          <p className="text-ink-muted">Created Date</p>
          <p>{game ? formatDateTime(game.created_at) : "Set automatically on save"}</p>
          <p className="pt-2 text-ink-muted">Updated Date</p>
          <p>{game ? formatDateTime(game.updated_at) : "Set automatically on save"}</p>
          {game?.published_at && (
            <>
              <p className="pt-2 text-ink-muted">Last published</p>
              <p>{formatDateTime(game.published_at)}</p>
            </>
          )}
        </div>
      </aside>
    </form>
  );
}
