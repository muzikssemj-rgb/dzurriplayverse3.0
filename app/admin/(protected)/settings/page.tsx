import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdminPage();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-black tracking-wide">Settings</h1>
        <p className="text-sm text-ink-muted">Keselamatan Owner Console.</p>
      </header>

      <section className="glass space-y-2 p-5" aria-labelledby="sess">
        <h2 id="sess" className="font-bold">Sesi</h2>
        <p className="text-sm text-ink-muted">
          Sesi tamat selepas 30 minit tanpa aktiviti atau 12 jam secara keseluruhan. Log masuk dihadkan kepada 5 percubaan
          gagal setiap 15 minit bagi setiap rangkaian.
        </p>
        <form action={logoutAction}>
          <button className="btn-ghost mt-2">Logout</button>
        </form>
      </section>

      <section className="glass space-y-3 p-5 text-sm" aria-labelledby="pw">
        <h2 id="pw" className="font-bold">Tukar kata laluan admin</h2>
        <p className="text-ink-muted">
          Kata laluan disimpan sebagai pemboleh ubah rahsia <code className="text-white">ADMIN_PASSWORD</code> di Vercel — bukan
          dalam kod atau GitHub. Untuk menukarnya:
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-white/85">
          <li>Vercel → projek anda → <strong>Settings → Environment Variables</strong>.</li>
          <li>Edit <code>ADMIN_PASSWORD</code> → masukkan kata laluan baharu → Save.</li>
          <li><strong>Deployments → ⋯ → Redeploy</strong>. Semua sesi lama akan terbatal secara automatik.</li>
        </ol>
      </section>
    </div>
  );
}
