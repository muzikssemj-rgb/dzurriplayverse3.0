"use client";

import { useState } from "react";
import { ytEmbed, ytThumb, ytWatch } from "@/lib/kit";

/**
 * Pemain YouTube "klik-untuk-main": iframe (youtube-nocookie) hanya dimuatkan selepas murid menekan main.
 * Halaman lebih laju di telefon dan tiada kuki YouTube sebelum video dimainkan.
 */
export function YouTubePlayer({ id, start = 0, title }: { id: string; start?: number; title: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-cyan-electric/30 bg-black">
        {on ? (
          <iframe
            src={`${ytEmbed(id, start)}&autoplay=1`}
            title={title}
            className="absolute inset-0 size-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button type="button" onClick={() => setOn(true)} className="group absolute inset-0 size-full" aria-label={`Main video: ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ytThumb(id)} alt="" className="size-full object-cover opacity-90 transition group-hover:opacity-100" />
            <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
              <span className="grid size-20 place-items-center rounded-full bg-red-600 text-4xl text-white shadow-2xl ring-8 ring-white/20 transition group-hover:scale-110">
                ▶
              </span>
            </span>
          </button>
        )}
      </div>
      <p className="text-xs text-ink-muted">
        Video tidak dapat dimainkan?{" "}
        <a href={ytWatch(id, start)} target="_blank" rel="noopener noreferrer" className="text-cyan-electric underline">
          Buka di YouTube ↗
        </a>
      </p>
    </div>
  );
}
