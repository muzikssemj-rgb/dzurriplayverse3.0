"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminPassword, isDataConfigured } from "@/lib/env";
import { createSessionToken, hashKey, passwordMatches, SESSION_COOKIE } from "@/lib/session";
import { ADMIN_ABSOLUTE_TIMEOUT_MS, ADMIN_SEEN_COOKIE } from "@/lib/session-policy";
import { clearAttempts, countRecentAttempts, recordAttempt } from "@/lib/data/store";
import type { ActionState } from "@/lib/actions/state";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_IP = 5;
const MAX_FAILS_GLOBAL = 30;

function clientIp(h: Headers) {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!getAdminPassword()) return { error: "ADMIN_PASSWORD belum ditetapkan di Vercel. Rujuk README." };
  if (!isDataConfigured()) return { error: "Pangkalan data belum disambungkan (FIREBASE_SERVICE_ACCOUNT)." };
  const password = String(formData.get("password") ?? "").slice(0, 200);

  const ipKey = hashKey("ip", clientIp(await headers()));
  const globalKey = hashKey("global", "all");
  const since = Date.now() - WINDOW_MS;
  try {
    const [ipFails, allFails] = await Promise.all([countRecentAttempts(ipKey, since), countRecentAttempts(globalKey, since)]);
    if (ipFails >= MAX_FAILS_PER_IP || allFails >= MAX_FAILS_GLOBAL) {
      return { error: "Terlalu banyak percubaan. Sila cuba lagi selepas 15 minit." };
    }
  } catch {
    return { error: "Log masuk tidak tersedia buat masa ini. Cuba lagi sebentar." };
  }

  if (!password || !passwordMatches(password)) {
    await Promise.all([recordAttempt(ipKey), recordAttempt(globalKey)]).catch(() => {});
    return { error: "Kata laluan tidak sah." };
  }

  await clearAttempts(ipKey).catch(() => {});
  const token = createSessionToken();
  if (!token) return { error: "Log masuk gagal." };
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: ADMIN_ABSOLUTE_TIMEOUT_MS / 1000 });
  jar.set(ADMIN_SEEN_COOKIE, String(Date.now()), { httpOnly: true, sameSite: "lax", secure, path: "/" });
  redirect("/admin/dashboard");
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(ADMIN_SEEN_COOKIE);
  redirect("/admin/login?reason=logout");
}
