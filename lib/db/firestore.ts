import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, type Firestore } from "firebase-admin/firestore";
import type { ServiceAccount } from "@/lib/env";
import type { Db, Doc, Row } from "@/lib/db/types";

const g = globalThis as unknown as { __dzFirestore?: Firestore };

function firestore(sa: ServiceAccount): Firestore {
  if (g.__dzFirestore) return g.__dzFirestore;
  const app =
    getApps().find((a) => a.name === "dz") ??
    initializeApp(
      {
        credential: cert({ projectId: sa.project_id, clientEmail: sa.client_email, privateKey: sa.private_key }),
        projectId: sa.project_id,
      },
      "dz",
    );
  const db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });
  g.__dzFirestore = db;
  return db;
}

/**
 * Akses Firestore melalui Admin SDK (server sahaja). Peraturan keselamatan Firestore
 * boleh kekal "deny all" — pelayar tidak pernah bercakap terus dengan Firestore.
 */
export function createFirestoreDb(sa: ServiceAccount): Db {
  const db = firestore(sa);
  const rows = <T>(snap: FirebaseFirestore.QuerySnapshot): Row<T>[] =>
    snap.docs.map((d) => ({ id: d.id, data: d.data() as T }));
  return {
    async list<T>(col: string) {
      return rows<T>(await db.collection(col).get());
    },
    async get<T>(col: string, id: string) {
      const s = await db.collection(col).doc(id).get();
      return s.exists ? (s.data() as T) : null;
    },
    async set(col: string, id: string, data: Doc, opts?: { merge?: boolean }) {
      await db.collection(col).doc(id).set(data, { merge: Boolean(opts?.merge) });
    },
    async create(col: string, data: Doc) {
      const ref = await db.collection(col).add(data);
      return ref.id;
    },
    async update(col: string, id: string, patch: Doc) {
      try {
        await db.collection(col).doc(id).update(patch);
        return true;
      } catch (e) {
        if ((e as { code?: number }).code === 5) return false; // NOT_FOUND
        throw e;
      }
    },
    async increment(col: string, id: string, field: string, by: number) {
      try {
        await db.collection(col).doc(id).update({ [field]: FieldValue.increment(by) });
      } catch {
        /* dokumen tiada — abaikan */
      }
    },
    async delete(col: string, id: string) {
      const ref = db.collection(col).doc(id);
      const s = await ref.get();
      if (!s.exists) return false;
      await ref.delete();
      return true;
    },
    async where<T>(col: string, field: string, value: unknown) {
      return rows<T>(await db.collection(col).where(field, "==", value).get());
    },
    async latest<T>(col: string, field: string, limit: number) {
      return rows<T>(await db.collection(col).orderBy(field, "desc").limit(limit).get());
    },
  };
}
