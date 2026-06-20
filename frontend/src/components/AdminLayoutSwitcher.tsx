import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useLayout } from "../theme/LayoutProvider";
import { LAYOUTS, type LayoutId } from "../lib/layouts";

/**
 * Floating, admin-only layout switcher. Visible on every page when an admin
 * is logged in. Picking a layout applies it live and saves it as the global
 * site setting for all visitors — it now also carries the site's color
 * identity (accent/font/radius), not just the homepage's structure.
 */
export default function AdminLayoutSwitcher() {
  const session = useAuth();
  const { layout, setLayout, saving } = useLayout();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  // Only an admin sees this control.
  if (session?.user.role !== "admin") return null;

  const handlePickLayout = async (id: LayoutId) => {
    if (id === layout) return;
    setError("");
    try {
      await setLayout(id);
    } catch (e: any) {
      setError(e?.message || "Could not save layout");
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 font-body">
      {open && (
        <div className="w-72 rounded-card border border-line bg-surface text-text shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Site layout</span>
            {saving && <span className="text-xs text-muted">Saving…</span>}
          </div>

          <div className="space-y-2">
            {LAYOUTS.map((l) => {
              const active = l.id === layout;
              return (
                <button
                  key={l.id}
                  onClick={() => handlePickLayout(l.id)}
                  disabled={saving}
                  className={`w-full flex items-center gap-3 rounded-btn border p-2.5 text-left transition-colors disabled:opacity-60 ${
                    active
                      ? "border-accent bg-surface-2"
                      : "border-line hover:bg-surface-2"
                  }`}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium leading-tight">{l.label}</span>
                    <span className="block text-xs text-muted leading-tight truncate">
                      {l.description}
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
        aria-label="Change site layout"
        className="flex items-center gap-2 rounded-full border border-line bg-surface text-text shadow-card px-4 py-2.5 text-sm font-medium hover:bg-surface-2 transition-colors"
      >
        <span aria-hidden>🎨</span>
        <span>Layout</span>
      </button>
    </div>
  );
}
