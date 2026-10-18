"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Paparan pautan laman web dalam Playverse (iframe bersandbox) dengan skrin penuh.
 * Hanya digunakan untuk laman yang membenarkan paparan terbenam (disemak semasa admin menyimpan).
 */
export function LinkViewer({ url, title }: { url: string; title: string }) {
  const [key, setKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [full, setFull] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loaded) return;
    const t = setTimeout(() => setSlow(true), 12000);
    return () => clearTimeout(t);
  }, [loaded, key]);

  useEffect(() => {
    if (!full) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    window.history.pushState({ dzImmersive: true }, "");
    const onPop = () => setFull(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    const onFs = () => {
      const d = document as Document & { webkitFullscreenElement?: Element | null };
      if (!document.fullscreenElement && !d.webkitFullscreenElement) setFull(false);
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
    return () => {
      root.style.overflow = prev;
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if (window.history.state?.dzImmersive) window.history.back();
    };
  }, [full]);

  const goFull = () => {
    setFull(true);
    const el = box.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    try {
      if (el && document.fullscreenEnabled) el.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
      else el?.webkitRequestFullscreen?.();
    } catch {
      /* mod imersif sahaja */
    }
  };

  return (
    <div className="space-y-3">
      <div
        ref={box}
        className={full ? "fixed inset-0 z-[300] h-[100dvh] w-screen bg-black" : "relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-cyan-electric/30 bg-white sm:aspect-video"}
        style={full ? { paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" } : undefined}
      >
        {full && (
          <button
            type="button"
            onClick={() => setFull(false)}
            className="absolute right-2 z-20 grid size-11 place-items-center rounded-full bg-black/60 text-lg text-white ring-1 ring-white/30"
            style={{ top: "calc(env(safe-area-inset-top) + 8px)" }}
            aria-label="Keluar skrin penuh"
          >
            ✕
          </button>
        )}
        <iframe
          key={key}
          src={url}
          title={title}
          className={full ? "block size-full border-0 bg-white" : "absolute inset-0 size-full border-0"}
          sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-modals"
          allow="fullscreen; autoplay; clipboard-write; midi"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)}
        />
        {!loaded && (
          <div className="absolute inset-0 grid place-items-center bg-space/90" role="status">
            <div className="flex flex-col items-center gap-3 p-4 text-center">
              <span className="size-12 animate-spin rounded-full border-4 border-cyan-electric/30 border-t-cyan-electric" />
              <p className="text-sm text-ink-muted">{slow ? "Laman mengambil masa untuk dimuatkan…" : "Memuatkan laman…"}</p>
              {slow && (
                <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  ↗ Buka di Tab Baharu
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary order-first" onClick={goFull}>
          ⛶ Skrin Penuh
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setLoaded(false);
            setSlow(false);
            setKey((k) => k + 1);
          }}
        >
          ↻ Muat Semula
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn-ghost">
          ↗ Buka di Tab Baharu
        </a>
      </div>
      <p className="text-xs text-ink-muted">Skrin kosong atau ralat? Tekan “Buka di Tab Baharu”.</p>
    </div>
  );
}
