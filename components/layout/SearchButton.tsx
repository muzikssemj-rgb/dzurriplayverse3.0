"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !isTyping(e.target))) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
        aria-label="Cari permainan"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cari permainan"
          className="fixed inset-0 z-[110] flex items-start justify-center bg-black/70 p-4 pt-[12vh]"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <form
            className="glass neon-border flex w-full max-w-xl gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              setOpen(false);
              router.push(q.trim() ? `/games?q=${encodeURIComponent(q.trim())}` : "/games");
            }}
          >
            <label htmlFor="global-search" className="sr-only">
              Cari mengikut nama permainan, kategori atau tag
            </label>
            <input
              ref={inputRef}
              id="global-search"
              className="input flex-1"
              placeholder="Cari permainan, kategori atau tag…"
              value={q}
              maxLength={60}
              onChange={(e) => setQ(e.target.value)}
              enterKeyHint="search"
            />
            <button className="btn-cyan" type="submit">
              Cari
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function isTyping(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}
