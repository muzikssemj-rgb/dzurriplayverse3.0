"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveVideoAction } from "@/lib/actions/kit";
import { initialActionState } from "@/lib/actions/state";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { linkInfo, parseYouTubeUrl, resourceHref, ytThumb, type Video } from "@/lib/kit";

type Option = { id: string; name: string; depth: number; icon: string | null };

export function VideoForm({ video, subjects, defaultSubject = "" }: { video?: Video | null; subjects: Option[]; defaultSubject?: string }) {
  const [state, action] = useActionState(saveVideoAction, initialActionState);
  const [v, setV] = useState({
    url: video ? resourceHref(video) : "",
    thumbnail_url: video?.kind === "link" ? (video.thumbnail_url ?? "") : "",
    open_mode: video?.kind === "link" ? video.open_mode : "auto",
    title: video?.title ?? "",
    description: video?.description ?? "",
    subject_id: video?.subject_id ?? defaultSubject,
    display_order: String(video?.display_order ?? 0),
    status: video?.status ?? "published",
  });
  const fe = state.fieldErrors ?? {};
  const set = (k: keyof typeof v, val: string) => setV((s) => ({ ...s, [k]: val }));
  const yt = parseYouTubeUrl(v.url);
  const isLink = !yt && /^https:\/\/[^\s/]+\.[^\s]+/i.test(v.url.trim());
  const li = isLink ? linkInfo(v.url.trim()) : null;
  const err = (k: string) => (fe[k] ? <p id={`${k}-err`} className="field-error">{fe[k]}</p> : null);
  const aria = (k: string) => (fe[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-err` } : {});

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_360px]" noValidate>
      {video && <input type="hidden" name="id" value={video.id} />}
      <div className="space-y-5">
        {state.error && (
          <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">{state.error}</p>
        )}
        <fieldset className="glass space-y-4 p-5">
          <legend className="px-1 text-sm font-bold text-cyan-electric">Bahan pembelajaran</legend>
          <div>
            <label htmlFor="url" className="label">Pautan (YouTube atau laman web) *</label>
            <input
              id="url"
              name="url"
              className="input font-mono"
              inputMode="url"
              placeholder="https://youtu.be/…  ·  https://claude.ai/public/artifacts/…  ·  https://laman.com/…"
              value={v.url}
              onChange={(e) => set("url", e.target.value)}
              {...aria("url")}
            />
            <p className="mt-1 text-xs text-ink-muted">
              <strong>YouTube</strong>: salin dari butang Share (Shorts & masa mula &t=90s diterima). <strong>Laman web / artifak Claude</strong>: tampal pautan awam
              (Publish → salin pautan). Pautan peribadi yang memerlukan log masuk tidak boleh dibuka oleh murid.
            </p>
            {v.url && (yt || li) && (
              <p className="mt-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold" role="status">
                {yt ? "▶ Dikesan: Video YouTube" : `${li!.icon} Dikesan: ${li!.label} · ${li!.host}`}
              </p>
            )}
            {v.url && !yt && !isLink && <p className="field-error">Pautan mesti bermula dengan https://</p>}
            {err("url")}
          </div>
          <div>
            <label htmlFor="title" className="label">Tajuk</label>
            <input id="title" name="title" className="input" maxLength={150} placeholder="Kosongkan untuk guna tajuk asal dari YouTube / laman" value={v.title} onChange={(e) => set("title", e.target.value)} {...aria("title")} />
            {err("title")}
          </div>
          {isLink && (
            <>
              <div>
                <label htmlFor="open_mode" className="label">Cara murid membuka pautan</label>
                <select id="open_mode" name="open_mode" className="input" value={v.open_mode} onChange={(e) => set("open_mode", e.target.value)}>
                  <option value="auto">Automatik — semak sama ada laman membenarkan dipaparkan dalam Playverse</option>
                  <option value="embed">Paparkan dalam Playverse (dengan butang skrin penuh)</option>
                  <option value="tab">Buka di tab baharu</option>
                </select>
                <p className="mt-1 text-xs text-ink-muted">Artifak Claude dan banyak laman besar tidak membenarkan paparan dalam laman lain, jadi ia akan dibuka di tab baharu.</p>
              </div>
              <ImageUploadField
                id="thumb"
                name="thumbnail_url"
                label="Gambar kad (pilihan)"
                hint="Kosongkan untuk guna gambar laman itu sendiri (jika ada)."
                kind="thumbnail"
                value={v.thumbnail_url}
                onChange={(val) => set("thumbnail_url", val)}
                previewClass="aspect-video w-40 rounded-xl"
              />
            </>
          )}
          <div>
            <label htmlFor="description" className="label">Nota untuk murid</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="input"
              maxLength={1500}
              placeholder="cth. Tonton cara memegang bow violin, kemudian cuba di rumah."
              value={v.description}
              onChange={(e) => set("description", e.target.value)}
              {...aria("description")}
            />
            {err("description")}
          </div>
        </fieldset>
      </div>

      <aside className="space-y-5">
        <div className="glass overflow-hidden">
          <div className="relative aspect-video bg-space">
            {yt ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ytThumb(yt.id)} alt="Pratonton video" className="size-full object-cover" />
            ) : li ? (
              v.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnail_url} alt="Pratonton pautan" className="size-full object-cover" />
              ) : (
                <span className="grid size-full place-items-center bg-gradient-to-br from-galaxy/40 to-cyan-electric/20 text-6xl" aria-label="Pratonton pautan">
                  {li.icon}
                </span>
              )
            ) : (
              <span className="grid size-full place-items-center p-4 text-center text-sm text-ink-muted">Pratonton muncul selepas pautan ditampal</span>
            )}
            {yt && <span className="absolute inset-0 grid place-items-center text-5xl drop-shadow-lg" aria-hidden="true">▶️</span>}
          </div>
          {yt && (
            <p className="p-3 text-xs text-ink-muted">
              ID video: <code className="text-white">{yt.id}</code>
              {yt.start > 0 && ` · mula pada ${yt.start}s`}
            </p>
          )}
        </div>

        <fieldset className="glass space-y-4 p-5">
          <legend className="px-1 text-sm font-bold text-cyan-electric">Penerbitan</legend>
          <div>
            <label htmlFor="subject_id" className="label">Subjek *</label>
            <select id="subject_id" name="subject_id" className="input" value={v.subject_id} onChange={(e) => set("subject_id", e.target.value)} {...aria("subject_id")}>
              <option value="">— Pilih subjek —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {"— ".repeat(s.depth)}
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-muted">
              Tiada subjek sesuai? <Link href="/admin/kit/subjek" className="text-cyan-electric underline">Tambah subjek</Link>.
            </p>
            {err("subject_id")}
          </div>
          <div>
            <label htmlFor="status" className="label">Status</label>
            <select id="status" name="status" className="input" value={v.status} onChange={(e) => set("status", e.target.value)}>
              <option value="published">Diterbitkan (murid boleh buka)</option>
              <option value="draft">Draf (tersembunyi)</option>
            </select>
          </div>
          <div>
            <label htmlFor="display_order" className="label">Susunan</label>
            <input id="display_order" name="display_order" type="number" min={0} max={9999} className="input" value={v.display_order} onChange={(e) => set("display_order", e.target.value)} />
            <p className="mt-1 text-xs text-ink-muted">Nombor kecil dipaparkan dahulu.</p>
          </div>
          <div className="flex flex-col gap-2">
            <SubmitButton className="btn-primary w-full" pendingText="Menyemak & menyimpan…">
              💾 Simpan Bahan
            </SubmitButton>
            <Link href="/admin/kit" className="btn-ghost w-full">Batal</Link>
          </div>
        </fieldset>
      </aside>
    </form>
  );
}
