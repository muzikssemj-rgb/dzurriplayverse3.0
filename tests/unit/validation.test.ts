import { describe, expect, it } from "vitest";
import {
  categoryInputSchema,
  detectImageType,
  evaluateFramePolicy,
  gameInputSchema,
  normalizeSafeUrl,
  parseTags,
  passwordSchema,
  slugify,
} from "@/lib/validation";
import { isIdleExpired, ADMIN_IDLE_TIMEOUT_MS, ADMIN_ABSOLUTE_TIMEOUT_MS } from "@/lib/session-policy";
import { createSessionToken, verifySessionToken, passwordMatches } from "@/lib/session";

describe("normalizeSafeUrl", () => {
  it("accepts https and internal paths", () => {
    expect(normalizeSafeUrl("https://example.com/game")).toBe("https://example.com/game");
    expect(normalizeSafeUrl("  https://Example.com  ")).toBe("https://example.com/");
    expect(normalizeSafeUrl("/play/music-quest/index.html")).toBe("/play/music-quest/index.html");
  });
  it.each([
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox",
    "file:///etc/passwd",
    "http://insecure.example",
    "//evil.example/x",
    "/\\evil.example",
    "https://user:pass@example.com",
    "https://exa mple.com",
    "java\tscript:alert(1)",
    "",
    "ftp://example.com",
  ])("rejects %s", (u) => {
    expect(normalizeSafeUrl(u)).toBeNull();
  });
});

describe("slugify & tags", () => {
  it("slugifies", () => {
    expect(slugify("Music Quest!")).toBe("music-quest");
    expect(slugify("AR & VR World")).toBe("ar-and-vr-world");
    expect(slugify("  Café  Déjà ")).toBe("cafe-deja");
  });
  it("parses tags", () => {
    expect(parseTags("Muzik, nota ,  , NOTA, irama")).toEqual(["muzik", "nota", "irama"]);
    expect(parseTags(Array.from({ length: 15 }, (_, i) => `t${i}`).join(","))).toHaveLength(10);
  });
});

describe("gameInputSchema", () => {
  const base = { title: "My Game", game_url: "https://example.com", launch_mode: "embedded" };
  it("parses a valid game", () => {
    const r = gameInputSchema.safeParse({ ...base, tags: "a, b", is_featured: "on", display_order: "5", difficulty: "easy" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.tags).toEqual(["a", "b"]);
      expect(r.data.is_featured).toBe(true);
      expect(r.data.display_order).toBe(5);
      expect(r.data.thumbnail_url).toBeNull();
      expect(r.data.category_id).toBeNull();
    }
  });
  it("rejects dangerous game_url and thumbnail", () => {
    expect(gameInputSchema.safeParse({ ...base, game_url: "javascript:alert(1)" }).success).toBe(false);
    expect(gameInputSchema.safeParse({ ...base, thumbnail_url: "data:image/svg+xml,<svg onload=alert(1)>" }).success).toBe(false);
  });
  it("rejects invalid launch mode, status and difficulty", () => {
    expect(gameInputSchema.safeParse({ ...base, launch_mode: "popup" }).success).toBe(false);
    expect(gameInputSchema.safeParse({ ...base, status: "hacked" }).success).toBe(false);
    expect(gameInputSchema.safeParse({ ...base, difficulty: "insane" }).success).toBe(false);
    expect(gameInputSchema.safeParse({ ...base, display_order: "-1" }).success).toBe(false);
  });
  it("rejects too long title", () => {
    expect(gameInputSchema.safeParse({ ...base, title: "x".repeat(121) }).success).toBe(false);
  });
  it("category schema", () => {
    expect(categoryInputSchema.safeParse({ name: "Puzzle World" }).success).toBe(true);
    expect(categoryInputSchema.safeParse({ name: "P", image_url: "javascript:x" }).success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("enforces strength", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("alllowercase123").success).toBe(false);
    expect(passwordSchema.safeParse("Str0ngPassword!").success).toBe(true);
  });
});

describe("detectImageType", () => {
  it("detects by magic bytes, not extension", () => {
    expect(detectImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mime).toBe("image/png");
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.mime).toBe("image/jpeg");
    expect(detectImageType(new TextEncoder().encode("GIF89a....."))?.mime).toBe("image/gif");
    expect(detectImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))?.mime).toBe("image/webp");
    expect(detectImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("MZ\x90\0 executable"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("#!/bin/sh\nrm -rf /"))).toBeNull();
  });
});

describe("evaluateFramePolicy", () => {
  const me = "https://dzurri-playverse.vercel.app";
  it("blocks XFO deny/sameorigin", () => {
    expect(evaluateFramePolicy({ xFrameOptions: "DENY", csp: null }, me).embeddable).toBe(false);
    expect(evaluateFramePolicy({ xFrameOptions: "SAMEORIGIN", csp: null }, me).embeddable).toBe(false);
  });
  it("handles frame-ancestors", () => {
    expect(evaluateFramePolicy({ xFrameOptions: null, csp: "default-src 'self'; frame-ancestors 'none'" }, me).embeddable).toBe(false);
    expect(evaluateFramePolicy({ xFrameOptions: null, csp: "frame-ancestors 'self' https://other.com" }, me).embeddable).toBe(false);
    expect(evaluateFramePolicy({ xFrameOptions: null, csp: "frame-ancestors *" }, me).embeddable).toBe(true);
    expect(evaluateFramePolicy({ xFrameOptions: null, csp: "frame-ancestors https://*.vercel.app" }, me).embeddable).toBe(true);
    expect(evaluateFramePolicy({ xFrameOptions: null, csp: `frame-ancestors ${me}` }, me).embeddable).toBe(true);
  });
  it("allows when no restrictions", () => {
    expect(evaluateFramePolicy({ xFrameOptions: null, csp: "default-src 'self'" }, me).embeddable).toBe(true);
  });
});

describe("admin session", () => {
  it("idle policy", () => {
    const now = 10_000_000_000;
    expect(isIdleExpired(now - 1000, now)).toBe(false);
    expect(isIdleExpired(now - ADMIN_IDLE_TIMEOUT_MS - 1, now)).toBe(true);
    expect(isIdleExpired(null, now)).toBe(true);
    expect(isIdleExpired(NaN, now)).toBe(true);
  });
  it("signs and verifies tokens; rejects tampering, expiry and password change", () => {
    process.env.ADMIN_PASSWORD = "dzurrihensem";
    const t = createSessionToken(Date.now())!;
    expect(verifySessionToken(t)).not.toBeNull();
    const [i, n, sig] = t.split(".");
    expect(verifySessionToken(`${Number(i) + 1}.${n}.${sig}`)).toBeNull();
    expect(verifySessionToken(`${i}.${n}.${sig.slice(0, -2)}xx`)).toBeNull();
    expect(verifySessionToken("garbage")).toBeNull();
    expect(verifySessionToken(createSessionToken(Date.now() - ADMIN_ABSOLUTE_TIMEOUT_MS - 1000))).toBeNull();
    process.env.ADMIN_PASSWORD = "different-password";
    expect(verifySessionToken(t)).toBeNull();
    delete process.env.ADMIN_PASSWORD;
    expect(createSessionToken()).toBeNull();
    expect(verifySessionToken(t)).toBeNull();
  });
  it("password comparison", () => {
    process.env.ADMIN_PASSWORD = "dzurrihensem";
    expect(passwordMatches("dzurrihensem")).toBe(true);
    expect(passwordMatches("dzurrihensem ")).toBe(false);
    expect(passwordMatches("")).toBe(false);
    delete process.env.ADMIN_PASSWORD;
    expect(passwordMatches("dzurrihensem")).toBe(false);
  });
});
