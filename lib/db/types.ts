/** Antara muka pangkalan data minimum — dilaksanakan oleh Firestore (production) dan storan tempatan (dev/ujian). */
export type Doc = Record<string, unknown>;
export type Row<T = Doc> = { id: string; data: T };

export interface Db {
  list<T = Doc>(col: string): Promise<Row<T>[]>;
  get<T = Doc>(col: string, id: string): Promise<T | null>;
  set(col: string, id: string, data: Doc, opts?: { merge?: boolean }): Promise<void>;
  create(col: string, data: Doc): Promise<string>;
  /** Kemas kini dokumen sedia ada. Pulangkan false jika dokumen tiada. */
  update(col: string, id: string, patch: Doc): Promise<boolean>;
  increment(col: string, id: string, field: string, by: number): Promise<void>;
  /** Pulangkan false jika dokumen tiada. */
  delete(col: string, id: string): Promise<boolean>;
  /** Pertanyaan medan tunggal sahaja (tidak memerlukan indeks komposit Firestore). */
  where<T = Doc>(col: string, field: string, value: unknown): Promise<Row<T>[]>;
  latest<T = Doc>(col: string, field: string, limit: number): Promise<Row<T>[]>;
}
