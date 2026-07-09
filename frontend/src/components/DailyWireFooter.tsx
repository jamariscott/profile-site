import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useDarkMode } from "../theme/DarkModeProvider";
import DarkModeToggle from "./DarkModeToggle";

const RED = "#db3d3b";

export default function DailyWireFooter() {
  const session = useAuth();
  const { mode } = useDarkMode();
  const dark = mode === "dark";

  const bg = dark ? "#0a0909" : "#f5f5f5";
  const border = dark ? "#1f1f1f" : "#e0e0e0";
  const heading = dark ? "#ffffff" : "#111111";
  const muted = dark ? "#8f8f8f" : "#6b6b6b";
  const pillBg = dark ? "#ffffff" : "#111111";
  const pillText = dark ? "#000000" : "#ffffff";

  return (
    <footer style={{ background: bg, borderTop: `1px solid ${border}` }}>
      {!session && (
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h3 className="text-2xl font-bold mb-2" style={{ color: heading }}>
            Got something worth sharing?
          </h3>
          <p className="text-sm mb-6" style={{ color: muted }}>
            Your work could be the next featured story. Create a profile and show it off.
          </p>
          <Link
            to="/register"
            style={{ background: pillBg, color: pillText }}
            className="px-6 py-3 rounded-full font-bold text-sm inline-block hover:opacity-90 transition-opacity"
          >
            CREATE PROFILE
          </Link>
        </div>
      )}

      <div style={{ borderTop: `1px solid ${border}` }}>
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex items-center gap-2">
            <span style={{ color: RED }} aria-hidden>
              &#9873;
            </span>
            <Link to="/" className="font-extrabold uppercase tracking-tight" style={{ color: heading }}>
              Timez of Today
            </Link>
          </div>
          <div className="space-y-2 text-sm">
            <div className="font-semibold" style={{ color: heading }}>
              Browse
            </div>
            <Link to="/writing" className="block hover:opacity-80" style={{ color: muted }}>
              Writing
            </Link>
            <Link to="/videos" className="block hover:opacity-80" style={{ color: muted }}>
              Videos
            </Link>
          </div>
          <div className="space-y-2 text-sm">
            <div className="font-semibold" style={{ color: heading }}>
              Account
            </div>
            {session ? (
              <Link to="/account" className="block hover:opacity-80" style={{ color: muted }}>
                Account
              </Link>
            ) : (
              <>
                <Link to="/login" className="block hover:opacity-80" style={{ color: muted }}>
                  Log in
                </Link>
                <Link to="/register" className="block hover:opacity-80" style={{ color: muted }}>
                  Sign up
                </Link>
              </>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="font-semibold" style={{ color: heading }}>
              About
            </div>
            <a href="#" className="block hover:opacity-80" style={{ color: muted }}>
              About
            </a>
            <a href="#" className="block hover:opacity-80" style={{ color: muted }}>
              Contact
            </a>
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${border}` }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-xs" style={{ color: muted }}>
          <span>&copy; {new Date().getFullYear()} Timez of Today</span>
          <div className="flex items-center gap-4">
            <span className="opacity-70" aria-hidden>
              &#9711;
            </span>
            <span className="opacity-70" aria-hidden>
              &#10059;
            </span>
            <span className="opacity-70" aria-hidden>
              &#9711;
            </span>
            <DarkModeToggle
              className="ml-3 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: border, color: dark ? "#e5e5e5" : "#333333" }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
