import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { ADMIN_IDLE_TIMEOUT_MS, ADMIN_SEEN_COOKIE } from "@/lib/session-policy";

export type AdminIdentity = { name: string; since: number };

/** Sah jika cookie sesi bertandatangan betul dan belum tamat (idle/mutlak). */
export async function getAdmin(): Promise<AdminIdentity | null> {
  const jar = await cookies();
  const since = verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!since) return null;
  const seen = Number(jar.get(ADMIN_SEEN_COOKIE)?.value);
  if (!Number.isFinite(seen) || Date.now() - seen > ADMIN_IDLE_TIMEOUT_MS) return null;
  return { name: "Owner", since };
}

export async function requireAdminPage(): Promise<AdminIdentity> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
  }
}

export async function requireAdminAction(): Promise<AdminIdentity> {
  const admin = await getAdmin();
  if (!admin) throw new UnauthorizedError();
  return admin;
}
