"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { pointsFor, starsFor, type LeaderEntry, type PublicQuestion, type PublicQuiz } from "@/lib/quiz";

/* ------------------------------------------------------------------ bunyi (Web Audio, tiada fail) */
type Sfx = "correct" | "wrong" | "tick" | "go" | "count" | "finish";
function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  useEffect(() => {
    try {
      const m = localStorage.getItem("dz:mute") === "1";
      mutedRef.current = m;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMuted(m);
    } catch {
      /* abaikan */
    }
  }, []);
  const toggle = () => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    try {
      localStorage.setItem("dz:mute", mutedRef.current ? "1" : "0");
    } catch {
      /* abaikan */
    }
  };
  const play = useCallback((s: Sfx) => {
    if (mutedRef.current) return;
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctxRef.current ??= new AC();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const t0 = ctx.currentTime;
      const note = (freq: number, start: number, dur: number, type: OscillatorType = "triangle", vol = 0.18) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t0 + start);
        g.gain.exponentialRampToValueAtTime(vol, t0 + start + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
        o.connect(g).connect(ctx.destination);
        o.start(t0 + start);
        o.stop(t0 + start + dur + 0.05);
      };
      if (s === "correct") [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, i * 0.07, 0.25)); // arpeggio C major
      else if (s === "wrong") {
        note(233.08, 0, 0.22, "sawtooth", 0.09);
        note(220, 0.18, 0.35, "sawtooth", 0.09);
      } else if (s === "tick") note(1200, 0, 0.05, "square", 0.04);
      else if (s === "count") note(660, 0, 0.12, "sine", 0.15);
      else if (s === "go") note(990, 0, 0.3, "sine", 0.18);
      else if (s === "finish") [523.25, 659.25, 783.99, 659.25, 1046.5].forEach((f, i) => note(f, i * 0.12, i === 4 ? 0.6 : 0.18));
    } catch {
      /* audio tidak disokong */
    }
  }, []);
  return { play, muted, toggle };
}

/* ------------------------------------------------------------------ jenis */
type Phase = "intro" | "countdown" | "question" | "feedback" | "submitting" | "done";
type Shown = { q: PublicQuestion; opts: { text: string; orig: number }[] };
type Log = { q: PublicQuestion; choice: number; answer: number | null; correct: boolean | null; explanation: string | null; points: number };
type Final = { score: number; correct: number; total: number; bestStreak: number; duration_ms: number; rank: number | null; board: LeaderEntry[]; me: string };
type Burst = { id: number; parts: { dx: number; dy: number; rot: number; color: string; delay: number }[] };

const TILE = [
  { bg: "from-rose-500 to-rose-700", shape: "▲" },
  { bg: "from-sky-500 to-blue-700", shape: "◆" },
  { bg: "from-amber-400 to-orange-600", shape: "●" },
  { bg: "from-emerald-500 to-green-700", shape: "■" },
];
const LETTERS = ["A", "B", "C", "D"];
const COLORS = ["#22d3ee", "#f59e0b", "#8b5cf6", "#34d399", "#f43f5e", "#fde68a"];

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function postJson<T>(url: string, body: unknown, retries = 1): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(j.error || "Ralat rangkaian."), { status: res.status });
      return j as T;
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (i >= retries || (status && status < 500)) throw e;
      await new Promise((r) => setTimeout(r, 600));
    }
  }
}

/* ------------------------------------------------------------------ komponen utama */
export function QuizGame({ quiz, initialBoard }: { quiz: PublicQuiz; initialBoard: LeaderEntry[] }) {
  const { play, muted, toggle } = useSound();
  const [phase, setPhase] = useState<Phase>("intro");
  const [name, setName] = useState("");
  const [kelas, setKelas] = useState("");
  const [formErr, setFormErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(3);
  const [order, setOrder] = useState<Shown[]>([]);
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(quiz.time_limit * 1000);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [log, setLog] = useState<Log[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [final, setFinal] = useState<Final | null>(null);
  const [error, setError] = useState("");
  const [confirmExit, setConfirmExit] = useState(false);
  const token = useRef("");
  const startedAt = useRef(0);
  const answers = useRef<{ q: string; choice: number; ms: number }[]>([]);
  const lastTick = useRef(0);
  const locked = useRef(false);
  const limitMs = quiz.time_limit * 1000;
  const current = order[idx];
  const last = log[log.length - 1];

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("dz:player") ?? "{}");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (typeof saved.name === "string") setName(saved.name);
      if (typeof saved.kelas === "string") setKelas(saved.kelas);
    } catch {
      /* abaikan */
    }
  }, []);

  // Kunci skrol halaman semasa bermain (mod skrin penuh dalam aplikasi)
  const playing = phase === "countdown" || phase === "question" || phase === "feedback" || phase === "submitting";
  useEffect(() => {
    if (!playing) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [playing]);

  async function start(e?: React.FormEvent) {
    e?.preventDefault();
    const n = name.trim();
    if (n.length < 2) return setFormErr("Sila isi nama anda (sekurang-kurangnya 2 huruf).");
    setFormErr("");
    setBusy(true);
    try {
      localStorage.setItem("dz:player", JSON.stringify({ name: n, kelas: kelas.trim() }));
    } catch {
      /* abaikan */
    }
    try {
      const j = await postJson<{ token: string }>(`/api/kuiz/${quiz.id}/mula`, {});
      token.current = j.token;
    } catch (err) {
      setBusy(false);
      return setFormErr(err instanceof Error ? err.message : "Tidak dapat memulakan kuiz. Semak sambungan internet.");
    }
    const qs = quiz.shuffle ? shuffled(quiz.questions) : quiz.questions;
    setOrder(
      qs.map((q) => {
        const opts = q.options.map((text, orig) => ({ text, orig }));
        return { q, opts: quiz.shuffle && q.type === "mcq" ? shuffled(opts) : opts };
      }),
    );
    answers.current = [];
    setLog([]);
    setScore(0);
    setStreak(0);
    setIdx(0);
    setFinal(null);
    setError("");
    setBusy(false);
    setCount(3);
    setPhase("countdown");
  }

  // Kiraan detik 3-2-1
  useEffect(() => {
    if (phase !== "countdown") return;
    play(count > 0 ? "count" : "go");
    const t = setTimeout(() => {
      if (count > 0) setCount((c) => c - 1);
      else {
        setPicked(null);
        locked.current = false;
        startedAt.current = performance.now();
        setLeft(limitMs);
        setPhase("question");
      }
    }, count > 0 ? 700 : 450);
    return () => clearTimeout(t);
  }, [phase, count, play, limitMs]);

  const answer = useCallback(
    async (choiceOrig: number, displayIdx: number | null) => {
      if (phase !== "question" || !current || locked.current) return;
      locked.current = true;
      const ms = Math.min(performance.now() - startedAt.current, limitMs);
      setPicked(displayIdx);
      setChecking(true);
      setPhase("feedback");
      answers.current.push({ q: current.q.id, choice: choiceOrig, ms: Math.round(ms) });
      let res: { correct: boolean; answer: number; explanation: string | null } | null = null;
      try {
        res = await postJson(`/api/kuiz/${quiz.id}/semak`, { token: token.current, q: current.q.id, choice: choiceOrig });
      } catch {
        res = null;
      }
      setChecking(false);
      const ok = res?.correct ?? null;
      const nextStreak = ok ? streak + 1 : 0;
      const pts = ok ? pointsFor(ms, limitMs, nextStreak) : 0;
      setStreak(nextStreak);
      setScore((s) => s + pts);
      setLog((l) => [...l, { q: current.q, choice: choiceOrig, answer: res?.answer ?? null, correct: ok, explanation: res?.explanation ?? null, points: pts }]);
      if (ok) {
        play("correct");
        setBurst({
          id: Date.now(),
          parts: Array.from({ length: 26 }, (_, i) => ({
            dx: Math.round((Math.random() - 0.5) * 520),
            dy: Math.round(-80 - Math.random() * 320),
            rot: Math.round(Math.random() * 720 - 360),
            color: COLORS[i % COLORS.length],
            delay: Math.random() * 0.12,
          })),
        });
      } else if (ok === false) play("wrong");
    },
    [phase, current, limitMs, quiz.id, streak, play],
  );

  // Pemasa soalan
  useEffect(() => {
    if (phase !== "question") return;
    let raf = 0;
    const loop = () => {
      const remain = Math.max(limitMs - (performance.now() - startedAt.current), 0);
      setLeft(remain);
      const sec = Math.ceil(remain / 1000);
      if (sec <= 5 && sec > 0 && sec !== lastTick.current) {
        lastTick.current = sec;
        play("tick");
      }
      if (remain <= 0) {
        void answer(-1, null);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, limitMs, answer, play]);

  const next = useCallback(async () => {
    if (phase !== "feedback" || checking || !locked.current) return;
    locked.current = false;
    setBurst(null);
    lastTick.current = 0;
    if (idx + 1 < order.length) {
      setIdx((i) => i + 1);
      setPicked(null);
      startedAt.current = performance.now();
      setLeft(limitMs);
      setPhase("question");
      return;
    }
    setPhase("submitting");
    try {
      const j = await postJson<Final>(`/api/kuiz/${quiz.id}/hantar`, { token: token.current, name: name.trim(), kelas: kelas.trim(), answers: answers.current }, 2);
      setFinal(j);
      play("finish");
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghantar keputusan.");
      setPhase("done");
    }
  }, [phase, checking, idx, order.length, limitMs, quiz.id, name, kelas, play]);

  // Auto-teruskan selepas jawapan betul tanpa penerangan
  useEffect(() => {
    if (phase !== "feedback" || checking || !last || !last.correct || last.explanation) return;
    const t = setTimeout(() => void next(), 1600);
    return () => clearTimeout(t);
  }, [phase, checking, last, next]);

  // Papan kekunci: 1–4 / A–D untuk menjawab, Enter untuk seterusnya
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "question" && current) {
        const k = e.key.toLowerCase();
        const n = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
        if (n >= 0 && n < current.opts.length) void answer(current.opts[n].orig, n);
      } else if (phase === "feedback" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        void next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, current, answer, next]);

  /* ---------------------------------------------------------------- paparan */
  if (phase === "intro") {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="glass neon-border relative overflow-hidden p-6 sm:p-8" aria-labelledby="quiz-title">
          <span className="absolute -right-6 -top-10 text-[9rem] opacity-10" aria-hidden="true">🎵</span>
          <p className="font-display text-xs font-bold tracking-[0.3em] text-gold">KUIZ CIKGU</p>
          <h1 id="quiz-title" className="mt-1 font-display text-2xl font-black tracking-wide sm:text-4xl">{quiz.title}</h1>
          {quiz.description && <p className="mt-2 whitespace-pre-line text-sm text-white/80 sm:text-base">{quiz.description}</p>}
          <ul className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <li className="rounded-full bg-white/10 px-3 py-1.5">❓ {quiz.question_count} soalan</li>
            <li className="rounded-full bg-white/10 px-3 py-1.5">⏱️ {quiz.time_limit} saat setiap soalan</li>
            <li className="rounded-full bg-white/10 px-3 py-1.5">⚡ Jawab cepat = bonus mata</li>
            <li className="rounded-full bg-white/10 px-3 py-1.5">🔥 Betul berturut-turut = combo</li>
          </ul>
          <form onSubmit={start} className="mt-6 grid gap-3 sm:grid-cols-[1fr_160px]" noValidate>
            <div>
              <label htmlFor="pname" className="label">Nama anda *</label>
              <input id="pname" className="input" maxLength={40} autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="cth. Aisyah" aria-invalid={formErr ? true : undefined} />
            </div>
            <div>
              <label htmlFor="pkelas" className="label">Kelas</label>
              <input id="pkelas" className="input" maxLength={20} value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="cth. 4 Bestari" />
            </div>
            {formErr && <p className="field-error sm:col-span-2" role="alert">{formErr}</p>}
            <button type="submit" className="btn-primary text-base sm:col-span-2 !min-h-14" disabled={busy}>
              {busy ? "Menyediakan…" : "🎮 Mula Kuiz"}
            </button>
          </form>
          <button type="button" onClick={toggle} className="mt-3 text-xs text-ink-muted hover:text-white">
            {muted ? "🔇 Bunyi dimatikan — tekan untuk hidupkan" : "🔊 Bunyi hidup — tekan untuk matikan"}
          </button>
        </section>
        {quiz.show_leaderboard && <Leaderboard board={initialBoard} />}
      </div>
    );
  }

  if (phase === "done") {
    const stars = final ? starsFor(final.correct, final.total) : 0;
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="glass neon-border relative overflow-hidden p-6 text-center sm:p-8" aria-live="polite">
          {error ? (
            <>
              <p className="text-5xl" aria-hidden="true">📡</p>
              <h1 className="mt-2 text-xl font-bold">Keputusan tidak dapat dihantar</h1>
              <p className="mt-1 text-sm text-ink-muted">{error}</p>
              <p className="mt-3 font-display text-4xl font-black text-gold">{score} mata</p>
            </>
          ) : (
            final && (
              <>
                <p className="font-display text-xs font-bold tracking-[0.3em] text-cyan-electric">KUIZ SELESAI!</p>
                <p className="mt-3 flex justify-center gap-2 text-5xl" aria-label={`${stars} daripada 3 bintang`}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`animate-pop ${i < stars ? "" : "opacity-20 grayscale"}`} style={{ animationDelay: `${i * 0.15}s` }}>
                      ⭐
                    </span>
                  ))}
                </p>
                <h1 className="mt-2 text-xl font-bold">
                  {stars === 3 ? "Hebat, " : stars === 2 ? "Bagus, " : "Teruskan berusaha, "}
                  {name.trim()}!
                </h1>
                <p className="mt-3 font-display text-5xl font-black text-gold-gradient" data-testid="final-score">{final.score}</p>
                <p className="text-sm text-ink-muted">mata</p>
                <ul className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-2 text-sm">
                  <li className="rounded-xl bg-white/5 p-3">
                    <span className="block font-display text-xl font-black text-emerald-300">{final.correct}/{final.total}</span>betul
                  </li>
                  <li className="rounded-xl bg-white/5 p-3">
                    <span className="block font-display text-xl font-black text-orange-300">🔥{final.bestStreak}</span>combo terbaik
                  </li>
                  <li className="rounded-xl bg-white/5 p-3">
                    <span className="block font-display text-xl font-black text-cyan-electric">{final.rank ? `#${final.rank}` : "—"}</span>kedudukan
                  </li>
                </ul>
              </>
            )
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => start()}>↻ Main Semula</button>
            <Link href="/kuiz" className="btn-ghost">Kuiz lain</Link>
            <Link href="/kit" className="btn-ghost">🎬 Kit Pembelajaran</Link>
          </div>
        </section>
        <div className="space-y-6">
          {quiz.show_leaderboard && final && <Leaderboard board={final.board} me={final.me} />}
        </div>
        {log.length > 0 && (
          <section className="glass p-5 lg:col-span-2" aria-labelledby="semak-jawapan">
            <h2 id="semak-jawapan" className="mb-3 font-bold">📋 Semak jawapan</h2>
            <ol className="space-y-2">
              {log.map((l, i) => (
                <li key={l.q.id} className={`rounded-xl border p-3 text-sm ${l.correct ? "border-emerald-400/40 bg-emerald-500/5" : "border-rose-400/40 bg-rose-500/5"}`}>
                  <p className="font-medium">
                    {l.correct ? "✅" : "❌"} {i + 1}. {l.q.text}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Jawapan anda: <strong className="text-white">{l.choice >= 0 ? l.q.options[l.choice] : "— masa tamat —"}</strong>
                    {!l.correct && l.answer !== null && (
                      <>
                        {" "}· Jawapan betul: <strong className="text-emerald-300">{l.q.options[l.answer]}</strong>
                      </>
                    )}
                  </p>
                  {l.explanation && <p className="mt-1 text-xs text-white/75">💡 {l.explanation}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------- skrin bermain (penuh)
  const pct = Math.max(0, Math.min(1, left / limitMs));
  const secs = Math.ceil(left / 1000);
  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-space" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#3b2a8a_0%,#16205a_45%,#0B1020_85%)]" aria-hidden="true" />

      {/* Bar atas */}
      <div className="relative flex items-center gap-2 px-3 pt-3 sm:px-6">
        <button type="button" className="grid size-10 place-items-center rounded-full bg-white/10 text-white" onClick={() => setConfirmExit(true)} aria-label="Keluar kuiz">
          ✕
        </button>
        <p className="font-display text-sm font-bold tracking-wide" aria-live="polite">
          {phase === "countdown" ? "Bersedia…" : `Soalan ${Math.min(idx + 1, order.length)}/${order.length}`}
        </p>
        <div className="ml-auto flex items-center gap-2">
          {streak >= 2 && (
            <span key={streak} className="animate-pop rounded-full bg-orange-500/20 px-3 py-1 text-sm font-black text-orange-300 ring-1 ring-orange-400/50">
              🔥 x{streak}
            </span>
          )}
          <span className="rounded-full bg-gold/15 px-3 py-1 font-display text-sm font-black text-gold ring-1 ring-gold/40" data-testid="live-score">
            {score}
          </span>
          <button type="button" className="grid size-10 place-items-center rounded-full bg-white/10" onClick={toggle} aria-label={muted ? "Hidupkan bunyi" : "Matikan bunyi"}>
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>

      {/* Pemasa */}
      {phase !== "countdown" && (
        <div className="relative mx-3 mt-3 flex items-center gap-3 sm:mx-6">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Masa berbaki" aria-valuemin={0} aria-valuemax={quiz.time_limit} aria-valuenow={secs}>
            <div
              className={`h-full rounded-full transition-[width] duration-100 ${pct < 0.25 ? "bg-rose-500" : pct < 0.5 ? "bg-amber-400" : "bg-cyan-electric"}`}
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          <span className={`w-10 text-right font-display text-lg font-black ${secs <= 5 && phase === "question" ? "animate-pulse text-rose-400" : "text-white"}`}>{secs}</span>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4 pt-4 sm:px-6">
        {phase === "countdown" ? (
          <div className="grid flex-1 place-items-center">
            <span key={count} className="animate-pop font-display text-8xl font-black text-gold-gradient sm:text-9xl">{count > 0 ? count : "MULA!"}</span>
          </div>
        ) : phase === "submitting" ? (
          <div className="grid flex-1 place-items-center" role="status">
            <div className="flex flex-col items-center gap-3">
              <span className="size-12 animate-spin rounded-full border-4 border-cyan-electric/30 border-t-cyan-electric" />
              <p className="text-sm text-ink-muted">Mengira skor…</p>
            </div>
          </div>
        ) : (
          current && (
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4">
              <div key={current.q.id} className="glass animate-pop flex flex-col items-center gap-3 p-4 text-center sm:p-6">
                {current.q.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={current.q.image_url} alt="Gambar soalan" className="max-h-[28vh] w-auto rounded-xl object-contain" />
                )}
                <h2 className="text-lg font-bold leading-snug sm:text-2xl">{current.q.text}</h2>
              </div>

              <div className={`grid flex-1 content-start gap-3 ${current.q.type === "tf" ? "grid-cols-2" : "grid-cols-1 min-[480px]:grid-cols-2"}`}>
                {current.opts.map((o, i) => {
                  const fb = phase === "feedback" && !checking && last?.q.id === current.q.id ? last : null;
                  const isAnswer = fb?.answer === o.orig;
                  const isPicked = picked === i;
                  const tf = current.q.type === "tf";
                  const base = tf ? (o.orig === 0 ? "from-emerald-500 to-green-700" : "from-rose-500 to-rose-700") : TILE[i % 4].bg;
                  const state = fb ? (isAnswer ? "ring-4 ring-emerald-300 scale-[1.02]" : isPicked ? "animate-shake ring-4 ring-rose-300 opacity-80" : "opacity-35") : isPicked ? "ring-4 ring-white" : "";
                  return (
                    <button
                      key={`${current.q.id}-${o.orig}`}
                      type="button"
                      disabled={phase !== "question"}
                      onClick={() => void answer(o.orig, i)}
                      className={`relative flex items-center gap-3 rounded-2xl bg-gradient-to-br px-4 text-left font-bold text-white shadow-lg transition active:scale-[0.98] disabled:cursor-default ${tf ? "min-h-28 justify-center text-xl sm:min-h-36 sm:text-2xl" : "min-h-16 text-base sm:min-h-20 sm:text-lg"} ${base} ${state}`}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-black/25 text-lg" aria-hidden="true">
                        {tf ? (o.orig === 0 ? "✓" : "✗") : TILE[i % 4].shape}
                      </span>
                      <span className="min-w-0">
                        <span className="sr-only">{tf ? "" : `${LETTERS[i]}. `}</span>
                        {o.text}
                      </span>
                      {fb && isAnswer && <span className="ml-auto text-2xl" aria-hidden="true">✅</span>}
                      {fb && isPicked && !isAnswer && <span className="ml-auto text-2xl" aria-hidden="true">❌</span>}
                    </button>
                  );
                })}
              </div>

              {phase === "feedback" && (
                <div className="sticky bottom-0 mt-auto" aria-live="assertive">
                  {checking ? (
                    <p className="glass p-4 text-center text-sm text-ink-muted" role="status">Menyemak jawapan…</p>
                  ) : (
                    last && (
                      <div className={`glass animate-pop flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${last.correct ? "border-emerald-400/60" : last.correct === false ? "border-rose-400/60" : "border-amber-400/60"}`}>
                        <div className="flex-1">
                          <p className={`text-lg font-black ${last.correct ? "text-emerald-300" : last.correct === false ? "text-rose-300" : "text-amber-200"}`}>
                            {last.correct
                              ? `Betul! +${last.points}`
                              : last.correct === false
                                ? last.choice < 0
                                  ? "Masa tamat!"
                                  : "Alamak, salah!"
                                : "Tiada sambungan — jawapan akan disemak di akhir kuiz."}
                          </p>
                          {last.correct === false && last.answer !== null && (
                            <p className="text-sm text-white/85">
                              Jawapan betul: <strong className="text-emerald-300">{last.q.options[last.answer]}</strong>
                            </p>
                          )}
                          {last.explanation && <p className="mt-1 text-sm text-white/75">💡 {last.explanation}</p>}
                        </div>
                        <button type="button" className="btn-primary !min-h-12 shrink-0" onClick={() => void next()} autoFocus>
                          {idx + 1 < order.length ? "Seterusnya ›" : "Lihat Keputusan 🏁"}
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Mata terapung & konfeti */}
      {phase === "feedback" && last?.correct && (
        <span key={`pts-${idx}`} className="animate-rise pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 font-display text-4xl font-black text-gold drop-shadow-lg" aria-hidden="true">
          +{last.points}
        </span>
      )}
      {burst && (
        <div key={burst.id} className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden="true">
          {burst.parts.map((p, i) => (
            <span
              key={i}
              className="animate-confetti absolute block h-3 w-2 rounded-sm"
              style={{ background: p.color, animationDelay: `${p.delay}s`, ["--dx" as string]: `${p.dx}px`, ["--dy" as string]: `${p.dy}px`, ["--rot" as string]: `${p.rot}deg` }}
            />
          ))}
        </div>
      )}

      {confirmExit && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="exit-title" className="absolute inset-0 z-10 grid place-items-center bg-black/70 p-4">
          <div className="glass w-full max-w-sm space-y-4 p-5 text-center">
            <h2 id="exit-title" className="text-lg font-bold">Keluar dari kuiz?</h2>
            <p className="text-sm text-ink-muted">Skor anda tidak akan disimpan.</p>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setConfirmExit(false)} autoFocus>Teruskan main</button>
              <button
                type="button"
                className="btn-danger flex-1"
                onClick={() => {
                  setConfirmExit(false);
                  setBurst(null);
                  setPhase("intro");
                }}
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Leaderboard({ board, me }: { board: LeaderEntry[]; me?: string }) {
  const medal = ["🥇", "🥈", "🥉"];
  return (
    <section className="glass p-5" aria-labelledby="board-title">
      <h2 id="board-title" className="mb-3 flex items-center gap-2 font-bold">🏆 Papan Skor</h2>
      {board.length === 0 ? (
        <p className="text-sm text-ink-muted">Belum ada pemain. Jadilah yang pertama!</p>
      ) : (
        <ol className="space-y-1.5">
          {board.map((e, i) => (
            <li
              key={e.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${e.id === me ? "bg-cyan-electric/15 ring-1 ring-cyan-electric/60" : i < 3 ? "bg-white/5" : ""}`}
            >
              <span className="w-7 text-center font-display font-black text-gold">{medal[i] ?? i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {e.name}
                  {e.id === me && <span className="ml-1 text-xs text-cyan-electric">(anda)</span>}
                </span>
                {e.kelas && <span className="block truncate text-xs text-ink-muted">{e.kelas}</span>}
              </span>
              <span className="text-right">
                <span className="block font-display font-black text-cyan-electric">{e.score}</span>
                <span className="block text-[11px] text-ink-muted">{e.correct}/{e.total}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
