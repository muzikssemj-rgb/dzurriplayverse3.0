"use client";

import { useEffect, useState } from "react";

/**
 * Mendaftar service worker & mengendalikan kemas kini versi:
 * apabila versi baharu sedia (status "waiting"), paparkan toast "Update".
 * Pengguna menekan "Reload" → SKIP_WAITING → halaman dimuat semula sekali.
 */
export function ServiceWorkerRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const syncOnline = () => setOffline(!navigator.onLine);
    syncOnline();
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);

    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return () => {
        window.removeEventListener("online", syncOnline);
        window.removeEventListener("offline", syncOnline);
      };
    }
    let refreshing = false;
    // Muat semula HANYA apabila versi lama digantikan (bukan semasa pemasangan pertama,
    // di mana clients.claim() juga mencetuskan controllerchange).
    const hadController = Boolean(navigator.serviceWorker.controller);
    const onControllerChange = () => {
      if (refreshing || !hadController) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          sw?.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) setWaiting(sw);
          });
        });
        // Semak kemas kini setiap 30 minit & apabila tab kembali aktif
        const check = () => reg.update().catch(() => {});
        const interval = window.setInterval(check, 30 * 60 * 1000);
        const onVis = () => document.visibilityState === "visible" && check();
        document.addEventListener("visibilitychange", onVis);
        return () => {
          window.clearInterval(interval);
          document.removeEventListener("visibilitychange", onVis);
        };
      })
      .catch(() => {});

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, []);

  return (
    <>
      {offline && (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-[90] bg-gold px-4 py-1.5 text-center text-xs font-semibold text-space"
        >
          You are offline. Showing saved content — external games and the latest game list need an internet connection.
        </div>
      )}
      {waiting && (
        <div
          role="alert"
          className="glass neon-border fixed bottom-24 left-1/2 z-[95] flex w-[min(92vw,420px)] -translate-x-1/2 items-center gap-3 p-3 md:bottom-6"
        >
          <p className="flex-1 text-sm">A new version of DZURRI PLAYVERSE is available.</p>
          <button className="btn-cyan" onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}>
            Reload
          </button>
        </div>
      )}
    </>
  );
}
