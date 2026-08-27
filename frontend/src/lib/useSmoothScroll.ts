import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Global smooth scroll (Lenis). Skips entirely for visitors who prefer reduced
 * motion, and tears down cleanly. Lightweight — the single biggest "premium
 * feel" upgrade for the weight.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
}
