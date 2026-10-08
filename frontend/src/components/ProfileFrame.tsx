import type { CSSProperties, ReactNode } from "react";
import { isThemeId } from "../lib/themes";

/** Owner customization saved on the profile (backend `profile_style`, all keys optional). */
export interface ProfileStyle {
  accent?: string;
  mode?: "light" | "dark";
  font?: "sans" | "serif" | "grotesk" | "mono";
  header?: "classic" | "bigname" | "cover";
  buttons?: "rounded" | "pill" | "square";
  cover_url?: string;
  status?: string;
  location?: string;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]) {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** A custom accent becomes every accent token; text on it is whichever of white/ink reads better. */
function accentVars(accent?: string): CSSProperties {
  const rgb = accent ? hexToRgb(accent) : null;
  if (!rgb) return {};
  const L = luminance(rgb);
  const onWhite = 1.05 / (L + 0.05);
  const onInk = (L + 0.05) / (luminance([20, 20, 24]) + 0.05);
  const channels = rgb.join(" ");
  const darker = rgb.map((v) => Math.round(v * 0.85)).join(" ");
  return {
    "--c-accent": channels,
    "--c-accent-hover": darker,
    "--c-accent-fill": channels,
    "--c-accent-fill-hover": darker,
    "--c-accent-contrast": onWhite >= onInk ? "255 255 255" : "20 20 24",
  } as CSSProperties;
}

/**
 * Scopes a member's look to their content: profession theme (`data-theme`),
 * plus their own overrides (light/dark, heading font, button shape, accent).
 * Used by the public page and the dashboard preview so they always match.
 */
export default function ProfileFrame({
  theme,
  style = {},
  className = "",
  children,
}: {
  theme: string | null | undefined;
  style?: ProfileStyle;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-theme={theme && isThemeId(theme) ? theme : undefined}
      data-profile-mode={style.mode}
      data-profile-font={style.font}
      data-profile-buttons={style.buttons}
      style={accentVars(style.accent)}
      className={`bg-bg text-text ${className}`}
    >
      {children}
    </div>
  );
}
