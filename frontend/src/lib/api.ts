import { API_BASE } from "./config";
import { authHeaders } from "./auth";

/** fetch() against the API base with auth header + JSON content-type auto-added. */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...authHeaders(),
    ...((options.headers as Record<string, string>) || {}),
  };
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

/** Like apiFetch but parses JSON and throws a readable Error on non-2xx. */
export async function apiJson<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) as string | undefined;
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return data as T;
}
