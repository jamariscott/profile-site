// Shared motion tokens so every animation on the site moves the same way.
// Entrances settle with a spring; exits are quicker than entrances. Opacity
// always gets its own short fade: driven by a spring, an element would stay
// invisible until its movement had nearly finished.

const quickFade = { opacity: { duration: 0.14, ease: "easeOut" } } as const;

/** Snappy settle for things that pop into place (names, checkmarks, badges). */
export const spring = { type: "spring", stiffness: 520, damping: 32, mass: 0.7, ...quickFade } as const;
/** Softer settle for panels and things that move further (drawers, layout). */
export const springSoft = { type: "spring", stiffness: 340, damping: 34, ...quickFade } as const;
/** Quick fades for content swaps. */
export const fade = { duration: 0.18, ease: [0.22, 1, 0.36, 1] } as const;
export const fadeOut = { duration: 0.12, ease: [0.4, 0, 1, 1] } as const;
