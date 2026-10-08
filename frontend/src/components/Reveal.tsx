import type { ReactNode } from "react";

/**
 * Formerly a scroll-triggered fade-in. Content is no longer tied to scroll
 * position (it should be readable the moment it renders), so this is now a
 * plain wrapper kept for its existing callers. `delay` is accepted and ignored.
 */
export default function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return <div className={className}>{children}</div>;
}
