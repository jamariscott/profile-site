import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useAuth } from "../lib/auth";
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
  const bg = mode === "dark" ? DARK_BG : LIGHT_BG;

  return (
    <>
      <header style={{ background: bg }}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-3 items-center h-16">
          <div className="flex items-center gap-4 justify-self-start">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="text-white text-2xl leading-none"
            >
              &#9776;
            </button>
            <span className="text-white text-lg opacity-80 hidden sm:inline" aria-hidden>
              &#128276;
            </span>
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
                <span className="text-white/80 hidden lg:inline whitespace-nowrap">Power Our Journalism</span>
                <Link
                  to="/register"
                  className="bg-pink-500 text-white px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap hover:bg-pink-600 transition-colors"
                >
                  SUPPORT US
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
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div
            className="absolute top-0 left-0 h-full w-72 overflow-y-auto p-5 text-white"
            style={{ background: bg }}
          >
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-2xl mb-4">
              &times;
            </button>
            <div className="space-y-6 text-sm">
              <div>
                <div className="font-bold italic mb-2">Browse</div>
                <Link to="/writing" onClick={() => setOpen(false)} className="block py-1 opacity-90">
                  Writing
                </Link>
                <Link to="/videos" onClick={() => setOpen(false)} className="block py-1 opacity-90">
                  Videos
                </Link>
              </div>
              <div>
                <div className="font-bold italic mb-2">More</div>
                <a href="#" className="block py-1 opacity-90">
                  About
                </a>
                <a href="#" className="block py-1 opacity-90">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
