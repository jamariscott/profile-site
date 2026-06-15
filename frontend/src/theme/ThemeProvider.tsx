import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { API_BASE } from "../lib/config";
import { getAdminSession } from "../lib/auth";
import { DEFAULT_THEME, isThemeId, type ThemeId } from "../lib/themes";

const THEME_CACHE_KEY = "tzt_theme";

interface ThemeContextValue {
  /** The currently applied global theme. */
  theme: ThemeId;
  /** Admin-only: persist a new global theme. Resolves when saved, rejects on failure. */
  setTheme: (theme: ThemeId) => Promise<void>;
  /** True while a setTheme save is in flight. */
  saving: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute("data-theme", theme);
}

function readCachedTheme(): ThemeId {
  try {
    const cached = localStorage.getItem(THEME_CACHE_KEY);
    if (isThemeId(cached)) return cached;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start from the last-known theme so reloads don't flash the default.
  const [theme, setThemeState] = useState<ThemeId>(() => readCachedTheme());
  const [saving, setSaving] = useState(false);
  const currentTheme = useRef(theme);
  currentTheme.current = theme;

  // Apply synchronously before paint.
  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Reconcile with the server's global theme on load.
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (isThemeId(data?.theme)) {
          setThemeState(data.theme);
          try {
            localStorage.setItem(THEME_CACHE_KEY, data.theme);
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        /* keep cached theme on network error */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback(async (next: ThemeId) => {
    const session = getAdminSession();
    if (!session) {
      throw new Error("Not authorized: admin login required to change the theme.");
    }

    const previous = currentTheme.current;
    // Optimistic apply for instant feedback.
    setThemeState(next);
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/theme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: session.username,
          password: session.password,
          theme: next,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to save theme");
      }
      try {
        localStorage.setItem(THEME_CACHE_KEY, next);
      } catch {
        /* ignore */
      }
    } catch (e) {
      // Revert on failure.
      setThemeState(previous);
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, saving }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
