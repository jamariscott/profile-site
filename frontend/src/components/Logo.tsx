/**
 * Timez of Today mark, "Dawn T": a sun resting on the T's crossbar (today,
 * rising), with a dot where crossbar meets stem (the clock's center pin —
 * "now"). Ink is currentColor and the sun/dot use the highlight token, so it
 * follows whichever palette and light/dark mode is active.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden focusable="false">
      <path d="M13 19.5A11 11 0 0 1 35 19.5Z" fill="rgb(var(--c-highlight))" />
      <path d="M6 24H42M24 24V42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="24" cy="24" r="2.7" fill="rgb(var(--c-highlight))" />
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
