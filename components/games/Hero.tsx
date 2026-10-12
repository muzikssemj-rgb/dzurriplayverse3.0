import Link from "next/link";
import { InstallButton } from "@/components/pwa/InstallButton";

/** Hero — dunia futuristik: portal, pulau terapung & cahaya neon (CSS/SVG ringan). */
export function Hero({ image, creatorName = "Dzurri" }: { image?: string | null; creatorName?: string }) {
  const src = image || "/images/brand/hero-character.webp";
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden rounded-3xl border border-cyan-electric/30 neon-border"
    >
      <HeroBackdrop />
      <div className="relative grid items-center gap-6 p-6 sm:p-10 md:grid-cols-[1.25fr_1fr]">
        <div className="relative z-10 max-w-xl">
          <p className="font-display text-sm font-bold tracking-[0.25em] text-white/90 sm:text-base">SELAMAT DATANG KE</p>
          <h1 id="hero-title" className="mt-1 font-display text-4xl font-black leading-[1.05] tracking-wide sm:text-5xl lg:text-6xl">
            <span className="text-gradient">DZURRI</span>
            <br />
            <span className="text-gold-gradient">PLAYVERSE</span>
          </h1>
          <p className="mt-3 font-display text-xs font-semibold tracking-[0.2em] text-cyan-electric sm:text-sm sm:tracking-[0.35em]">MAIN · BELAJAR · TEROKA</p>
          <p className="mt-4 max-w-md text-sm text-white/80 sm:text-base">
            Temui permainan baharu, teroka dunia yang menarik dan alami semesta pengembaraan digital sambil belajar muzik.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/games" className="btn-primary">
              Teroka Permainan <span aria-hidden="true">›</span>
            </Link>
            <Link href="/#featured" className="btn-cyan">
              ★ Permainan Pilihan
            </Link>
            <InstallButton />
          </div>
        </div>
        <div className="relative order-first justify-self-center md:order-none md:justify-self-end">
          <div className="absolute -inset-6 rounded-full bg-cyan-electric/20 blur-3xl animate-glow" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${creatorName}, pencipta DZURRI PLAYVERSE`}
            width={360}
            height={360}
            fetchPriority="high"
            className="relative w-[170px] animate-float object-cover sm:w-[220px] md:w-[300px] lg:w-[360px]"
            style={{ maskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, black 60%, transparent 100%)" }}
          />
        </div>
      </div>
    </section>
  );
}

function HeroBackdrop() {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    x: (i * 73) % 100,
    y: (i * 37) % 100,
    s: (i % 3) + 1,
    d: (i % 5) * 0.8,
  }));
  return (
    <div className="absolute inset-0 -z-10" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,#3b2a8a_0%,#16205a_40%,#0B1020_80%)]" />
      {stars.map((st, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, animationDelay: `${st.d}s` }}
        />
      ))}
      <svg className="absolute inset-0 size-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="portal" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#a5f3fc" stopOpacity=".95" />
            <stop offset=".45" stopColor="#22D3EE" stopOpacity=".55" />
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="island" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#34d399" />
            <stop offset=".25" stopColor="#065f46" />
            <stop offset="1" stopColor="#1e1b4b" />
          </linearGradient>
        </defs>
        <ellipse cx="610" cy="150" rx="120" ry="120" fill="url(#portal)" opacity=".55" />
        <ellipse cx="610" cy="150" rx="78" ry="98" fill="none" stroke="#22D3EE" strokeWidth="3" opacity=".7" />
        <g opacity=".85">
          <path d="M60 300 q60 -24 120 0 l-30 50 q-30 18 -60 0z" fill="url(#island)" />
          <path d="M470 330 q70 -26 140 0 l-34 46 q-36 16 -72 0z" fill="url(#island)" />
          <path d="M690 260 q40 -16 80 0 l-20 30 q-20 10 -40 0z" fill="url(#island)" />
          <path d="M300 90 q36 -14 72 0 l-18 26 q-18 9 -36 0z" fill="url(#island)" opacity=".6" />
        </g>
        <path d="M0 360 C200 320 600 400 800 340" stroke="#8B5CF6" strokeOpacity=".35" strokeWidth="2" fill="none" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-r from-space/85 via-space/40 to-transparent" />
    </div>
  );
}
