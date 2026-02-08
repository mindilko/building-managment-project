/**
 * Shared helpers for reading/writing JSON arrays in localStorage.
 * Preserves existing behavior: empty/missing/invalid → [], replace or append by match.
 */

export function getJsonArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setJsonArray<T>(key: string, list: T[]): void {
  localStorage.setItem(key, JSON.stringify(list));
}

export function replaceOrAppend<T>(list: T[], item: T, match: (t: T) => boolean): T[] {
  const index = list.findIndex(match);
  return index >= 0 ? list.map((t, i) => (i === index ? item : t)) : [...list, item];
}
