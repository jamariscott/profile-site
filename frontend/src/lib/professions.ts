import type { LayoutSection } from "../components/ProfileView";

export const ALL_SECTION_TYPES = ["about", "projects", "tracks", "releases", "shows", "gallery", "videos", "posts"];

// Each theme implies a section preset (a profession bundle). Music shows the
// music modules; everything else shows the general set. Data is never deleted —
// non-preset sections are appended hidden so they stay toggleable.
// Links aren't part of this reorderable set — they're a fixed block that
// always renders right under the profile header (see ProfileView.tsx).
export const PROFESSION_PRESETS: Record<string, string[]> = {
  music: ["about", "tracks", "releases", "shows"],
  photographer: ["about", "gallery"],
  creator: ["about", "videos"],
  writer: ["about", "posts"],
};

export function presetFor(theme: string): LayoutSection[] {
  const order = PROFESSION_PRESETS[theme] || ["about", "projects"];
  const visible = order.map((type) => ({ type, visible: true }));
  const hidden = ALL_SECTION_TYPES.filter((t) => !order.includes(t)).map((type) => ({ type, visible: false }));
  return [...visible, ...hidden];
}
