"use client";

import { useState } from "react";

const REASONS = [
  { value: "not_loading", label: "Permainan tidak dapat dimuatkan" },
  { value: "blocked_embed", label: "Disekat / enggan bersambung" },
  { value: "wrong_content", label: "Kandungan salah atau tidak sesuai" },
  { value: "other", label: "Lain-lain" },
];

export function ReportDialog({ gameId, disabled }: { gameId: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("sending");
    setError("");
    try {
      const res = await fetch(`/api/games/${gameId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: fd.get("reason"), message: fd.get("message") || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Laporan tidak dapat dihantar.");
      }
      setState("sent");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Laporan tidak dapat dihantar.");
    }
  }

  return (
    <>
      <button type="button" className="btn-ghost" onClick={() => setOpen(true)} disabled={disabled} aria-haspopup="dialog">
        ⚑ Laporkan Pautan Rosak
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-title"
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <div className="glass neon-border w-full max-w-md p-5">
            <h2 id="report-title" className="mb-3 text-lg font-bold">Laporkan pautan rosak</h2>
            {state === "sent" ? (
              <div className="space-y-4">
                <p className="text-sm text-emerald-300" role="status">Terima kasih! Laporan telah dihantar kepada pencipta.</p>
                <button className="btn-cyan w-full" onClick={() => setOpen(false)} autoFocus>Tutup</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <fieldset className="space-y-2">
                  <legend className="label">Apakah masalahnya?</legend>
                  {REASONS.map((r, i) => (
                    <label key={r.value} className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-3 text-sm">
                      <input type="radio" name="reason" value={r.value} defaultChecked={i === 0} required autoFocus={i === 0} />
                      {r.label}
                    </label>
                  ))}
                </fieldset>
                <div>
                  <label htmlFor="report-msg" className="label">Butiran (pilihan)</label>
                  <textarea id="report-msg" name="message" maxLength={500} rows={3} className="input" />
                </div>
                {state === "error" && <p className="field-error" role="alert">{error}</p>}
                <div className="flex gap-2">
                  <button type="button" className="btn-ghost flex-1" onClick={() => setOpen(false)}>Batal</button>
                  <button type="submit" className="btn-cyan flex-1" disabled={state === "sending"}>
                    {state === "sending" ? "Menghantar…" : "Hantar laporan"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
