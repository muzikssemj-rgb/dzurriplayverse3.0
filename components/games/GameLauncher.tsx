"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { pushRecent } from "@/lib/client-storage";
import { ReportDialog } from "@/components/games/ReportDialog";

type LauncherGame = {
  id: string;
  title: string;
  slug: string;
  game_url: string;
  launch_mode: "embedded" | "external";
};

type Phase = "checking" | "loading" | "ready" | "slow" | "blocked" | "offline";

const LOAD_TIMEOUT_MS = 15000;

/**
 * Pelancar permainan:
 *  - Embedded: iframe (sandbox) — disemak dahulu sama ada laman sumber membenarkan
 *    embedding (X-Frame-Options / CSP). Jika disekat, kita TIDAK memintasnya;
 *    pengguna diberi pilihan membuka di tab baharu.
 *  - External: amaran meninggalkan platform + butang Open Game.
 */
export function GameLauncher({ game, preview = false }: { game: LauncherGame; preview?: boolean }) {
  const isInternal = game.game_url.startsWith("/");
  const [phase, setPhase] = useState<Phase>("checking");
  const [blockReason, setBlockReason] = useState<string | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [immersive, setImmersive] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Rekod main (sekali setiap sesi pelayar) & senarai "baru dimainkan"
  useEffect(() => {
    if (preview) return;
    pushRecent(game.id);
    try {
      const key = `dz:played:${game.id}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* abaikan */
    }
    fetch(`/api/games/${game.id}/play`, { method: "POST" }).catch(() => {});
  }, [game.id, preview]);

  // Mod skrin penuh: guna Fullscreen API jika ada (Android, iPad, desktop); jika tidak
  // (iPhone / sesetengah PWA), guna "mod imersif" — permainan memenuhi seluruh skrin aplikasi.
  useEffect(() => {
    if (!immersive) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    // Butang "Back" telefon menutup skrin penuh, bukan meninggalkan halaman
    window.history.pushState({ dzImmersive: true }, "");
    const onPop = () => setImmersive(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setImmersive(false);
    const onFsChange = () => {
      const d = document as Document & { webkitFullscreenElement?: Element | null };
      if (!document.fullscreenElement && !d.webkitFullscreenElement) setImmersive(false);
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      root.style.overflow = prevOverflow;
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      const d = document as Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void };
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else if (d.webkitFullscreenElement) d.webkitExitFullscreen?.();
      if (window.history.state?.dzImmersive) window.history.back();
    };
  }, [immersive]);

  const startLoading = useCallback(() => {
    if (!isInternal && !navigator.onLine) {
      setPhase("offline");
      return;
    }
    setPhase("loading");
  }, [isInternal]);

  // Semakan polisi embedding
  useEffect(() => {
    if (game.launch_mode !== "embedded") return;
    if (isInternal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startLoading();
      return;
    }
    let cancelled = false;
    fetch(`/api/games/${game.id}/embed-check${preview ? "?preview=1" : ""}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { embeddable: true }))
      .then((res: { embeddable: boolean; reason?: string | null }) => {
        if (cancelled) return;
        if (res.embeddable === false) {
          setBlockReason(res.reason ?? null);
          setPhase("blocked");
        } else startLoading();
      })
      .catch(() => !cancelled && startLoading());
    return () => {
      cancelled = true;
    };
  }, [game.id, game.launch_mode, isInternal, preview, startLoading]);

  // Pemasa muatan perlahan
  useEffect(() => {
    if (phase !== "loading") return;
    const t = window.setTimeout(() => setPhase((p) => (p === "loading" ? "slow" : p)), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [phase, frameKey]);

  const reload = () => {
    setFrameKey((k) => k + 1);
    startLoading();
  };

  const enterFullscreen = () => {
    const el = boxRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    setImmersive(true);
    if (!el) return;
    // Mesti dipanggil terus dalam gesture pengguna
    try {
      if (document.fullscreenEnabled && el.requestFullscreen) {
        el.requestFullscreen({ navigationUI: "hide" }).catch(() => {
          /* tidak dibenarkan → kekal dalam mod imersif */
        });
      } else el.webkitRequestFullscreen?.();
    } catch {
      /* mod imersif sahaja */
    }
  };

  const openHref = game.game_url;
  const toolbar = (
    <div className="flex flex-wrap gap-2">
      <Link href={preview ? "/admin/games" : "/games"} className="btn-ghost">
        ‹ {preview ? "Back to Admin" : "Back to Games"}
      </Link>
      {game.launch_mode === "embedded" && phase !== "blocked" && (
        <button type="button" className="btn-ghost" onClick={reload}>
          ↻ Reload Game
        </button>
      )}
      {game.launch_mode === "embedded" && phase !== "blocked" && phase !== "offline" && (
        <button type="button" className="btn-primary order-first" onClick={enterFullscreen}>
          ⛶ Play Fullscreen
        </button>
      )}
      <a href={openHref} target="_blank" rel="noopener noreferrer" className="btn-ghost">
        ↗ Open in New Tab
      </a>
      {!preview && <ReportDialog gameId={game.id} />}
    </div>
  );

  if (game.launch_mode === "external") {
    return (
      <div className="space-y-4">
        <div className="glass neon-border flex flex-col items-center gap-4 p-8 text-center">
          <span className="text-5xl" aria-hidden="true">🚀</span>
          <h2 className="text-xl font-bold">This game opens on an external website</h2>
          <p className="max-w-md text-sm text-ink-muted">
            You are about to leave DZURRI PLAYVERSE and open <strong className="text-white">{hostOf(openHref)}</strong> in a new
            tab. An internet connection is required.
          </p>
          <a href={openHref} target="_blank" rel="noopener noreferrer" className="btn-primary">
            ▶ Open Game
          </a>
        </div>
        {toolbar}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={boxRef}
        className={
          immersive
            ? "fixed inset-0 z-[300] h-[100dvh] w-screen overflow-hidden bg-black"
            : "relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-cyan-electric/30 bg-black sm:aspect-video"
        }
        style={immersive ? { paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" } : undefined}
      >
        {immersive && (
          <button
            type="button"
            onClick={() => setImmersive(false)}
            className="absolute right-2 z-20 grid size-11 place-items-center rounded-full bg-black/60 text-lg text-white ring-1 ring-white/30 backdrop-blur hover:bg-black/80"
            style={{ top: "calc(env(safe-area-inset-top) + 8px)" }}
            aria-label="Exit fullscreen"
          >
            ✕
          </button>
        )}
        {(phase === "loading" || phase === "slow" || phase === "ready") && (
          <iframe
            key={frameKey}
            ref={frameRef}
            src={game.game_url}
            title={game.title}
            className={immersive ? "relative block size-full border-0" : "absolute inset-0 size-full border-0"}
            sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox"
            allow="fullscreen; autoplay; gamepad"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            loading="eager"
            onLoad={() => setPhase("ready")}
          />
        )}

        {(phase === "checking" || phase === "loading") && (
          <div className="absolute inset-0 grid place-items-center bg-space/90" role="status" aria-live="polite">
            <div className="flex flex-col items-center gap-3">
              <span className="size-12 animate-spin rounded-full border-4 border-cyan-electric/30 border-t-cyan-electric" />
              <p className="text-sm text-ink-muted">{phase === "checking" ? "Preparing game…" : "Loading game…"}</p>
            </div>
          </div>
        )}

        {phase === "slow" && (
          <div className="absolute inset-x-3 bottom-3 rounded-xl bg-space/95 p-3 text-sm shadow-lg" role="status">
            The game is taking a while to load. If the screen stays blank, try <button className="underline" onClick={reload}>reloading</button>{" "}
            or <a className="underline" href={openHref} target="_blank" rel="noopener noreferrer">open it in a new tab</a>.
          </div>
        )}

        {phase === "blocked" && (
          <Overlay
            icon="🛡️"
            title="This game can't be shown inside DZURRI PLAYVERSE"
            body={`The game's website does not allow embedding${blockReason ? ` (${blockReason})` : ""}. You can still play it in a new tab.`}
            href={openHref}
          />
        )}

        {phase === "offline" && (
          <Overlay
            icon="📡"
            title="You're offline"
            body="This game is hosted online and needs an internet connection. Reconnect and press Reload."
            onRetry={reload}
          />
        )}
      </div>
      {toolbar}
    </div>
  );
}

function Overlay({ icon, title, body, href, onRetry }: { icon: string; title: string; body: string; href?: string; onRetry?: () => void }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-space/95 p-6 text-center" role="alert">
      <div className="max-w-md space-y-3">
        <span className="text-5xl" aria-hidden="true">{icon}</span>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-ink-muted">{body}</p>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="btn-primary">
            ↗ Open Game in New Tab
          </a>
        )}
        {onRetry && (
          <button className="btn-cyan" onClick={onRetry}>
            ↻ Try again
          </button>
        )}
      </div>
    </div>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "the game website";
  }
}
