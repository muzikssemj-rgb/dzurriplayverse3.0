import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ADMIN_ABSOLUTE_TIMEOUT_MS } from "@/lib/session-policy";

/**
 * Sesi pemilik: cookie HttpOnly bertandatangan HMAC-SHA256.
 * Kunci diterbitkan daripada ADMIN_PASSWORD (+ SESSION_SECRET jika ditetapkan),
 * jadi menukar kata laluan di Vercel membatalkan semua sesi lama.
 * Fail ini sengaja tidak mengimport "server-only" supaya boleh digunakan oleh proxy.ts.
 */
export const SESSION_COOKIE = "dz_admin";

function sessionKey(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHash("sha256")
    .update(`dz-session|${pw}|${process.env.SESSION_SECRET ?? ""}`)
    .digest("hex");
}

function sign(payload: string, key: string) {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function createSessionToken(nowMs = Date.now()): string | null {
  const key = sessionKey();
  if (!key) return null;
  const payload = `${nowMs}.${randomBytes(12).toString("base64url")}`;
  return `${payload}.${sign(payload, key)}`;
}

/** Pulangkan masa mula sesi (ms) jika token sah, atau null. */
export function verifySessionToken(token: string | undefined | null, nowMs = Date.now()): number | null {
  const key = sessionKey();
  if (!key || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [issued, nonce, sig] = parts;
  const expected = sign(`${issued}.${nonce}`, key);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const start = Number(issued);
  if (!Number.isFinite(start) || start > nowMs + 60_000 || nowMs - start > ADMIN_ABSOLUTE_TIMEOUT_MS) return null;
  return start;
}

/** Bandingan kata laluan masa-malar (melalui hash supaya panjang sama). */
export function passwordMatches(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(pw).digest();
  return timingSafeEqual(a, b);
}

export function hashKey(kind: string, value: string): string {
  return createHash("sha256")
    .update(`dz-rl|${kind}|${value}|${process.env.SESSION_SECRET ?? ""}`)
    .digest("hex")
    .slice(0, 40);
}
