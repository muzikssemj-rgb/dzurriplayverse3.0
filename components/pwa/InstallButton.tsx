"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { getInstallState, promptInstall, subscribeInstall, detectPlatform } from "@/lib/install-prompt";
import { InstallGuide } from "@/components/pwa/InstallGuide";

/**
 * Butang Install App:
 *  - sudah dipasang  → label "Installed" (tidak boleh diklik)
 *  - prompt tersedia → paparkan dialog pemasangan pelayar
 *  - selain itu      → paparkan panduan manual mengikut platform (cth. iOS: Add to Home Screen)
 */
export function InstallButton({ variant = "ghost", className = "" }: { variant?: "ghost" | "primary" | "compact"; className?: string }) {
  const state = useSyncExternalStore(subscribeInstall, getInstallState, () => "manual" as const);
  const [open, setOpen] = useState(false);

  if (state === "installed") {
    return variant === "compact" ? null : (
      <span className={`btn-ghost pointer-events-none opacity-70 ${className}`} aria-label="App installed">
        ✓ Installed
      </span>
    );
  }

  const onClick = async () => {
    if (state === "promptable") {
      const r = await promptInstall();
      if (r === "unavailable") setOpen(true);
      return;
    }
    setOpen(true);
  };

  const cls =
    variant === "primary" ? "btn-primary" : variant === "compact" ? "btn-ghost !min-h-10 !px-3 !py-2" : "btn-ghost";

  return (
    <>
      <button type="button" onClick={onClick} className={`${cls} ${className}`} aria-haspopup="dialog">
        <DownloadIcon />
        <span className={variant === "compact" ? "hidden sm:inline" : ""}>Install App</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-title"
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <div className="glass neon-border max-h-[85vh] w-full max-w-lg overflow-y-auto p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="install-title" className="font-display text-lg font-bold">
                Install DZURRI PLAYVERSE
              </h2>
              <button className="btn-ghost !min-h-10 !px-3" onClick={() => setOpen(false)} autoFocus aria-label="Close">
                ✕
              </button>
            </div>
            <InstallGuide platform={detectPlatform()} compact />
            <Link href="/install" className="mt-4 inline-block text-sm text-cyan-electric underline" onClick={() => setOpen(false)}>
              See the guide for all devices →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}
