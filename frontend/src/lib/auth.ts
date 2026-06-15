import { useSyncExternalStore } from "react";

/**
 * Auth session: a JWT token + the public user object returned by the backend.
 * The password is never stored — only the bearer token. This is the single
 * source of truth for "who is logged in" across the app.
 */

const STORAGE_KEY = "tzt_auth";

export interface AuthUser {
  id: number;
  username: string;
  email: string | null;
  role: string; // "admin" | "member"
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

// Cached snapshot so getSnapshot() is stable between storage changes
// (required by useSyncExternalStore to avoid render loops).
let cachedRaw: string | null = null;
let cachedSession: AuthSession | null = null;

export function getSession(): AuthSession | null {
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
    if (parsed && typeof parsed.token === "string" && parsed.user && typeof parsed.user.username === "string") {
      cachedSession = parsed as AuthSession;
    } else {
      cachedSession = null;
    }
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function getUser(): AuthUser | null {
  return getSession()?.user ?? null;
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function isAdmin(): boolean {
  return getUser()?.role === "admin";
}

export function setSession(session: AuthSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
  notify();
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

/** Authorization header for authenticated requests (empty object if logged out). */
export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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

/** React hook: re-renders when the auth session changes (incl. across tabs). */
export function useAuth(): AuthSession | null {
  return useSyncExternalStore(subscribe, getSession, () => null);
}
