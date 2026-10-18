import type { Metadata } from "next";
import { getPublishedQuizzes } from "@/lib/data/quiz";
import { getKit } from "@/lib/data/kit";
import { DataNotice } from "@/components/ui/DataNotice";
import { QuizGrid } from "@/components/quiz/QuizCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kuiz", description: "Kuiz muzik ciptaan cikgu — jawab pantas, kumpul mata dan naik papan skor." };

export default async function QuizListPage() {
  const [res, kit] = await Promise.all([getPublishedQuizzes(), getKit()]);
  if (!res.ok) return <DataNotice error={res.error} />;
  return (
    <div className="space-y-8">
      <header className="glass neon-border relative overflow-hidden p-6 sm:p-8">
        <span className="absolute -right-6 -top-8 text-[9rem] opacity-10" aria-hidden="true">📝</span>
        <p className="font-display text-xs font-bold tracking-[0.3em] text-gold">JAWAB · KUMPUL MATA · MENANG</p>
        <h1 className="mt-1 font-display text-3xl font-black tracking-wide sm:text-4xl">
          <span className="text-gradient">Kuiz</span> <span className="text-gold-gradient">Cikgu</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
          Pilih kuiz, masukkan nama dan kelas, kemudian jawab secepat mungkin. Jawapan betul berturut-turut memberi bonus combo 🔥.
        </p>
      </header>
      {res.data.length === 0 ? (
        <p className="glass p-6 text-center text-ink-muted">Belum ada kuiz diterbitkan. Cikgu akan menambah kuiz tidak lama lagi!</p>
      ) : (
        <QuizGrid quizzes={res.data} subjects={kit.ok ? kit.data.subjects : []} />
      )}
    </div>
  );
}
