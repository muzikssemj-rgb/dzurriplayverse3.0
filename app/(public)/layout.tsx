import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BottomNav } from "@/components/layout/NavLinks";
import { Analytics } from "@/components/Analytics";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6">
        {children}
      </main>
      <SiteFooter />
      <BottomNav />
      <Analytics />
    </>
  );
}
