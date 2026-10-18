import Link from "next/link";
import type { PublicQuiz } from "@/lib/quiz";
import type { Subject } from "@/lib/kit";

const TONES = ["from-gold/30 via-amber-700/20", "from-cyan-electric/30 via-sky-700/20", "from-galaxy/40 via-violet-800/20", "from-emerald-500/30 via-teal-800/20"];

export function QuizCard({ quiz, subject, index = 0 }: { quiz: PublicQuiz; subject?: Pick<Subject, "name" | "icon"> | null; index?: number }) {
  return (
    <article className={`group glass relative flex h-full flex-col gap-3 overflow-hidden bg-gradient-to-br to-transparent p-4 transition hover:-translate-y-0.5 hover:border-gold/50 ${TONES[index % TONES.length]}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-space/70 text-2xl ring-1 ring-white/15" aria-hidden="true">
          {subject?.icon || "📝"}
        </span>
        <span className="rounded-full bg-space/70 px-2.5 py-1 text-[11px] font-bold text-gold ring-1 ring-gold/40">
          {quiz.question_count} soalan · {quiz.time_limit}s
        </span>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold leading-snug text-white">
          <Link href={`/kuiz/${quiz.slug}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
            {quiz.title}
          </Link>
        </h3>
        {quiz.description && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{quiz.description}</p>}
      </div>
      <div className="flex items-center justify-between gap-2">
        {subject ? <span className="truncate text-[11px] text-violet-200">{subject.name}</span> : <span />}
        <span className="btn-primary pointer-events-none !min-h-9 !px-3 text-xs" aria-hidden="true">
          🎮 Main Kuiz
        </span>
      </div>
    </article>
  );
}

export function QuizGrid({ quizzes, subjects }: { quizzes: PublicQuiz[]; subjects?: Subject[] }) {
  const map = new Map((subjects ?? []).map((s) => [s.id, s]));
  return (
    <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {quizzes.map((q, i) => (
        <li key={q.id}>
          <QuizCard quiz={q} index={i} subject={q.subject_id ? map.get(q.subject_id) : null} />
        </li>
      ))}
    </ul>
  );
}
