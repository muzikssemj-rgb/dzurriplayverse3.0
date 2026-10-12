import Link from "next/link";

/** Monogram DZ original (sama seperti ikon PWA) — sebaris supaya tajam pada semua saiz. */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="lm-bg" cx="50%" cy="38%" r="75%">
          <stop offset="0" stopColor="#1E2A5A" />
          <stop offset="0.55" stopColor="#121a3d" />
          <stop offset="1" stopColor="#0B1020" />
        </radialGradient>
        <linearGradient id="lm-ring" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#22D3EE" />
          <stop offset="0.5" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="lm-d" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A5F3FC" />
          <stop offset="0.45" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id="lm-z" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#lm-bg)" />
      <rect x="10" y="10" width="492" height="492" rx="104" fill="none" stroke="#22D3EE" strokeOpacity=".35" strokeWidth="6" />
      <ellipse cx="256" cy="262" rx="214" ry="74" fill="none" stroke="url(#lm-ring)" strokeWidth="16" strokeOpacity=".9" transform="rotate(-16 256 262)" />
      <g transform="translate(18 0) skewX(-9)" stroke="#0B1020" strokeWidth="12" strokeLinejoin="round" paintOrder="stroke">
        <path fill="url(#lm-d)" fillRule="evenodd" d="M104 132H210Q318 132 318 256Q318 380 210 380H104Z M160 186V326H204Q258 326 258 256Q258 186 204 186Z" />
        <path fill="url(#lm-z)" d="M270 132H436V178L338 332H436V380H262V334L360 180H270Z" />
        <g fill="#F59E0B" stroke="none">
          <rect x="188" y="249" width="40" height="14" rx="4" />
          <rect x="201" y="236" width="14" height="40" rx="4" />
        </g>
      </g>
      <path d="M44 270 A214 74 0 0 0 200 334" fill="none" stroke="url(#lm-ring)" strokeWidth="16" strokeLinecap="round" transform="rotate(-16 256 262)" />
      <path fill="#FDE68A" d="M420 84l8 22 22 8-22 8-8 22-8-22-22-8 22-8z" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-xl" aria-label="DZURRI PLAYVERSE — Laman Utama">
      <LogoMark size={compact ? 36 : 44} />
      <span className="leading-tight">
        <span className="block whitespace-nowrap font-display text-[13px] font-black tracking-wider text-gradient min-[400px]:text-[15px] sm:text-base">
          DZURRI PLAYVERSE
        </span>
        <span className="block whitespace-nowrap text-[8.5px] font-medium tracking-[0.06em] text-ink-muted min-[400px]:text-[9px] sm:text-[10px] sm:tracking-[0.12em]">GAMIFIKASI DALAM PENDIDIKAN MUZIK</span>
      </span>
    </Link>
  );
}
