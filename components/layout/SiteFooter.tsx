import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";
import { getCreatorProfile } from "@/lib/data/public";

export async function SiteFooter() {
  const p = await getCreatorProfile();
  return (
    <footer className="mt-16 border-t border-white/10 bg-space-2/60 pb-24 lg:pb-8">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <LogoMark size={48} />
            <div>
              <p className="font-display font-black tracking-wider text-gradient">DZURRI PLAYVERSE</p>
              <p className="text-xs tracking-[0.25em] text-ink-muted">ONE CREATOR. INFINITE WORLDS.</p>
            </div>
          </div>
          <p className="max-w-sm text-sm text-ink-muted">
            “Satu platform, pelbagai permainan, pengalaman pembelajaran tanpa batas.”
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-2 text-sm">
          <Link className="py-1.5 text-white/80 hover:text-cyan-electric" href="/games">Explore Games</Link>
          <Link className="py-1.5 text-white/80 hover:text-cyan-electric" href="/favorites">Favorites</Link>
          <Link className="py-1.5 text-white/80 hover:text-cyan-electric" href="/about">About</Link>
          <Link className="py-1.5 text-white/80 hover:text-cyan-electric" href="/creator">Creator</Link>
          <Link className="py-1.5 text-white/80 hover:text-cyan-electric" href="/install">Install App</Link>
          <Link className="py-1.5 text-white/80 hover:text-cyan-electric" href="/me">My Playverse</Link>
        </nav>
        <div className="space-y-2 text-sm md:text-right">
          <p className="font-display text-xs font-bold tracking-[0.3em] text-gold">👑 A DZURRI ORIGINAL</p>
          <Link href="/creator" className="inline-flex items-center gap-3 md:flex-row-reverse">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.photo_url || "/images/brand/creator-portrait.webp"}
              alt=""
              width={44}
              height={44}
              loading="lazy"
              className="size-11 rounded-full border-2 border-cyan-electric/60 object-cover"
            />
            <span className="text-left md:text-right">
              <span className="block font-semibold text-white">{p.name}</span>
              <span className="block text-xs text-ink-muted">{p.title}</span>
            </span>
          </Link>
          <p className="text-xs text-ink-muted/80">© {new Date().getFullYear()} {p.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
