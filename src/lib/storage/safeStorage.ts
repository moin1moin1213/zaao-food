/**
 * Safe versioned storage abstraction for client-side persistence.
 * Prevents hydration crashes, handles invalid JSON gracefully,
 * and maintains schema versions.
 */

const STORAGE_PREFIX = "zaao_storage_";
const CURRENT_VERSION = 1;

interface StorageEnvelope<T> {
  version: number;
  data: T;
  updatedAt: string;
}

export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return fallback;

    const parsed: StorageEnvelope<T> = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || parsed.version !== CURRENT_VERSION) {
      // Discard mismatched version safely
      return fallback;
    }

    return parsed.data ?? fallback;
  } catch (err) {
    console.warn(`[safeStorage] Failed to read key "${key}":`, err);
    return fallback;
  }
}

export function safeLocalStorageSet<T>(key: string, data: T): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const envelope: StorageEnvelope<T> = {
      version: CURRENT_VERSION,
      data,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(envelope));
  } catch (err) {
    console.warn(`[safeStorage] Failed to set key "${key}":`, err);
  }
}

export function safeLocalStorageRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (err) {
    console.warn(`[safeStorage] Failed to remove key "${key}":`, err);
  }
}
