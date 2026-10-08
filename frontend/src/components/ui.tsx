import type { ReactNode } from "react";
export { inputClass } from "./AuthFields";

/** Shared platform form styles, so every editor reads as one product. */
export const primaryBtn =
  "rounded-btn bg-accent px-5 py-2.5 font-semibold text-accent-contrast transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryBtn =
  "rounded-btn border-2 border-line-strong px-4 py-2 text-sm font-semibold text-text transition-colors hover:border-text disabled:cursor-not-allowed disabled:opacity-50";
export const removeBtn = "text-sm font-semibold text-danger hover:underline";

export function FieldLabel({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-text">
      {children}
      {hint && <span className="ml-1 font-normal text-muted">{hint}</span>}
    </label>
  );
}

/** A titled block inside an editor card. */
export function EditorSection({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <h2 className="font-heading text-lg font-bold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm font-medium text-danger">
      {children}
    </p>
  );
}
