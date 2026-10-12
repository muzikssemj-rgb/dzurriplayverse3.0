"use client";

import { useEffect, useState } from "react";

/** Skrin pembuka ringkas apabila aplikasi dilancarkan sebagai PWA (sekali setiap sesi). */
export function SplashScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let standalone = false;
    try {
      standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (!standalone || sessionStorage.getItem("dz:splash")) return;
      sessionStorage.setItem("dz:splash", "1");
    } catch {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bergantung pada API pelayar selepas hidrasi
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 1100);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) return null;
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 bg-space transition-opacity"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" width={112} height={112} className="animate-float rounded-3xl" />
      <p className="font-display text-xl font-black tracking-widest text-gradient">DZURRI PLAYVERSE</p>
      <p className="text-xs tracking-[0.3em] text-ink-muted">GAMIFIKASI DALAM PENDIDIKAN MUZIK</p>
    </div>
  );
}
