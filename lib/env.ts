import "server-only";

export type ServiceAccount = { project_id: string; client_email: string; private_key: string; private_key_id?: string };

/**
 * FIREBASE_SERVICE_ACCOUNT = kandungan penuh fail JSON "private key" daripada
 * Firebase Console → Project settings → Service accounts (boleh juga dalam base64).
 */
export function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;
  try {
    const text = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const sa = JSON.parse(text) as ServiceAccount;
    if (!sa.project_id || !sa.client_email || !sa.private_key) return null;
    return { ...sa, private_key: sa.private_key.replace(/\\n/g, "\n") };
  } catch {
    return null;
  }
}

/** Mod tempatan (tanpa Firebase) hanya dibenarkan semasa pembangunan / ujian. */
export function isLocalStoreMode(): boolean {
  return !getServiceAccount() && (process.env.NODE_ENV !== "production" || process.env.DZ_LOCAL_STORE === "1");
}

export function isDataConfigured(): boolean {
  return Boolean(getServiceAccount()) || isLocalStoreMode();
}

export function getAdminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

export function getSiteUrl(): string {
  const explicit = process.env.SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
