import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { API_BASE } from "../lib/config";
import { isAdmin, authHeaders } from "../lib/auth";
import { DEFAULT_LAYOUT, isLayoutId, type LayoutId } from "../lib/layouts";

const LAYOUT_CACHE_KEY = "tzt_layout";

interface LayoutContextValue {
  /** The currently applied global homepage layout. */
  layout: LayoutId;
  /** Admin-only: persist a new global layout. Resolves when saved, rejects on failure. */
  setLayout: (layout: LayoutId) => Promise<void>;
  /** True while a setLayout save is in flight. */
  saving: boolean;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

function readCachedLayout(): LayoutId {
  try {
    const cached = localStorage.getItem(LAYOUT_CACHE_KEY);
    if (isLayoutId(cached)) return cached;
  } catch {
    /* ignore */
  }
  return DEFAULT_LAYOUT;
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  // Start from the last-known layout so reloads don't flash the default.
  const [layout, setLayoutState] = useState<LayoutId>(() => readCachedLayout());
  const [saving, setSaving] = useState(false);
  const currentLayout = useRef(layout);
  currentLayout.current = layout;

  // Reconcile with the server's global layout on load.
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (isLayoutId(data?.layout)) {
          setLayoutState(data.layout);
          try {
            localStorage.setItem(LAYOUT_CACHE_KEY, data.layout);
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        /* keep cached layout on network error */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLayout = useCallback(async (next: LayoutId) => {
    if (!isAdmin()) {
      throw new Error("Not authorized: admin login required to change the layout.");
    }

    const previous = currentLayout.current;
    // Optimistic apply for instant feedback.
    setLayoutState(next);
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/layout`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ layout: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to save layout");
      }
      try {
        localStorage.setItem(LAYOUT_CACHE_KEY, next);
      } catch {
        /* ignore */
      }
    } catch (e) {
      // Revert on failure.
      setLayoutState(previous);
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <LayoutContext.Provider value={{ layout, setLayout, saving }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used within <LayoutProvider>");
  return ctx;
}
