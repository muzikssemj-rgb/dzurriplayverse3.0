"use client";

import Link from "next/link";

/** Ralat tidak dijangka — tiada stack trace dipaparkan kepada pengguna. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-[70dvh] max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-5xl" aria-hidden="true">🛸</p>
      <h1 className="font-display text-2xl font-black">Something went wrong</h1>
      <p className="text-ink-muted">Please try again. If the problem continues, check your internet connection.</p>
      <div className="flex gap-2">
        <button className="btn-cyan" onClick={() => reset()}>Try again</button>
        <Link href="/" className="btn-ghost">Home</Link>
      </div>
    </main>
  );
}
