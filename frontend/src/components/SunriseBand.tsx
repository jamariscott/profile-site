import { useRef, useSyncExternalStore } from "react";
import { useScroll, useTransform, type MotionValue } from "motion/react";
import * as m from "motion/react-m";

// The brand sun, same fixed color as the logo.
const SUN = "#FF8A3D";

// Visitors who get the finished sunrise instead of the scroll-linked one.
// Phones get the full scene too: it only moves opacity and transform, and
// downloads nothing. Decided live, so flipping the setting updates it.
const STATIC_QUERIES = ["(prefers-reduced-motion: reduce)"];

function subscribeStatic(onChange: () => void) {
  const lists = STATIC_QUERIES.map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener("change", onChange));
  return () => lists.forEach((l) => l.removeEventListener("change", onChange));
}

// False in the prebuilt home page HTML (no screen to ask), so it matches the
// live app's first render; the real answer applies right after.
function useStaticScene() {
  return useSyncExternalStore(
    subscribeStatic,
    () => STATIC_QUERIES.some((q) => window.matchMedia(q).matches),
    () => false,
  );
}

// A few fixed stars for the night sky (x%, y%, size px).
const STARS = [
  [8, 22, 2], [17, 58, 1.5], [26, 14, 2.5], [38, 40, 1.5], [44, 12, 2], [58, 30, 1.5],
  [66, 10, 2.5], [74, 48, 1.5], [83, 20, 2], [91, 52, 1.5], [12, 74, 1.5], [88, 76, 1.5],
];

/**
 * Decorative sunrise between the hero and the page below. As the visitor
 * scrolls past it, the sky warms from night to dawn and the sun clears the
 * horizon. Nothing is pinned and no text depends on it: the hero above is
 * complete on first load, and screens in STATIC_QUERIES see the risen sun.
 */
export default function SunriseBand() {
  const ref = useRef<HTMLDivElement>(null);
  const isStatic = useStaticScene();
  // 0 when the band's top enters at the bottom of the screen, 1 when it
  // reaches the top. The sun is fully up by 80% of that.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start start"] });
  const rise = useTransform(scrollYProgress, [0, 0.8], [0, 1], { clamp: true });

  const night = useTransform(rise, [0, 1], [1, 0]);
  const stars = useTransform(rise, [0, 0.6], [1, 0]);
  const sunY = useTransform(rise, [0, 1], ["78%", "-14%"]);
  const glow = useTransform(rise, [0.15, 1], [0, 1]);
  const rays = useTransform(rise, [0.55, 1], [0, 1]);
  const raysTurn = useTransform(rise, [0.55, 1], [-10, 0]);

  // On static screens, every layer sits at its finished value.
  const pick = <T,>(value: MotionValue<T>, done: T) => (isStatic ? done : value);

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative h-[clamp(10rem,18vw,13rem)] overflow-hidden border-b-2 border-text"
    >
      {/* Dawn underneath, night on top fading out. Only opacity changes. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#A9B8FF_0%,#E9C2DC_58%,#FFC79A_100%)]" />
      <m.div
        className="absolute inset-0 bg-[linear-gradient(to_bottom,#1A1024_0%,#2B1A3D_60%,#4A2C55_100%)]"
        style={{ opacity: pick(night, 0) }}
      />
      <m.div className="absolute inset-0" style={{ opacity: pick(stars, 0) }}>
        {STARS.map(([x, y, s]) => (
          <span
            key={`${x}-${y}`}
            className="absolute rounded-full bg-[#F4F1FF]"
            style={{ left: `${x}%`, top: `${y}%`, width: s, height: s }}
          />
        ))}
      </m.div>

      {/* The sun rises from behind the band's bottom edge (the horizon). */}
      <m.div
        className="absolute bottom-0 left-1/2 w-[clamp(4.5rem,9vw,7rem)]"
        style={{ x: "-50%", y: pick(sunY, "-14%") }}
      >
        <m.div
          className="absolute left-1/2 top-1/2 h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,138,61,0.45)_0%,rgba(255,138,61,0)_62%)]"
          style={{ opacity: pick(glow, 1) }}
        />
        <svg viewBox="-60 -60 120 120" className="relative block w-full overflow-visible">
          <m.g style={{ opacity: pick(rays, 1), rotate: pick(raysTurn, 0) }}>
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="-44"
                x2="0"
                y2="-56"
                stroke={SUN}
                strokeWidth="5"
                strokeLinecap="round"
                transform={`rotate(${deg})`}
              />
            ))}
          </m.g>
          <circle r="36" fill={SUN} />
        </svg>
      </m.div>
    </div>
  );
}
