import type { Metadata } from "next";
import Link from "next/link";
import { getCreatorProfile } from "@/lib/data/store";
import { ProfileForm } from "@/components/admin/ProfileForm";

export const metadata: Metadata = { title: "Creator Profile" };

export default async function ProfilePage() {
  const profile = await getCreatorProfile();
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-wide">Creator Profile</h1>
          <p className="text-sm text-ink-muted">Gambar dan profil anda sebagai pencipta DZURRI PLAYVERSE.</p>
        </div>
        <Link href="/creator" target="_blank" className="btn-ghost">Lihat halaman Creator ↗</Link>
      </header>
      <ProfileForm profile={profile} />
    </div>
  );
}
