const MESSAGES: Record<string, { text: string; tone: "ok" | "error" }> = {
  created: { text: "Game saved as draft.", tone: "ok" },
  updated: { text: "Game updated.", tone: "ok" },
  published: { text: "Game published — it now appears on the home page and its category.", tone: "ok" },
  unpublished: { text: "Game unpublished — it is hidden from players.", tone: "ok" },
  draft: { text: "Game moved to draft.", tone: "ok" },
  duplicated: { text: "Game duplicated as a draft. Edit and publish when ready.", tone: "ok" },
  deleted: { text: "Deleted.", tone: "ok" },
  saved: { text: "Saved.", tone: "ok" },
  video_added: { text: "Video disimpan. Jika status Diterbitkan, ia kini dipaparkan di Kit Pembelajaran Muzik.", tone: "ok" },
  video_published: { text: "Video diterbitkan — murid kini boleh menontonnya.", tone: "ok" },
  quiz_saved: { text: "Kuiz disimpan sebagai draf.", tone: "ok" },
  quiz_published: { text: "Kuiz diterbitkan — murid kini boleh bermain di tab Kuiz.", tone: "ok" },
  quiz_empty: { text: "Kuiz tanpa soalan tidak boleh diterbitkan.", tone: "error" },
  cleared: { text: "Semua keputusan dipadam.", tone: "ok" },
  error: { text: "The action failed. Please try again.", tone: "error" },
};

export function Flash({ msg }: { msg?: string }) {
  const m = msg ? MESSAGES[msg] : undefined;
  if (!m) return null;
  return (
    <p
      role={m.tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${
        m.tone === "ok" ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-red-400/40 bg-red-500/10 text-red-200"
      }`}
    >
      {m.text}
    </p>
  );
}
