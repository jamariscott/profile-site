import { useCallback, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, Search, X } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useEscapeKey } from "../lib/useEscapeKey";
import DarkModeToggle from "./DarkModeToggle";
import Logo from "./Logo";

const LINKS = [
  { to: "/discover", label: "Discover" },
  { to: "/writing", label: "Writing" },
  { to: "/videos", label: "Videos" },
];

function linkClass({ isActive }: { isActive: boolean }) {
  return [
    "text-[0.95rem] font-medium underline-offset-[6px] decoration-2 transition-colors",
    isActive ? "text-text underline decoration-highlight" : "text-muted hover:text-text",
  ].join(" ");
}

/** The one platform nav. Primary action is always visible: claim a page, or go to yours. */
export default function PlatformNav() {
  const session = useAuth();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useEscapeKey(open, close);

  const primary = session
    ? { to: `/u/${session.user.username}`, label: "Your page" }
    : { to: "/register", label: "Claim your page" };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" aria-label="Timez of Today home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            to="/search"
            aria-label="Search"
            className="hidden h-10 w-10 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface-2 hover:text-text sm:inline-flex"
          >
            <Search size={18} aria-hidden />
          </Link>
          <DarkModeToggle className="inline-flex h-10 w-10 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface-2 hover:text-text" />
          {session ? (
            <NavLink to="/account" className={(s) => `${linkClass(s)} hidden sm:inline`}>
              Account
            </NavLink>
          ) : (
            <NavLink to="/login" className={(s) => `${linkClass(s)} hidden sm:inline`}>
              Log in
            </NavLink>
          )}
          <Link
            to={primary.to}
            className="hidden rounded-btn bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-hover sm:inline-flex"
          >
            {primary.label}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-btn text-text hover:bg-surface-2 md:hidden"
          >
            <Menu size={22} aria-hidden />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-text/40" onClick={close} />
          <div className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col bg-bg p-5 shadow-xl">
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              autoFocus
              className="mb-6 inline-flex h-10 w-10 items-center justify-center self-end rounded-btn hover:bg-surface-2"
            >
              <X size={22} aria-hidden />
            </button>
            <nav aria-label="Mobile" className="flex flex-col text-lg font-semibold">
              {[...LINKS, { to: "/search", label: "Search" }, session ? { to: "/account", label: "Account" } : { to: "/login", label: "Log in" }].map((l) => (
                <NavLink key={l.to} to={l.to} onClick={close} className="border-b border-line py-3 text-text">
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <Link
              to={primary.to}
              onClick={close}
              className="mt-6 rounded-btn bg-accent px-4 py-3 text-center font-semibold text-accent-contrast"
            >
              {primary.label}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
