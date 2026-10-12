import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
      <LogoMark size={88} />
      <h1 className="font-display text-3xl font-black">404</h1>
      <p className="text-ink-muted">Dunia ini tidak wujud (lagi). Permainan mungkin telah dipindahkan atau tidak lagi diterbitkan.</p>
      <div className="flex gap-2">
        <Link href="/" className="btn-primary">Laman Utama</Link>
        <Link href="/games" className="btn-ghost">Teroka Permainan</Link>
      </div>
    </main>
  );
}
