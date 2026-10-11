const MESSAGES: Record<string, { text: string; tone: "ok" | "error" }> = {
  created: { text: "Game saved as draft.", tone: "ok" },
  updated: { text: "Game updated.", tone: "ok" },
  published: { text: "Game published — it now appears on the home page and its category.", tone: "ok" },
  unpublished: { text: "Game unpublished — it is hidden from players.", tone: "ok" },
  draft: { text: "Game moved to draft.", tone: "ok" },
  duplicated: { text: "Game duplicated as a draft. Edit and publish when ready.", tone: "ok" },
  deleted: { text: "Deleted.", tone: "ok" },
  saved: { text: "Saved.", tone: "ok" },
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
