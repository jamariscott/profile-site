import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import SiteNav from "./SiteNav";

export const inputClass =
  "w-full rounded-btn border-2 border-line-strong bg-surface px-3.5 py-3 text-text placeholder:text-subtle transition-colors focus:border-text focus:outline-none focus-visible:outline-none";

/** Visible label above the input, with optional hint text below. */
export function Field({
  id,
  label,
  hint,
  ...input
}: { id: string; label: ReactNode; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-text">
        {label}
      </label>
      <input id={id} name={id} className={inputClass} {...input} />
      {hint && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** Password input with a show/hide toggle (keeps password managers working). */
export function PasswordField({
  id,
  label,
  hint,
  ...input
}: { id: string; label: string; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-text">
        {label}
      </label>
      <div className="relative">
        <input id={id} name={id} type={shown ? "text" : "password"} className={`${inputClass} pr-12`} {...input} />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          className="absolute inset-y-0 right-1 my-1 inline-flex w-10 items-center justify-center rounded-btn text-muted hover:bg-surface-2 hover:text-text"
        >
          {shown ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** Two-column auth layout: the form, and an inverted aside that shows what you're getting. */
export function AuthShell({ children, aside }: { children: ReactNode; aside: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <SiteNav />
      <main id="main" className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-10 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div className="mx-auto w-full max-w-md lg:mx-0">{children}</div>
        <aside className="on-ink hidden self-start rounded-card bg-text p-8 text-bg lg:block">{aside}</aside>
      </main>
    </div>
  );
}

export const primaryButton =
  "w-full rounded-btn bg-accent px-6 py-3.5 font-semibold text-accent-contrast transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50";
