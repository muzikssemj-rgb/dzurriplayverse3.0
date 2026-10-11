"use client";

import { useState } from "react";

/** Thumbnail dengan lazy loading & fallback apabila imej gagal dimuatkan. */
export function GameThumb({
  src,
  alt,
  icon,
  className = "",
  eager = false,
}: {
  src: string | null;
  alt: string;
  icon?: string | null;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className={`grid place-items-center bg-[radial-gradient(circle_at_30%_20%,#8B5CF6_0%,#1e1b4b_45%,#0B1020_100%)] ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="text-4xl drop-shadow-[0_0_12px_rgba(34,211,238,.7)]" aria-hidden="true">
          {icon || "🎮"}
        </span>
      </div>
    );
  }
  return (
    // Imej daripada URL yang ditetapkan admin (domain tidak tetap) — <img> biasa dengan lazy loading.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
