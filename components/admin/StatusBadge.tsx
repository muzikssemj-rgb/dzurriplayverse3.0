import type { GameStatus } from "@/lib/types";

const STYLES: Record<GameStatus, string> = {
  published: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40",
  draft: "bg-amber-500/15 text-amber-200 border-amber-400/40",
  unpublished: "bg-slate-500/20 text-slate-300 border-slate-400/40",
};

export function StatusBadge({ status }: { status: GameStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STYLES[status]}`}>
      {status}
    </span>
  );
}
