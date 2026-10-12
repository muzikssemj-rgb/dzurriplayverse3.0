import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { DesktopNav } from "@/components/layout/NavLinks";
import { SearchButton } from "@/components/layout/SearchButton";
import { InstallButton } from "@/components/pwa/InstallButton";

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-white/5 bg-space/85 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Logo />
        <div className="ml-4 flex-1">
          <DesktopNav />
        </div>
        <div className="flex items-center gap-2">
          <SearchButton />
          <div className="hidden sm:block">
            <InstallButton variant="compact" />
          </div>
          <Link
            href="/me"
            className="grid size-11 place-items-center overflow-hidden rounded-full border-2 border-cyan-electric/60"
            aria-label="Profil saya"
          >
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
