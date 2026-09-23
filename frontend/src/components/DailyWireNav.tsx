import { useCallback, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Flag, Menu, Search, X } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useEscapeKey } from "../lib/useEscapeKey";
import { useDarkMode } from "../theme/DarkModeProvider";
import DarkModeToggle from "./DarkModeToggle";

const RED = "#db3d3b";
// Slightly deeper red for the filled SIGN UP pill so white text passes 4.5:1.
const RED_FILL = "#d03735";

function navLinkClass(isActive: boolean) {
  return ["text-sm font-medium transition", isActive ? "underline" : ""].join(" ");
}

export default function DailyWireNav() {
  const session = useAuth();
  const { mode } = useDarkMode();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useEscapeKey(open, close);
  const dark = mode === "dark";

  const bg = dark ? "#0a0909" : "#f5f5f5";
  const border = dark ? "#1f1f1f" : "#e0e0e0";
  const text = dark ? "#e5e5e5" : "#3a3a3a";
  const logoText = dark ? "#ffffff" : "#111111";

  return (
    <>
      <header style={{ background: bg, borderBottom: `1px solid ${border}` }}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-3 items-center h-16">
          <div className="flex items-center gap-6" style={{ color: text }}>
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="sm:hidden inline-flex items-center"
              style={{ color: "inherit" }}
            >
              <Menu size={24} aria-hidden />
            </button>
            <div className="hidden sm:flex items-center gap-6">
              <NavLink to="/" end className={({ isActive }) => navLinkClass(isActive)} style={{ color: "inherit" }}>
                Home
              </NavLink>
              <NavLink to="/writing" className={({ isActive }) => navLinkClass(isActive)} style={{ color: "inherit" }}>
                Writing
              </NavLink>
              <NavLink to="/videos" className={({ isActive }) => navLinkClass(isActive)} style={{ color: "inherit" }}>
                Videos
              </NavLink>
              <NavLink to="/discover" className={({ isActive }) => navLinkClass(isActive)} style={{ color: "inherit" }}>
                Discover
              </NavLink>
            </div>
          </div>
          <div className="justify-self-center flex items-center gap-2 min-w-0">
            <Flag size={16} fill="currentColor" style={{ color: RED }} className="shrink-0" aria-hidden />
            <Link
              to="/"
              className="font-extrabold uppercase tracking-tight text-base sm:text-lg md:text-xl truncate"
              style={{ color: logoText }}
            >
              Timez of Today
            </Link>
          </div>
          <div className="flex items-center gap-3 sm:gap-5 text-sm justify-self-end" style={{ color: text }}>
            <Link to="/search" aria-label="Search" className="opacity-80 hover:opacity-100 hidden sm:inline-flex items-center" style={{ color: "inherit" }}>
              <Search size={18} strokeWidth={2} />
            </Link>
            <DarkModeToggle className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity shrink-0" />
            {session ? (
              <Link to="/account" style={{ color: "inherit" }}>
                Account
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline" style={{ color: "inherit" }}>
                  Log In
                </Link>
                <Link
                  to="/register"
                  style={{ background: RED_FILL }}
                  className="text-white px-4 sm:px-5 py-2 rounded-full font-bold text-xs whitespace-nowrap hover:opacity-90 transition-opacity"
                >
                  SIGN UP
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div
            className="absolute top-0 left-0 h-full w-72 overflow-y-auto p-5"
            style={{ background: bg, color: text }}
          >
            <button onClick={close} aria-label="Close menu" className="mb-4 inline-flex items-center" style={{ color: logoText }} autoFocus>
              <X size={24} aria-hidden />
            </button>
            <div className="space-y-1 text-sm">
              <NavLink to="/" end onClick={close} className="block py-2" style={{ color: "inherit" }}>
                Home
              </NavLink>
              <NavLink to="/writing" onClick={close} className="block py-2" style={{ color: "inherit" }}>
                Writing
              </NavLink>
              <NavLink to="/videos" onClick={close} className="block py-2" style={{ color: "inherit" }}>
                Videos
              </NavLink>
              <NavLink to="/discover" onClick={close} className="block py-2" style={{ color: "inherit" }}>
                Discover
              </NavLink>
              <NavLink to="/search" onClick={close} className="block py-2" style={{ color: "inherit" }}>
                Search
              </NavLink>
              {!session && (
                <Link to="/login" onClick={close} className="block py-2" style={{ color: "inherit" }}>
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
