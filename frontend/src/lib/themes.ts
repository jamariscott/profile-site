// Single source of truth for the site's available themes.
// To add a theme: add an entry here, add a matching [data-theme="id"] block in
// src/index.css, and add the id to VALID_THEMES in the backend (main.py).

export type ThemeId = "classic" | "huffpost" | "twilight" | "music";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  description: string;
  /** Small swatches for the switcher preview: [background, surface, accent]. */
  swatch: [string, string, string];
}

export const THEMES: ThemeMeta[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Clean, minimal, light",
    swatch: ["#fafafa", "#ffffff", "#18181b"],
  },
  {
    id: "huffpost",
    label: "Huffington Post",
    description: "Bold editorial, serif headlines",
    swatch: ["#f5f5f5", "#ffffff", "#0dbe75"],
  },
  {
    id: "twilight",
    label: "Twilight Zone",
    description: "Dark, high-contrast, retro",
    swatch: ["#09090b", "#18181b", "#7dd3fc"],
  },
  {
    id: "music",
    label: "Music",
    description: "Dark, bold, made for artists",
    swatch: ["#0a0a0c", "#141418", "#ec4899"],
  },
];

export const DEFAULT_THEME: ThemeId = "classic";

export const THEME_IDS: ThemeId[] = THEMES.map((t) => t.id);

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (THEME_IDS as string[]).includes(value);
}
