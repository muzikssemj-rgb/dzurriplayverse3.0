import "server-only";
import { getServiceAccount, isLocalStoreMode } from "@/lib/env";
import { createFirestoreDb } from "@/lib/db/firestore";
import { createLocalDb } from "@/lib/db/local";
import type { Db } from "@/lib/db/types";

let cached: Db | null = null;

/** Pulangkan pangkalan data aktif, atau null jika belum dikonfigurasi. */
export function getDb(): Db | null {
  if (cached) return cached;
  const sa = getServiceAccount();
  try {
    if (sa) cached = createFirestoreDb(sa);
    else if (isLocalStoreMode()) cached = createLocalDb();
  } catch (e) {
    // Contoh: private_key rosak semasa disalin ke Vercel
    console.error("[db] Firebase init failed:", e instanceof Error ? e.message : e);
    cached = null;
  }
  return cached;
}
