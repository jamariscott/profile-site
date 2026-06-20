import type { CSSProperties } from "react";
import { useDarkMode } from "../theme/DarkModeProvider";

/** Small sun/moon toggle. Visible to every visitor on every page — not admin-gated. */
export default function DarkModeToggle({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  const { mode, toggle } = useDarkMode();

  return (
    <button
      onClick={toggle}
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={style}
      className={
        className ??
        "w-8 h-8 rounded-full flex items-center justify-center border border-line text-text hover:bg-surface-2 transition-colors"
      }
    >
      <span aria-hidden>{mode === "dark" ? "☾" : "☀"}</span>
    </button>
  );
}
