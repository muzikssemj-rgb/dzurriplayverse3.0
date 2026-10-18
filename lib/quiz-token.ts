import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Token cubaan kuiz: merekod masa mula di SERVER supaya tempoh menjawab tidak boleh dipalsukan.
 * Format: <quizId>.<startMs>.<nonce>.<sig>
 */
const MAX_AGE_MS = 3 * 60 * 60 * 1000;

function key(): string {
  return createHash("sha256")
    .update(`dz-quiz|${process.env.ADMIN_PASSWORD ?? "no-admin"}|${process.env.SESSION_SECRET ?? ""}`)
    .digest("hex");
}
const sign = (p: string) => createHmac("sha256", key()).update(p).digest("base64url");

export function createAttemptToken(quizId: string, nowMs = Date.now()): string {
  const payload = `${quizId}.${nowMs}.${randomBytes(9).toString("base64url")}`;
  return `${payload}.${sign(payload)}`;
}

/** Pulangkan { start, nonce } jika token sah untuk kuiz ini. */
export function verifyAttemptToken(token: unknown, quizId: string, nowMs = Date.now()): { start: number; nonce: string } | null {
  if (typeof token !== "string" || token.length > 200) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [id, startRaw, nonce, sig] = parts;
  if (id !== quizId) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(`${id}.${startRaw}.${nonce}`));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const start = Number(startRaw);
  if (!Number.isFinite(start) || start > nowMs + 5_000 || nowMs - start > MAX_AGE_MS) return null;
  return { start, nonce };
}
