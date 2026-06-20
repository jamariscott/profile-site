import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

export type DisplayMode = "light" | "dark";

const MODE_CACHE_KEY = "tzt_mode";

interface DarkModeContextValue {
  mode: DisplayMode;
  toggle: () => void;
}

const DarkModeContext = createContext<DarkModeContextValue | null>(null);

function isDisplayMode(value: unknown): value is DisplayMode {
  return value === "light" || value === "dark";
}

function readInitialMode(): DisplayMode {
  try {
    const cached = localStorage.getItem(MODE_CACHE_KEY);
    if (isDisplayMode(cached)) return cached;
  } catch {
    /* ignore */
  }
  try {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {
    /* ignore */
  }
  return "light";
}

/**
 * Per-visitor light/dark preference. Deliberately independent of the
 * admin-controlled LayoutProvider/Setting machinery — this is personal,
 * stored only in the visitor's own browser, with no backend involved.
 */
export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DisplayMode>(() => readInitialMode());

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next: DisplayMode = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(MODE_CACHE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return <DarkModeContext.Provider value={{ mode, toggle }}>{children}</DarkModeContext.Provider>;
}

export function useDarkMode(): DarkModeContextValue {
  const ctx = useContext(DarkModeContext);
  if (!ctx) throw new Error("useDarkMode must be used within <DarkModeProvider>");
  return ctx;
}
