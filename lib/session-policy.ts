/** Polisi tamat sesi admin. */
export const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minit tanpa aktiviti
export const ADMIN_ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000; // maksimum 12 jam
export const ADMIN_SEEN_COOKIE = "dz_admin_seen";

export function isIdleExpired(seen: number | null, now = Date.now()): boolean {
  return !seen || Number.isNaN(seen) || now - seen > ADMIN_IDLE_TIMEOUT_MS;
}
