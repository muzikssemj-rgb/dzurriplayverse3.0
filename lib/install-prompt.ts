"use client";

/**
 * Menangkap peristiwa `beforeinstallprompt` (Chrome/Edge/Samsung Internet/Opera)
 * seawal mungkin, dan menyediakan maklumat platform untuk panduan pemasangan manual.
 */
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: BIPEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BIPEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    emit();
  });
}

export function subscribeInstall(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export type InstallState = "installed" | "promptable" | "manual";

export function getInstallState(): InstallState {
  if (typeof window === "undefined") return "manual";
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (installed || standalone) return "installed";
  if (deferred) return "promptable";
  return "manual";
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable";
  const ev = deferred;
  deferred = null;
  await ev.prompt();
  const choice = await ev.userChoice;
  emit();
  return choice.outcome;
}

export type Platform = "ios" | "ipados" | "android" | "macos-safari" | "firefox-desktop" | "desktop-chromium" | "other";

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isIPad = /iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIPad) return "ipados";
  if (/iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Firefox\//.test(ua)) return "firefox-desktop";
  if (/Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua)) return "macos-safari";
  if (/Chrome|Chromium|Edg\//.test(ua)) return "desktop-chromium";
  return "other";
}
