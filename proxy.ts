import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { ADMIN_SEEN_COOKIE, isIdleExpired } from "@/lib/session-policy";

/**
 * Proxy untuk laluan admin: semak cookie sesi bertandatangan, kuatkuasakan tamat
 * sesi (30 min idle / 12 jam), kemas kini masa aktiviti terakhir.
 * Setiap halaman, Server Action dan Route Handler admin menyemak semula di server.
 */
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApi = path.startsWith("/api/");
  const isLogin = path === "/admin/login";
  const secure = process.env.NODE_ENV === "production";

  const since = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const seen = Number(request.cookies.get(ADMIN_SEEN_COOKIE)?.value);
  const valid = since !== null && !isIdleExpired(seen);

  if (isLogin) {
    if (valid) return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    return NextResponse.next();
  }

  if (!valid) {
    const res = isApi
      ? NextResponse.json({ error: "Tidak dibenarkan." }, { status: 401 })
      : NextResponse.redirect(new URL(since !== null ? "/admin/login?reason=expired" : "/admin/login", request.url));
    res.cookies.delete(SESSION_COOKIE);
    res.cookies.delete(ADMIN_SEEN_COOKIE);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }

  const res = NextResponse.next();
  res.cookies.set(ADMIN_SEEN_COOKIE, String(Date.now()), { httpOnly: true, sameSite: "lax", secure, path: "/" });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
