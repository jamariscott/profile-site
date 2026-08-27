// Single source of truth for the site's available themes.
// To add a theme: add an entry here, add a matching [data-theme="id"] block in
// src/index.css, and add the id to VALID_THEMES in the backend (main.py).

export type ThemeId =
  | "classic"
  | "huffpost"
  | "twilight"
  | "music"
  | "developer"
  | "photographer"
  | "creator"
  | "writer";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  description: string;
  /** Small swatches for the switcher preview: [background, surface, accent]. */
  swatch: [string, string, string];
  /**
   * "profession" themes are the per-profile module bundles every member picks
   * (Music, Developer, ...). "general" themes are brand-style skins with no
   * profession behind them (Classic/HuffPost/Twilight) — admin-only, since
   * they don't map to any real module bundle for a regular member's profile.
   */
  kind: "profession" | "general";
}

export const THEMES: ThemeMeta[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Clean, minimal, light",
    swatch: ["#fafafa", "#ffffff", "#18181b"],
    kind: "general",
  },
  {
    id: "huffpost",
    label: "Huffington Post",
    description: "Bold editorial, serif headlines",
    swatch: ["#f5f5f5", "#ffffff", "#0dbe75"],
    kind: "general",
  },
  {
    id: "twilight",
    label: "Twilight Zone",
    description: "Dark, high-contrast, retro",
    swatch: ["#09090b", "#18181b", "#7dd3fc"],
    kind: "general",
  },
  {
    id: "music",
    label: "Music",
    description: "Dark, bold, made for artists",
    swatch: ["#0a0a0c", "#141418", "#ec4899"],
    kind: "profession",
  },
  {
    id: "developer",
    label: "Developer",
    description: "Clean, technical, built for makers",
    swatch: ["#0b0e14", "#111620", "#5eead4"],
    kind: "profession",
  },
  {
    id: "photographer",
    label: "Photographer",
    description: "Gallery-forward, dark, made for images",
    swatch: ["#0c0c0d", "#161618", "#d4af74"],
    kind: "profession",
  },
  {
    id: "creator",
    label: "Content Creator",
    description: "Vibrant, video-first, built for creators",
    swatch: ["#0e0c14", "#181522", "#a76fff"],
    kind: "profession",
  },
  {
    id: "writer",
    label: "Writer",
    description: "Warm paper, editorial serif, for the written word",
    swatch: ["#f7f3eb", "#fdfaf4", "#b0583e"],
    kind: "profession",
  },
];

export const DEFAULT_THEME: ThemeId = "classic";

export const THEME_IDS: ThemeId[] = THEMES.map((t) => t.id);

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (THEME_IDS as string[]).includes(value);
}
