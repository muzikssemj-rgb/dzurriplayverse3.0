import "server-only";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Db, Doc, Row } from "@/lib/db/types";

/**
 * Storan TEMPATAN untuk pembangunan & ujian sahaja (tanpa akaun Firebase).
 * Data disimpan dalam .data/local-db.json. Tidak digunakan di production.
 */
type Store = Record<string, Record<string, Doc>>;
const FILE = process.env.DZ_LOCAL_DB_FILE ?? path.join(/* turbopackIgnore: true */ process.cwd(), ".data", "local-db.json");
const g = globalThis as unknown as { __dzLocal?: Store };

function encode(v: unknown): unknown {
  if (Buffer.isBuffer(v)) return { __buf: v.toString("base64") };
  if (Array.isArray(v)) return v.map(encode);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, encode(x)]));
  return v;
}
function decode(v: unknown): unknown {
  if (v && typeof v === "object" && !Array.isArray(v) && "__buf" in (v as Doc)) return Buffer.from((v as { __buf: string }).__buf, "base64");
  if (Array.isArray(v)) return v.map(decode);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, decode(x)]));
  return v;
}
function load(): Store {
  if (g.__dzLocal) return g.__dzLocal;
  try {
    g.__dzLocal = decode(JSON.parse(fs.readFileSync(FILE, "utf8"))) as Store;
  } catch {
    g.__dzLocal = {};
  }
  return g.__dzLocal!;
}
function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(encode(g.__dzLocal ?? {})));
}
const clone = <T>(d: Doc) => decode(encode(d)) as T;
const colOf = (name: string) => (load()[name] ??= {});

export function createLocalDb(): Db {
  return {
    async list<T>(col: string) {
      return Object.entries(colOf(col)).map(([id, d]) => ({ id, data: clone<T>(d) }));
    },
    async get<T>(col: string, id: string) {
      const d = colOf(col)[id];
      return d ? clone<T>(d) : null;
    },
    async set(col: string, id: string, data: Doc, opts?: { merge?: boolean }) {
      const c = colOf(col);
      c[id] = opts?.merge ? { ...(c[id] ?? {}), ...clone<Doc>(data) } : clone<Doc>(data);
      save();
    },
    async create(col: string, data: Doc) {
      const id = randomBytes(10).toString("hex");
      colOf(col)[id] = clone<Doc>(data);
      save();
      return id;
    },
    async update(col: string, id: string, patch: Doc) {
      const c = colOf(col);
      if (!c[id]) return false;
      c[id] = { ...c[id], ...clone<Doc>(patch) };
      save();
      return true;
    },
    async increment(col: string, id: string, field: string, by: number) {
      const c = colOf(col);
      if (!c[id]) return;
      c[id][field] = (Number(c[id][field]) || 0) + by;
      save();
    },
    async bump(col: string, id: string, counters: Record<string, number>, fields?: Doc) {
      const c = colOf(col);
      const doc = (c[id] ??= {});
      Object.assign(doc, fields ?? {});
      for (const [path, by] of Object.entries(counters)) {
        const parts = path.split(".");
        let node = doc;
        parts.slice(0, -1).forEach((p) => (node = (node[p] ??= {}) as Doc));
        const k = parts[parts.length - 1];
        node[k] = (Number(node[k]) || 0) + by;
      }
      save();
    },
    async delete(col: string, id: string) {
      const c = colOf(col);
      if (!c[id]) return false;
      delete c[id];
      save();
      return true;
    },
    async where<T>(col: string, field: string, value: unknown) {
      return Object.entries(colOf(col))
        .filter(([, d]) => d[field] === value)
        .map(([id, d]) => ({ id, data: clone<T>(d) }));
    },
    async latest<T>(col: string, field: string, limit: number) {
      return Object.entries(colOf(col))
        .sort(([, a], [, b]) => String(b[field] ?? "").localeCompare(String(a[field] ?? "")))
        .slice(0, limit)
        .map(([id, d]) => ({ id, data: clone<T>(d) })) as Row<T>[];
    },
  };
}
