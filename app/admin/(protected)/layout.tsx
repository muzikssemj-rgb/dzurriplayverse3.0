import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoMark } from "@/components/layout/Logo";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-white/10 bg-space-2/95 p-3 backdrop-blur lg:h-dvh lg:border-b-0 lg:border-r lg:p-4">
        <div className="mb-3 flex items-center justify-between gap-2 lg:mb-6 lg:block">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <LogoMark size={40} />
            <span className="leading-tight">
              <span className="block font-display text-sm font-black tracking-wider text-gradient">DZURRI PLAYVERSE</span>
              <span className="block text-[10px] tracking-[0.25em] text-gold">OWNER CONSOLE</span>
            </span>
          </Link>
          <form action={logoutAction} className="lg:hidden">
            <button className="btn-ghost !min-h-10 !px-3 text-xs">Logout</button>
          </form>
        </div>
        <AdminNav />
        <div className="mt-6 hidden space-y-3 border-t border-white/10 pt-4 text-xs text-ink-muted lg:block">
          <p>
            Signed in as <span className="text-white/90">Owner</span>
            <br />
            since {new Date(admin.since).toLocaleTimeString("en-MY", { timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", minute: "2-digit" })}
          </p>
          <p>Session ends after 30 min of inactivity.</p>
          <Link href="/" className="block text-cyan-electric hover:underline" target="_blank" rel="noopener">
            View public site ↗
          </Link>
          <form action={logoutAction}>
            <button className="btn-ghost w-full">Logout</button>
          </form>
        </div>
      </aside>
      <main id="main" className="min-w-0 p-4 sm:p-6 lg:p-8">
        {children}
        <p className="mt-12 text-center text-[11px] tracking-[0.3em] text-ink-muted">👑 A DZURRI ORIGINAL · OWNER ONLY</p>
      </main>
    </div>
  );
}
