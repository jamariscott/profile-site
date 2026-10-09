import type { CSSProperties } from "react";
import { Moon, Sun } from "lucide-react";
import { useDarkMode } from "../theme/DarkModeProvider";

/**
 * Small sun/moon toggle. Visible to every visitor on every page — not admin-gated.
 * Both icons are rendered and CSS shows the one matching <html data-mode>, so
 * the prebuilt home page HTML is right before JavaScript runs, and matches
 * the live app when it takes over.
 */
export default function DarkModeToggle({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  const { toggle } = useDarkMode();

  return (
    <button
      onClick={toggle}
      aria-label="Switch between light and dark mode"
      style={style}
      className={
        className ??
        "w-8 h-8 rounded-full flex items-center justify-center border border-line text-text hover:bg-surface-2 transition-colors"
      }
    >
      <Moon size={16} aria-hidden className="mode-icon-dark" />
      <Sun size={16} aria-hidden className="mode-icon-light" />
    </button>
  );
}
