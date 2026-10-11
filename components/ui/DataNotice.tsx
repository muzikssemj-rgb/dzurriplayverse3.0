export function DataNotice({ error }: { error: "not_configured" | "unavailable" }) {
  if (error === "not_configured") {
    return (
      <div className="glass border-gold/40 p-5 text-sm" role="status">
        <p className="font-semibold text-gold">Pangkalan data belum disambungkan.</p>
        <p className="mt-1 text-ink-muted">
          Tetapkan <code className="text-white">FIREBASE_SERVICE_ACCOUNT</code> dalam Vercel → Settings → Environment Variables
          (lihat README → “Sediakan Firebase”), kemudian Redeploy.
        </p>
      </div>
    );
  }
  return (
    <div className="glass border-red-400/40 p-5 text-sm" role="alert">
      <p className="font-semibold text-red-300">Senarai permainan tidak dapat dimuatkan buat masa ini.</p>
      <p className="mt-1 text-ink-muted">Semak sambungan internet anda dan cuba muat semula halaman.</p>
    </div>
  );
}
