import type { Metadata } from "next";
import Link from "next/link";
import { getCreatorProfile } from "@/lib/data/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pencipta" };

export default async function CreatorPage() {
  const p = await getCreatorProfile();
  return (
    <div className="space-y-8">
      <section className="glass neon-border grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[auto_1fr]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.photo_url || "/images/brand/creator-portrait.webp"}
          alt={`Foto ${p.name}, pencipta DZURRI PLAYVERSE`}
          width={176}
          height={176}
          className="mx-auto size-44 rounded-full border-4 border-cyan-electric/70 object-cover shadow-[0_0_40px_-6px_rgba(34,211,238,.8)]"
        />
        <div className="space-y-3 text-center md:text-left">
          <p className="font-display text-xs font-bold tracking-[0.35em] text-gold">🎵 GAMIFIKASI DALAM PENDIDIKAN MUZIK</p>
          <h1 className="font-display text-3xl font-black tracking-wide">{p.name}</h1>
          {p.title && <p className="text-sm tracking-[0.2em] text-cyan-electric uppercase">{p.title}</p>}
          {p.bio && <p className="whitespace-pre-line text-white/85">{p.bio}</p>}
        </div>
      </section>
      {p.quote && (
        <blockquote className="glass mx-auto max-w-2xl p-6 text-center">
          <p className="text-lg italic text-white/90">“{p.quote}”</p>
          <footer className="mt-2 text-sm text-ink-muted">— {p.name}</footer>
        </blockquote>
      )}
      <div className="text-center">
        <Link href="/games" className="btn-primary">Teroka Playverse ›</Link>
      </div>
    </div>
  );
}
