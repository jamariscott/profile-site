import { useEffect } from "react";

// The light of the visitor's own time of day, as two soft glows. Keep in
// sync with the copy of this table in index.html, which sets the first sky
// before the page paints (so the prebuilt home page HTML matches).
const SKIES = {
  dawn: ["255 199 154", "169 184 255"], // peach low, periwinkle high
  day: ["169 184 255", "233 194 220"], // periwinkle, soft rose
  dusk: ["255 138 61", "233 194 220"], // tangerine, rose
  night: ["120 96 190", "169 184 255"], // deep violet, periwinkle
} as const;

function applySky() {
  const h = new Date().getHours();
  const sky = h >= 5 && h < 9 ? "dawn" : h >= 9 && h < 17 ? "day" : h >= 17 && h < 21 ? "dusk" : "night";
  const root = document.documentElement.style;
  root.setProperty("--amb-a", SKIES[sky][0]);
  root.setProperty("--amb-b", SKIES[sky][1]);
}

/**
 * The page's background environment: one fixed layer of time-of-day glow
 * that drifts slowly (96s per pass) behind everything. Only its transform
 * animates, so it costs the compositor, not layout or paint. It pauses while
 * the tab is hidden and holds still for reduced motion (see index.css).
 * The colors are CSS variables on <html>. The parent needs `isolate` so this
 * sits above the page background.
 */
export default function AmbientSky() {
  useEffect(() => {
    applySky();
    const onVisibility = () => {
      document.body.classList.toggle("paused", document.hidden);
      if (!document.hidden) applySky();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return <div aria-hidden className="ambient-sky" />;
}
