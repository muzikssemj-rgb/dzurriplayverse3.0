"use client";

/**
 * Data peranti sahaja (localStorage) — kegemaran & baru dimainkan.
 * Tiada akaun pemain; data ini kekal pada pelayar/peranti ini sahaja.
 * Semua akses dibalut try/catch (mod peribadi / storan disekat).
 */
const FAV_KEY = "dz:favorites";
const RECENT_KEY = "dz:recent";
const EVENT = "dz:storage";

function read(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string").slice(0, 60) : [];
  } catch {
    return [];
  }
}

function write(key: string, value: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value.slice(0, 60)));
  } catch {
    /* abaikan */
  }
  window.dispatchEvent(new Event(EVENT));
}

export const getFavorites = () => read(FAV_KEY);
export const isFavorite = (id: string) => read(FAV_KEY).includes(id);
export function toggleFavorite(id: string): boolean {
  const list = read(FAV_KEY);
  const has = list.includes(id);
  write(FAV_KEY, has ? list.filter((x) => x !== id) : [id, ...list]);
  return !has;
}

export const getRecent = () => read(RECENT_KEY);
export function pushRecent(id: string) {
  write(RECENT_KEY, [id, ...read(RECENT_KEY).filter((x) => x !== id)].slice(0, 12));
}
export function clearRecent() {
  write(RECENT_KEY, []);
}

export function subscribeStorage(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
