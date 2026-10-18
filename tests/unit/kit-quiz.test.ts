import { describe, expect, it } from "vitest";
import { buildSubjectTree, descendantIds, flattenTree, isAllowedLink, linkInfo, parseYouTubeUrl, resourceHref, resourceThumb, subjectPath, ytEmbed, type Subject } from "@/lib/kit";
import { cleanPlayerText, pointsFor, rankLeaders, scoreAttempt, starsFor } from "@/lib/quiz";
import { quizInputSchema, videoInputSchema } from "@/lib/validation";
import { createAttemptToken, verifyAttemptToken } from "@/lib/quiz-token";

describe("parseYouTubeUrl", () => {
  const ID = "dQw4w9WgXcQ";
  it("accepts common YouTube link formats", () => {
    expect(parseYouTubeUrl(`https://www.youtube.com/watch?v=${ID}`)).toEqual({ id: ID, start: 0 });
    expect(parseYouTubeUrl(`https://youtu.be/${ID}?si=abc`)).toEqual({ id: ID, start: 0 });
    expect(parseYouTubeUrl(`https://youtu.be/${ID}?t=90`)).toEqual({ id: ID, start: 90 });
    expect(parseYouTubeUrl(`https://m.youtube.com/watch?v=${ID}&t=1m30s`)).toEqual({ id: ID, start: 90 });
    expect(parseYouTubeUrl(`https://www.youtube.com/shorts/${ID}`)).toEqual({ id: ID, start: 0 });
    expect(parseYouTubeUrl(`https://www.youtube.com/embed/${ID}?start=12`)).toEqual({ id: ID, start: 12 });
    expect(parseYouTubeUrl(`https://www.youtube.com/live/${ID}`)).toEqual({ id: ID, start: 0 });
    expect(parseYouTubeUrl(`youtube.com/watch?v=${ID}`)).toEqual({ id: ID, start: 0 });
    expect(parseYouTubeUrl(ID)).toEqual({ id: ID, start: 0 });
  });
  it("rejects other hosts and malformed ids", () => {
    expect(parseYouTubeUrl(`https://evil.com/watch?v=${ID}`)).toBeNull();
    expect(parseYouTubeUrl(`https://youtube.com.evil.com/watch?v=${ID}`)).toBeNull();
    expect(parseYouTubeUrl("javascript:alert(1)")).toBeNull();
    expect(parseYouTubeUrl("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(parseYouTubeUrl("https://www.youtube.com/playlist?list=PL123")).toBeNull();
    expect(parseYouTubeUrl("")).toBeNull();
  });
  it("builds privacy-enhanced embed url", () => {
    expect(ytEmbed(ID, 30)).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?.*start=30/);
  });
});

const sub = (id: string, parent: string | null, order = 0): Subject => ({
  id,
  name: id,
  slug: id,
  description: null,
  icon: null,
  parent_id: parent,
  display_order: order,
  created_at: "",
  updated_at: "",
});

describe("subject tree", () => {
  const subjects = [sub("alat", null, 1), sub("strings", "alat", 1), sub("violin", "strings"), sub("woodwind", "alat", 2), sub("komputer", null, 2), sub("orphan", "missing")];
  const videos = [
    { subject_id: "violin", status: "published" as const },
    { subject_id: "violin", status: "draft" as const },
    { subject_id: "woodwind", status: "published" as const },
    { subject_id: "komputer", status: "published" as const },
  ];
  it("nests children, counts published videos including descendants", () => {
    const tree = buildSubjectTree(subjects, videos);
    expect(tree.map((n) => n.id).sort()).toEqual(["alat", "komputer", "orphan"]); // induk hilang → jadi subjek utama
    const alat = tree.find((n) => n.id === "alat")!;
    expect(alat.children.map((c) => c.id)).toEqual(["strings", "woodwind"]);
    expect(alat.video_count).toBe(2);
    expect(alat.children[0].children[0].depth).toBe(2);
    expect(descendantIds(alat).sort()).toEqual(["alat", "strings", "violin", "woodwind"]);
    expect(flattenTree(tree)).toHaveLength(6);
  });
  it("counts drafts for admin view", () => {
    expect(buildSubjectTree(subjects, videos, false).find((n) => n.id === "alat")!.video_count).toBe(3);
    expect(buildSubjectTree(subjects, videos, false).find((n) => n.id === "alat")!.children[0].video_count).toBe(2);
  });
  it("survives cycles", () => {
    const tree = buildSubjectTree([sub("a", "b"), sub("b", "a"), sub("c", null)]);
    expect(tree.map((n) => n.id)).toEqual(["c"]);
  });
  it("builds breadcrumb path", () => {
    expect(subjectPath(subjects, "violin").map((s) => s.id)).toEqual(["alat", "strings", "violin"]);
  });
});

describe("quiz scoring", () => {
  const qs = [
    { id: "a", answer: 1, options: ["x", "y"] },
    { id: "b", answer: 0, options: ["x", "y"] },
    { id: "c", answer: 2, options: ["x", "y", "z"] },
  ];
  it("awards base + speed + combo points", () => {
    expect(pointsFor(0, 20000, 1)).toBe(150);
    expect(pointsFor(20000, 20000, 1)).toBe(100);
    expect(pointsFor(10000, 20000, 2)).toBe(135);
    expect(pointsFor(99999, 20000, 9)).toBe(140); // combo dihadkan
  });
  it("recomputes score server-side, ignoring duplicates and unknown questions", () => {
    const r = scoreAttempt(
      qs,
      [
        { q: "a", choice: 1, ms: 20000 },
        { q: "a", choice: 1, ms: 0 }, // berulang → diabaikan
        { q: "zzz", choice: 0, ms: 0 }, // tiada → diabaikan
        { q: "b", choice: 0, ms: 20000 },
        { q: "c", choice: 0, ms: 5000 },
      ],
      20,
    );
    expect(r).toMatchObject({ score: 100 + 110, correct: 2, total: 3, bestStreak: 2, wrong: ["c"] });
  });
  it("treats unanswered questions as wrong", () => {
    expect(scoreAttempt(qs, [], 20)).toMatchObject({ score: 0, correct: 0, wrong: ["a", "b", "c"] });
  });
  it("stars and ranking", () => {
    expect(starsFor(9, 10)).toBe(3);
    expect(starsFor(6, 10)).toBe(2);
    expect(starsFor(1, 10)).toBe(1);
    expect(starsFor(0, 10)).toBe(0);
    const e = (id: string, score: number, correct: number, duration_ms: number) => ({ id, name: id, kelas: "", score, correct, total: 3, duration_ms });
    expect(rankLeaders([e("a", 100, 1, 5), e("b", 200, 2, 9), e("c", 200, 2, 3)]).map((x) => x.id)).toEqual(["c", "b", "a"]);
  });
  it("cleans player names", () => {
    expect(cleanPlayerText("  <b>Ali</b>\u0000  bin   Abu ", 40)).toBe("bAli/b bin Abu");
    expect(cleanPlayerText("x".repeat(99), 40)).toHaveLength(40);
  });
});

describe("quiz & video validation", () => {
  const base = { title: "Kuiz Strings", description: "", time_limit: "20", status: "draft" };
  it("accepts mcq & tf, compacts empty options and remaps answer", () => {
    const r = quizInputSchema.parse({
      ...base,
      shuffle: "on",
      questions: [
        { id: "q1", type: "mcq", text: "Paling besar?", options: ["Violin", "", "Double bass", ""], answer: 2, image_url: "", explanation: "" },
        { id: "q2", type: "tf", text: "Cello lebih besar daripada violin.", options: [], answer: 0 },
      ],
    });
    expect(r.shuffle).toBe(true);
    expect(r.questions[0]).toMatchObject({ options: ["Violin", "Double bass"], answer: 1, image_url: null, explanation: null });
    expect(r.questions[1]).toMatchObject({ options: ["Betul", "Salah"], answer: 0 });
  });
  it("rejects mcq with < 2 options, answer on empty option, unsafe image urls", () => {
    const one = (q: object) => quizInputSchema.safeParse({ ...base, questions: [{ id: "q1", type: "mcq", text: "S?", answer: 0, ...q }] }).success;
    expect(one({ options: ["A", "", "", ""] })).toBe(false);
    expect(one({ options: ["A", "B", "", ""], answer: 3 })).toBe(false);
    expect(one({ options: ["A", "B"], image_url: "javascript:alert(1)" })).toBe(false);
    expect(one({ options: ["A", "B"], image_url: "/media/abc" })).toBe(true);
    expect(one({ options: ["A", "B"], text: "" })).toBe(false);
  });
  it("limits question count", () => {
    const qs = Array.from({ length: 51 }, (_, i) => ({ id: `q${i}`, type: "tf", text: "S", options: [], answer: 0 }));
    expect(quizInputSchema.safeParse({ ...base, questions: qs }).success).toBe(false);
  });
  it("video requires url and subject", () => {
    expect(videoInputSchema.safeParse({ url: "", subject_id: "strings" }).success).toBe(false);
    expect(videoInputSchema.safeParse({ url: "https://youtu.be/dQw4w9WgXcQ", subject_id: "" }).success).toBe(false);
    expect(videoInputSchema.parse({ url: "https://youtu.be/dQw4w9WgXcQ", subject_id: "strings" }).status).toBe("published");
  });
});

describe("attempt token", () => {
  it("is bound to quiz, time-limited and tamper-proof", () => {
    process.env.ADMIN_PASSWORD = "ujian";
    const t = createAttemptToken("quiz1", 1_000_000);
    expect(verifyAttemptToken(t, "quiz1", 1_005_000)?.start).toBe(1_000_000);
    expect(verifyAttemptToken(t, "quiz2", 1_005_000)).toBeNull();
    expect(verifyAttemptToken(t, "quiz1", 1_000_000 + 4 * 3600_000)).toBeNull();
    expect(verifyAttemptToken(t.replace("1000000", "1000001"), "quiz1", 1_005_000)).toBeNull();
    expect(verifyAttemptToken("rubbish", "quiz1")).toBeNull();
  });
});

describe("web links (non-YouTube)", () => {
  it("recognises Claude artifacts & common sites", () => {
    expect(linkInfo("https://claude.ai/public/artifacts/abc")).toMatchObject({ isClaude: true, label: "Artifak Claude", host: "claude.ai" });
    expect(linkInfo("https://www.musictheory.net/lessons")).toMatchObject({ icon: "🎼", host: "musictheory.net" });
    expect(linkInfo("https://kembaramuzika.vercel.app/")).toMatchObject({ label: "Aplikasi web" });
    expect(linkInfo("https://example.com")).toMatchObject({ label: "Laman web", isClaude: false });
  });
  it("only allows public https links", () => {
    expect(isAllowedLink("https://claude.ai/public/artifacts/abc")).toBe(true);
    expect(isAllowedLink("http://example.com")).toBe(false);
    expect(isAllowedLink("javascript:alert(1)")).toBe(false);
    expect(isAllowedLink("https://localhost:3000")).toBe(false);
    expect(isAllowedLink("https://192.168.1.10/admin")).toBe(false);
    expect(isAllowedLink("https://10.0.0.1")).toBe(false);
    expect(isAllowedLink("https://user:pw@example.com")).toBe(false);
    expect(isAllowedLink("https://fcbarcelona.com")).toBe(true);
  });
  it("href & thumbnail per kind", () => {
    expect(resourceHref({ kind: "link", url: "https://a.com/x", youtube_id: "", start_seconds: 0 })).toBe("https://a.com/x");
    expect(resourceHref({ kind: "youtube", url: "", youtube_id: "dQw4w9WgXcQ", start_seconds: 5 })).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5s");
    expect(resourceThumb({ kind: "link", youtube_id: "", thumbnail_url: null })).toBeNull();
    expect(resourceThumb({ kind: "youtube", youtube_id: "dQw4w9WgXcQ", thumbnail_url: null })).toContain("i.ytimg.com");
  });
});
