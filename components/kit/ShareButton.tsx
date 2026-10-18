"use client";

import { useState } from "react";

/** Kongsi pautan (Web Share di telefon; salin ke papan klip di komputer) — guru hantar ke murid. */
export function ShareButton({ title, path, label = "Kongsi kepada murid" }: { title: string; path: string; label?: string }) {
  const [done, setDone] = useState(false);
  async function share() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch {
      /* pengguna batalkan */
    }
  }
  return (
    <button type="button" className="btn-ghost" onClick={share}>
      {done ? "✓ Pautan disalin" : `🔗 ${label}`}
    </button>
  );
}
