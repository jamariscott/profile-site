import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useTheme } from "../theme/ThemeProvider";
import { THEMES, type ThemeId } from "../lib/themes";

/**
 * Floating, admin-only theme switcher. Visible on every page when an admin is
 * logged in. Picking a theme applies it live and saves it as the global site
 * theme for all visitors.
 */
export default function AdminThemeSwitcher() {
  const session = useAuth();
  const { theme, setTheme, saving } = useTheme();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  // Only an admin sees this control.
  if (session?.user.role !== "admin") return null;

  const handlePick = async (id: ThemeId) => {
    if (id === theme) return;
    setError("");
    try {
      await setTheme(id);
    } catch (e: any) {
      setError(e?.message || "Could not save theme");
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 font-body">
      {open && (
        <div className="w-72 rounded-card border border-line bg-surface text-text shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Site theme</span>
            {saving && <span className="text-xs text-muted">Saving…</span>}
          </div>

          <div className="space-y-2">
            {THEMES.map((t) => {
              const active = t.id === theme;
              return (
                <button
                  key={t.id}
                  onClick={() => handlePick(t.id)}
                  disabled={saving}
                  className={`w-full flex items-center gap-3 rounded-btn border p-2.5 text-left transition-colors disabled:opacity-60 ${
                    active
                      ? "border-accent bg-surface-2"
                      : "border-line hover:bg-surface-2"
                  }`}
                >
                  <span className="flex shrink-0 overflow-hidden rounded-full border border-line">
                    {t.swatch.map((c, i) => (
                      <span key={i} className="h-5 w-3" style={{ backgroundColor: c }} />
                    ))}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium leading-tight">{t.label}</span>
                    <span className="block text-xs text-muted leading-tight truncate">
                      {t.description}
                    </span>
                  </span>
                  {active && (
                    <span className="text-accent text-sm" aria-hidden>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {error && <p className="mt-3 text-xs text-danger">{error}</p>}
          <p className="mt-3 text-[11px] text-subtle leading-snug">
            Changes apply to every visitor immediately.
          </p>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change site theme"
        className="flex items-center gap-2 rounded-full border border-line bg-surface text-text shadow-card px-4 py-2.5 text-sm font-medium hover:bg-surface-2 transition-colors"
      >
        <span aria-hidden>🎨</span>
        <span>Theme</span>
      </button>
    </div>
  );
}
