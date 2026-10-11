import type { Metadata } from "next";
import { InstallButton } from "@/components/pwa/InstallButton";
import { InstallGuide } from "@/components/pwa/InstallGuide";
import { LogoMark } from "@/components/layout/Logo";

export const metadata: Metadata = { title: "Install App" };

export default function InstallPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="glass neon-border flex flex-col items-center gap-3 p-6 text-center">
        <LogoMark size={96} />
        <h1 className="font-display text-2xl font-black tracking-wide">Install DZURRI PLAYVERSE</h1>
        <p className="max-w-lg text-sm text-ink-muted">
          Pasang Playverse pada telefon, tablet atau komputer untuk akses pantas dari skrin utama — tanpa kedai aplikasi.
        </p>
        <InstallButton variant="primary" />
      </header>
      <InstallGuide />
    </div>
  );
}
