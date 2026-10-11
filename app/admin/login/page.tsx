import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Owner Login" };
export const dynamic = "force-dynamic";

const REASONS: Record<string, string> = {
  expired: "Your session has expired. Please sign in again.",
  logout: "You have been signed out.",
};

export default async function LoginPage(props: PageProps<"/admin/login">) {
  const sp = await props.searchParams;
  const reason = typeof sp.reason === "string" ? REASONS[sp.reason] : undefined;
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center p-4">
      <div className="glass neon-border w-full max-w-sm space-y-6 p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <LogoMark size={72} />
          <h1 className="font-display text-xl font-black tracking-wide">Owner Console</h1>
          <p className="text-xs tracking-[0.25em] text-gold">A DZURRI ORIGINAL</p>
        </div>
        {reason && (
          <p className="rounded-xl border border-cyan-electric/30 bg-cyan-electric/10 px-3 py-2 text-sm" role="status">
            {reason}
          </p>
        )}
        <LoginForm />
        <div className="text-center text-sm">
          <Link href="/" className="text-white/70 hover:underline">← Back to site</Link>
        </div>
        <p className="text-center text-[11px] text-ink-muted">
          Only the platform owner can sign in. Forgot the password? Check ADMIN_PASSWORD in Vercel.
        </p>
      </div>
    </main>
  );
}
