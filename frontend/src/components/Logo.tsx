/**
 * Timez of Today mark: a clock face whose hands spell a T (it reads 9:15 —
 * a time of day). Drawn in currentColor with the face "punched out", so it
 * works on paper, on night, and inside any profile theme.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  // Logo trial (?logo=b, see main.tsx): B is the sunrise mark — a sun breaking
  // the horizon with the T as its first ray.
  if (document.documentElement.dataset.logo === "b") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden focusable="false">
        <path d="M4 21a12 12 0 0 1 24 0z" fill="rgb(var(--c-highlight))" />
        <path d="M2.5 21h27M16 9v12M6 26h20" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      focusable="false"
    >
      <circle cx="16" cy="16" r="15" fill="currentColor" />
      <path
        d="M7.5 16h17M16 16v9"
        stroke="rgb(var(--c-bg))"
        strokeWidth="3.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="16" cy="16" r="2.4" fill="rgb(var(--c-highlight))" />
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
