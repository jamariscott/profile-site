// The sun keeps one fixed brand color in every palette and mode: it's what
// makes the mark read as a sun. Everything else in the mark is currentColor.
const SUN = "#FF8A3D";

/**
 * Timez of Today mark, "Dawn T": a rayed sun rising on the T's crossbar
 * (today), with a dot where crossbar meets stem (the clock's center pin —
 * "now").
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden focusable="false">
      <path d="M15 19.5A9 9 0 0 1 33 19.5Z" fill={SUN} />
      <path
        d="M24 4.5V7.5M13.2 9L15.3 11.1M34.8 9L32.7 11.1M8.5 17H11.5M36.5 17H39.5"
        stroke={SUN}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path d="M6 24H42M24 24V42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="24" cy="24" r="2.7" fill={SUN} />
    </svg>
  );
}

/** Mark + condensed wordmark. The visible name doubles as the link's accessible name. */
export default function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-text ${className ?? ""}`}>
      <LogoMark />
      <span className="font-heading text-[1.35rem] leading-none font-extrabold tracking-tight [font-stretch:72%]">
        Timez of Today
      </span>
    </span>
  );
}
