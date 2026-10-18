"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveQuizAction } from "@/lib/actions/quiz";
import { initialActionState } from "@/lib/actions/state";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { MAX_QUESTIONS, TIME_LIMITS, type Question, type QuestionType, type Quiz } from "@/lib/quiz";

type Option = { id: string; name: string; depth: number; icon: string | null };
type Draft = { id: string; type: QuestionType; text: string; image_url: string; options: string[]; answer: number; explanation: string };

const LETTERS = ["A", "B", "C", "D"];
const OPTION_COLORS = ["border-rose-400/60", "border-sky-400/60", "border-amber-400/60", "border-violet-400/60"];

const newId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36))
    .replace(/-/g, "")
    .slice(0, 12);

function blank(type: QuestionType): Draft {
  return { id: newId(), type, text: "", image_url: "", options: type === "tf" ? ["Betul", "Salah", "", ""] : ["", "", "", ""], answer: 0, explanation: "" };
}

function fromQuestion(q: Question): Draft {
  const opts = [...q.options, "", "", "", ""].slice(0, 4);
  return { id: q.id, type: q.type, text: q.text, image_url: q.image_url ?? "", options: opts, answer: q.answer, explanation: q.explanation ?? "" };
}

export function QuizEditor({ quiz, subjects }: { quiz?: Quiz | null; subjects: Option[] }) {
  const [state, action] = useActionState(saveQuizAction, initialActionState);
  const [s, setS] = useState({
    title: quiz?.title ?? "",
    slug: quiz?.slug ?? "",
    description: quiz?.description ?? "",
    subject_id: quiz?.subject_id ?? "",
    time_limit: String(quiz?.time_limit ?? 20),
    shuffle: quiz?.shuffle ?? true,
    show_leaderboard: quiz?.show_leaderboard ?? true,
    display_order: String(quiz?.display_order ?? 0),
  });
  const [qs, setQs] = useState<Draft[]>(() => (quiz?.questions.length ? quiz.questions.map(fromQuestion) : [blank("mcq")]));
  const fe = state.fieldErrors ?? {};
  const setField = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((x) => ({ ...x, [k]: v }));
  const patch = (i: number, p: Partial<Draft>) => setQs((list) => list.map((q, j) => (j === i ? { ...q, ...p } : q)));
  const move = (i: number, d: -1 | 1) =>
    setQs((list) => {
      const j = i + d;
      if (j < 0 || j >= list.length) return list;
      const copy = [...list];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  const payload = JSON.stringify(
    qs.map((q) => ({
      id: q.id,
      type: q.type,
      text: q.text,
      image_url: q.image_url || null,
      options: q.type === "tf" ? ["Betul", "Salah"] : q.options,
      answer: q.answer,
      explanation: q.explanation || null,
    })),
  );
  const err = (k: string) => (fe[k] ? <p id={`${k}-err`} className="field-error">{fe[k]}</p> : null);

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_340px]" noValidate>
      {quiz && <input type="hidden" name="id" value={quiz.id} />}
      <input type="hidden" name="questions" value={payload} />

      <div className="space-y-5">
        {state.error && (
          <p className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">{state.error}</p>
        )}

        <fieldset className="glass space-y-4 p-5">
          <legend className="px-1 text-sm font-bold text-cyan-electric">1 · Maklumat kuiz</legend>
          <div>
            <label htmlFor="title" className="label">Tajuk kuiz *</label>
            <input id="title" name="title" className="input" maxLength={120} placeholder="cth. Kenali Keluarga Strings" value={s.title} onChange={(e) => setField("title", e.target.value)} aria-invalid={fe.title ? true : undefined} />
            {err("title")}
          </div>
          <div>
            <label htmlFor="description" className="label">Arahan / penerangan untuk murid</label>
            <textarea id="description" name="description" rows={2} className="input" maxLength={500} value={s.description} onChange={(e) => setField("description", e.target.value)} />
            {err("description")}
          </div>
        </fieldset>

        <section aria-labelledby="qhead" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="qhead" className="text-sm font-bold text-cyan-electric">
              2 · Soalan <span className="text-white/70">({qs.length}/{MAX_QUESTIONS})</span>
            </h2>
          </div>

          <ol className="space-y-4">
            {qs.map((q, i) => (
              <li key={q.id} className={`glass space-y-4 p-4 sm:p-5 ${fe[`q${i}`] ? "border-red-400/60" : ""}`} aria-label={`Soalan ${i + 1}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-bold">
                    <span className="grid size-8 place-items-center rounded-full bg-gold text-sm text-space">{i + 1}</span>
                    {q.type === "tf" ? "Betul / Salah" : "Aneka pilihan"}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <select
                      aria-label={`Jenis soalan ${i + 1}`}
                      className="input !min-h-9 !w-auto !py-1 text-xs"
                      value={q.type}
                      onChange={(e) => {
                        const type = e.target.value as QuestionType;
                        patch(i, type === "tf" ? { type, answer: Math.min(q.answer, 1) } : { type, options: q.options.map((o, k) => (q.type === "tf" && k < 2 ? "" : o)) });
                      }}
                    >
                      <option value="mcq">Aneka pilihan</option>
                      <option value="tf">Betul / Salah</option>
                    </select>
                    <button type="button" className="btn-ghost !min-h-9 !px-2.5 text-xs" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Naikkan soalan ${i + 1}`}>↑</button>
                    <button type="button" className="btn-ghost !min-h-9 !px-2.5 text-xs" onClick={() => move(i, 1)} disabled={i === qs.length - 1} aria-label={`Turunkan soalan ${i + 1}`}>↓</button>
                    <button
                      type="button"
                      className="btn-ghost !min-h-9 !px-2.5 text-xs"
                      disabled={qs.length >= MAX_QUESTIONS}
                      onClick={() => setQs((l) => [...l.slice(0, i + 1), { ...q, id: newId() }, ...l.slice(i + 1)])}
                    >
                      ⧉ Salin
                    </button>
                    <button type="button" className="btn-ghost !min-h-9 !px-2.5 text-xs text-red-300" onClick={() => setQs((l) => l.filter((_, j) => j !== i))}>
                      ✕ Buang
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor={`qt-${q.id}`} className="label">Soalan</label>
                  <textarea id={`qt-${q.id}`} rows={2} className="input" maxLength={400} placeholder="cth. Alat muzik manakah paling besar dalam keluarga strings?" value={q.text} onChange={(e) => patch(i, { text: e.target.value })} />
                </div>

                <details className="rounded-xl border border-white/10 p-3" open={Boolean(q.image_url)}>
                  <summary className="cursor-pointer text-sm text-white/80">🖼️ Gambar (pilihan) — cth. notasi, alat muzik</summary>
                  <div className="mt-3">
                    <ImageUploadField
                      id={`qi-${q.id}`}
                      name={`qimg-${q.id}`}
                      label="Muat naik gambar soalan"
                      hint="PNG/JPG/WEBP ≤ 4 MB. Gambar diproses semula & dikecilkan."
                      kind="question"
                      value={q.image_url}
                      onChange={(v) => patch(i, { image_url: v })}
                      previewClass="aspect-[4/3] w-36 rounded-xl"
                    />
                  </div>
                </details>

                {q.type === "tf" ? (
                  <fieldset>
                    <legend className="label">Jawapan betul</legend>
                    <div className="grid grid-cols-2 gap-3">
                      {["Betul", "Salah"].map((label, k) => (
                        <label key={label} className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 font-bold ${q.answer === k ? (k === 0 ? "border-emerald-400 bg-emerald-500/15" : "border-rose-400 bg-rose-500/15") : "border-white/15"}`}>
                          <input type="radio" name={`ans-${q.id}`} checked={q.answer === k} onChange={() => patch(i, { answer: k })} className="accent-cyan-400" />
                          {k === 0 ? "✓" : "✗"} {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ) : (
                  <fieldset>
                    <legend className="label">Pilihan jawapan — tandakan ● jawapan betul (2–4 pilihan)</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.options.map((o, k) => (
                        <div key={k} className={`flex items-center gap-2 rounded-xl border-2 bg-space p-1.5 pl-3 ${q.answer === k ? "border-emerald-400" : OPTION_COLORS[k]}`}>
                          <input
                            type="radio"
                            name={`ans-${q.id}`}
                            aria-label={`Pilihan ${LETTERS[k]} ialah jawapan betul`}
                            checked={q.answer === k}
                            onChange={() => patch(i, { answer: k })}
                            className="size-4 shrink-0 accent-emerald-400"
                          />
                          <span className="font-bold text-white/70">{LETTERS[k]}</span>
                          <input
                            aria-label={`Soalan ${i + 1} pilihan ${LETTERS[k]}`}
                            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-ink-muted/60"
                            maxLength={150}
                            placeholder={k < 2 ? "Wajib" : "Pilihan (boleh kosong)"}
                            value={o}
                            onChange={(e) => patch(i, { options: q.options.map((x, j) => (j === k ? e.target.value : x)) })}
                          />
                        </div>
                      ))}
                    </div>
                  </fieldset>
                )}

                <div>
                  <label htmlFor={`qe-${q.id}`} className="label">Penerangan jawapan (dipaparkan selepas murid menjawab)</label>
                  <input id={`qe-${q.id}`} className="input" maxLength={300} placeholder="cth. Double bass ialah alat paling besar dan paling rendah nadanya." value={q.explanation} onChange={(e) => patch(i, { explanation: e.target.value })} />
                </div>
                {fe[`q${i}`] && <p className="field-error" role="alert">{fe[`q${i}`]}</p>}
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-cyan" disabled={qs.length >= MAX_QUESTIONS} onClick={() => setQs((l) => [...l, blank("mcq")])}>
              ＋ Soalan Aneka Pilihan
            </button>
            <button type="button" className="btn-ghost" disabled={qs.length >= MAX_QUESTIONS} onClick={() => setQs((l) => [...l, blank("tf")])}>
              ＋ Soalan Betul / Salah
            </button>
          </div>
        </section>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
        <fieldset className="glass space-y-4 p-5">
          <legend className="px-1 text-sm font-bold text-cyan-electric">3 · Tetapan permainan</legend>
          <div>
            <label htmlFor="time_limit" className="label">Masa setiap soalan</label>
            <select id="time_limit" name="time_limit" className="input" value={s.time_limit} onChange={(e) => setField("time_limit", e.target.value)}>
              {TIME_LIMITS.map((t) => (
                <option key={t} value={t}>{t} saat</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subject_id" className="label">Subjek (pilihan)</label>
            <select id="subject_id" name="subject_id" className="input" value={s.subject_id} onChange={(e) => setField("subject_id", e.target.value)}>
              <option value="">— Tiada —</option>
              {subjects.map((o) => (
                <option key={o.id} value={o.id}>
                  {"— ".repeat(o.depth)}
                  {o.icon} {o.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-muted">Kuiz akan dipaparkan juga di halaman subjek dan video berkaitan.</p>
            {err("subject_id")}
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="shuffle" checked={s.shuffle} onChange={(e) => setField("shuffle", e.target.checked)} className="mt-1 size-4 accent-cyan-400" />
            <span>Kocok susunan soalan & pilihan jawapan</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="show_leaderboard" checked={s.show_leaderboard} onChange={(e) => setField("show_leaderboard", e.target.checked)} className="mt-1 size-4 accent-cyan-400" />
            <span>Papar papan skor kepada murid</span>
          </label>
          <details className="text-sm">
            <summary className="cursor-pointer text-white/70">Lanjutan</summary>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="slug" className="label">Slug (pautan)</label>
                <input id="slug" name="slug" className="input font-mono" placeholder="auto" value={s.slug} onChange={(e) => setField("slug", e.target.value)} />
              </div>
              <div>
                <label htmlFor="display_order" className="label">Susunan</label>
                <input id="display_order" name="display_order" type="number" min={0} max={9999} className="input" value={s.display_order} onChange={(e) => setField("display_order", e.target.value)} />
              </div>
            </div>
          </details>
          <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
            <SubmitButton name="intent" value="publish" className="btn-primary w-full" pendingText="Menerbitkan…">
              🚀 Terbitkan Kuiz
            </SubmitButton>
            <SubmitButton name="intent" value="draft" className="btn-ghost w-full" pendingText="Menyimpan…">
              💾 Simpan Draf
            </SubmitButton>
            <Link href="/admin/kuiz" className="btn-ghost w-full">Batal</Link>
          </div>
          {quiz?.status === "published" && <p className="text-xs text-emerald-300">Kuiz ini sedang diterbitkan.</p>}
        </fieldset>
      </aside>
    </form>
  );
}
