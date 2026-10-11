import { LogoMark } from "@/components/layout/Logo";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <LogoMark size={72} className="animate-float" />
      <p className="font-display text-xs font-bold tracking-[0.35em] text-ink-muted">LOADING THE PLAYVERSE…</p>
    </div>
  );
}
