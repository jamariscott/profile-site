import { useCallback, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, Search, X } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useEscapeKey } from "../lib/useEscapeKey";
import { useDarkMode } from "../theme/DarkModeProvider";
import DarkModeToggle from "./DarkModeToggle";

const LIGHT_BG = "#00614f";
const DARK_BG = "#0a1a16";

function navLinkClass(isActive: boolean) {
  return [
    "text-sm font-medium transition",
    isActive ? "text-white" : "text-white/70 hover:text-white",
  ].join(" ");
}

export default function HuffPostNav() {
  const session = useAuth();
  const { mode } = useDarkMode();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useEscapeKey(open, close);
  const bg = mode === "dark" ? DARK_BG : LIGHT_BG;

  return (
    <>
      <header className="on-dark" style={{ background: bg }}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-3 items-center h-16">
          <div className="flex items-center gap-4 justify-self-start">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="text-white inline-flex items-center"
            >
              <Menu size={24} aria-hidden />
            </button>
            <Link to="/search" aria-label="Search" className="text-white opacity-80 hover:opacity-100 hidden sm:inline-flex items-center">
              <Search size={18} strokeWidth={2} />
            </Link>
          </div>
          <div className="justify-self-center">
            <Link to="/" className="text-white font-black italic text-2xl md:text-3xl tracking-tight">
              Timez of Today
            </Link>
          </div>
          <div className="flex items-center gap-4 text-sm justify-self-end">
            {!session && (
              <>
                <span className="text-white/80 hidden lg:inline whitespace-nowrap">Join free</span>
                <Link
                  to="/register"
                  className="bg-pink-600 text-white px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap hover:bg-pink-700 transition-colors"
                >
                  SIGN UP
                </Link>
              </>
            )}
            <DarkModeToggle className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors" />
            {session ? (
              <NavLink to="/account" className={({ isActive }) => navLinkClass(isActive)}>
                Account
              </NavLink>
            ) : (
              <NavLink to="/login" className={({ isActive }) => navLinkClass(isActive)}>
                Log In
              </NavLink>
            )}
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-center gap-8 h-10">
            <NavLink to="/" end className={({ isActive }) => navLinkClass(isActive)}>
              Home
            </NavLink>
            <NavLink to="/writing" className={({ isActive }) => navLinkClass(isActive)}>
              Writing
            </NavLink>
            <NavLink to="/videos" className={({ isActive }) => navLinkClass(isActive)}>
              Videos
            </NavLink>
            <NavLink to="/discover" className={({ isActive }) => navLinkClass(isActive)}>
              Discover
            </NavLink>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div
            className="on-dark absolute top-0 left-0 h-full w-72 overflow-y-auto p-5 text-white"
            style={{ background: bg }}
          >
            <button onClick={close} aria-label="Close menu" className="mb-4 inline-flex items-center" autoFocus>
              <X size={24} aria-hidden />
            </button>
            <div className="space-y-6 text-sm">
              <div>
                <div className="font-bold italic mb-2">Browse</div>
                <Link to="/writing" onClick={close} className="block py-1 opacity-90">
                  Writing
                </Link>
                <Link to="/videos" onClick={close} className="block py-1 opacity-90">
                  Videos
                </Link>
                <Link to="/discover" onClick={close} className="block py-1 opacity-90">
                  Discover
                </Link>
                <Link to="/search" onClick={close} className="block py-1 opacity-90">
                  Search
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
