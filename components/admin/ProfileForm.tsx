"use client";

import { useActionState, useState } from "react";
import { saveProfileAction } from "@/lib/actions/profile";
import { initialActionState } from "@/lib/actions/state";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { CreatorProfile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: CreatorProfile }) {
  const [state, action] = useActionState(saveProfileAction, initialActionState);
  const [v, setV] = useState({
    name: profile.name,
    title: profile.title,
    bio: profile.bio,
    quote: profile.quote,
    photo_url: profile.photo_url ?? "",
    hero_url: profile.hero_url ?? "",
  });
  const fe = state.fieldErrors ?? {};
  const set = (k: keyof typeof v) => (val: string) => setV((s) => ({ ...s, [k]: val }));

  return (
    <form action={action} className="space-y-6">
      <fieldset className="glass space-y-4 p-5">
        <legend className="px-1 text-sm font-bold text-cyan-electric">Gambar pencipta</legend>
        <ImageUploadField
          id="photo"
          name="photo_url"
          kind="photo"
          label="Foto profil (muka anda)"
          hint="PNG/JPEG/WEBP ≤ 4 MB. Dipotong segi empat 600×600 secara automatik. Dipaparkan di halaman Creator & footer."
          value={v.photo_url}
          onChange={set("photo_url")}
        />
        {fe.photo_url && <p className="field-error">{fe.photo_url}</p>}
      </fieldset>

      <fieldset className="glass space-y-4 p-5">
        <legend className="px-1 text-sm font-bold text-cyan-electric">Imej hero halaman utama</legend>
        <ImageUploadField
          id="hero"
          name="hero_url"
          kind="hero"
          label="Watak kartun / imej hero anda"
          hint="Disyorkan: kartun 3D diri anda (cth. dijana dengan ChatGPT/Gemini daripada foto anda), latar gelap atau lutsinar. Jika kosong, foto profil digunakan."
          value={v.hero_url}
          onChange={set("hero_url")}
          previewClass="aspect-square w-40 rounded-3xl"
        />
        {fe.hero_url && <p className="field-error">{fe.hero_url}</p>}
      </fieldset>

      <fieldset className="glass grid gap-4 p-5 sm:grid-cols-2">
        <legend className="px-1 text-sm font-bold text-cyan-electric">Profil untuk pengguna</legend>
        <div>
          <label htmlFor="name" className="label">Nama *</label>
          <input id="name" name="name" className="input" maxLength={60} value={v.name} onChange={(e) => set("name")(e.target.value)} />
          {fe.name && <p className="field-error">{fe.name}</p>}
        </div>
        <div>
          <label htmlFor="title" className="label">Peranan / gelaran</label>
          <input id="title" name="title" className="input" maxLength={80} value={v.title} onChange={(e) => set("title")(e.target.value)} placeholder="Creator · Educator · Game Developer" />
          {fe.title && <p className="field-error">{fe.title}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="bio" className="label">Profil ringkas</label>
          <textarea id="bio" name="bio" rows={6} className="input" maxLength={2000} value={v.bio} onChange={(e) => set("bio")(e.target.value)} />
          <p className="mt-1 text-xs text-ink-muted">{v.bio.length}/2000 — baris baharu dikekalkan.</p>
          {fe.bio && <p className="field-error">{fe.bio}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="quote" className="label">Petikan / moto</label>
          <input id="quote" name="quote" className="input" maxLength={200} value={v.quote} onChange={(e) => set("quote")(e.target.value)} />
          {fe.quote && <p className="field-error">{fe.quote}</p>}
        </div>
      </fieldset>

      {state.error && <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">{state.error}</p>}
      {state.message && <p className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200" role="status">{state.message}</p>}
      <SubmitButton className="btn-primary">💾 Simpan profil</SubmitButton>
    </form>
  );
}
