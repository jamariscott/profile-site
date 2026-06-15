import { useSyncExternalStore } from "react";

/**
 * Centralized admin session.
 *
 * NOTE (tech debt): the current backend authorizes every admin action with
 * username + password in the request body, so we persist both here to keep the
 * admin "logged in" across pages (needed for the floating theme switcher).
 * This is the existing app's auth model. It will be replaced with proper token
 * (JWT) auth during the accounts/membership phase — at which point only a token
 * is stored here and this is the single file to change.
 */

const STORAGE_KEY = "tzt_admin_session";

export interface AdminSession {
  username: string;
  password: string;
}

// Cache so getSnapshot() returns a stable reference while storage is unchanged
// (required by useSyncExternalStore to avoid render loops).
let cachedRaw: string | null = null;
let cachedSession: AdminSession | null = null;

export function getAdminSession(): AdminSession | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  if (!raw) {
    cachedSession = null;
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    cachedSession =
      parsed && typeof parsed.username === "string" && typeof parsed.password === "string"
        ? { username: parsed.username, password: parsed.password }
        : null;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}

export function isAdmin(): boolean {
  return getAdminSession() !== null;
}

export function setAdminSession(session: AdminSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* ignore storage failures */
  }
  notify();
}

export function clearAdminSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

// --- reactivity ---
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** React hook: re-renders when the admin session changes (incl. across tabs). */
export function useAdminSession(): AdminSession | null {
  return useSyncExternalStore(subscribe, getAdminSession, () => null);
}
