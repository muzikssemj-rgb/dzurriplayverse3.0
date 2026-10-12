import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";

export const metadata: Metadata = { title: "About" };

const PALETTE = [
  { name: "Cosmic Blue", hex: "#0EA5E9", use: "Teknologi utama" },
  { name: "Galaxy Purple", hex: "#8B5CF6", use: "Fantasi & inovasi" },
  { name: "Neon Gold", hex: "#F59E0B", use: "Ganjaran & pencapaian" },
  { name: "Electric Cyan", hex: "#22D3EE", use: "Highlight & interaksi" },
  { name: "Space Dark", hex: "#0B1020", use: "Latar utama" },
  { name: "Pure White", hex: "#FFFFFF", use: "Teks utama" },
];

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <section className="glass neon-border flex flex-col items-center gap-4 p-8 text-center">
        <LogoMark size={120} />
        <h1 className="font-display text-3xl font-black tracking-wide sm:text-4xl">
          <span className="text-gradient">DZURRI</span> <span className="text-gold-gradient">PLAYVERSE</span>
        </h1>
        <p className="font-display text-sm font-bold tracking-[0.3em] text-cyan-electric">ONE CREATOR. INFINITE WORLDS.</p>
        <p className="max-w-2xl text-white/85">
          DZURRI PLAYVERSE ialah alam permainan digital yang menghimpunkan pelbagai jenis permainan dalam satu tempat. Setiap
          permainan mempunyai dunia, kategori dan pengalaman tersendiri — semuanya dikurasi dan diurus oleh Dzurri melalui satu
          platform pusat.
        </p>
        <p className="text-sm text-ink-muted">Play. Learn. Explore.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["🎮", "Play", "Permainan muzik, kuiz, arked, teka-teki dan banyak lagi — terus dari pelayar."],
          ["📚", "Learn", "Permainan pendidikan yang menggabungkan teknologi, kreativiti dan pembelajaran."],
          ["🌌", "Explore", "Teroka dunia-dunia permainan baharu yang ditambah dari semasa ke semasa."],
        ].map(([icon, title, body]) => (
          <div key={title} className="glass p-5">
            <p className="text-3xl" aria-hidden="true">{icon}</p>
            <h2 className="mt-2 font-display text-lg font-bold">{title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{body}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="palette" className="glass p-5">
        <h2 id="palette" className="mb-4 font-display text-sm font-bold tracking-[0.25em] text-cyan-electric">PALET WARNA JENAMA</h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {PALETTE.map((p) => (
            <li key={p.hex} className="flex items-center gap-3">
              <span className="size-10 shrink-0 rounded-full border border-white/20" style={{ background: p.hex }} aria-hidden="true" />
              <span className="text-xs">
                <span className="block font-semibold">{p.name}</span>
                <span className="block text-ink-muted">{p.hex}</span>
                <span className="block text-ink-muted">{p.use}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass p-5 text-sm text-white/85">
        <h2 className="mb-2 font-bold">Privacy</h2>
        <p>
          Pemain tidak perlu mendaftar. Kegemaran dan sejarah permainan disimpan dalam pelayar anda sahaja. Platform hanya
          merekod statistik tanpa nama — bilangan lawatan, jenis peranti, waktu lawatan dan sesi main — tanpa nama, e-mel,
          alamat IP atau kuki penjejakan, serta laporan pautan rosak yang anda hantar.
          Permainan luaran tertakluk kepada polisi laman masing-masing.
        </p>
        <p className="mt-3">
          <Link href="/creator" className="text-cyan-electric underline">Meet the creator →</Link>
        </p>
      </section>
    </div>
  );
}
