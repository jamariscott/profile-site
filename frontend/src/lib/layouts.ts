// Single source of truth for the homepage's available structural layouts.
// Unlike themes.ts (colors/fonts via CSS variables), a layout changes the
// actual page composition (nav -> hero/feed arrangement -> footer).
// To add a layout: add an entry here, add the id to VALID_LAYOUTS in the
// backend (main.py), and add a matching variant component in pages/Home.tsx.

export type LayoutId = "classic" | "huffpost" | "dailywire";

export interface LayoutMeta {
  id: LayoutId;
  label: string;
  description: string;
}

export const LAYOUTS: LayoutMeta[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Brand hero + featured article + grid feed",
  },
  {
    id: "huffpost",
    label: "Huffington Post",
    description: "Bold editorial, dense multi-column feed",
  },
  {
    id: "dailywire",
    label: "Daily Wire",
    description: "Opinion-led cards, bylines up front",
  },
];

export const DEFAULT_LAYOUT: LayoutId = "classic";

export const LAYOUT_IDS: LayoutId[] = LAYOUTS.map((l) => l.id);

export function isLayoutId(value: unknown): value is LayoutId {
  return typeof value === "string" && (LAYOUT_IDS as string[]).includes(value);
}
