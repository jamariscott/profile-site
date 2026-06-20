import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

const BG = "#0a0909";
const BORDER = "#1f1f1f";
const RED = "#db3d3b";
const MUTED = "#8f8f8f";

export default function DailyWireFooter() {
  const session = useAuth();
  const [light, setLight] = useState(false);

  return (
    <footer style={{ background: BG, borderTop: `1px solid ${BORDER}` }}>
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h3 className="text-white text-2xl font-bold mb-2">Got something worth sharing?</h3>
        <p className="text-sm mb-6" style={{ color: MUTED }}>
          Your work could be the next featured story. Create a profile and show it off.
        </p>
        <Link to="/register" className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm inline-block hover:bg-gray-200 transition-colors">
          CREATE PROFILE
        </Link>
      </div>

      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex items-center gap-2">
            <span style={{ color: RED }} aria-hidden>
              &#9873;
            </span>
            <Link to="/" className="text-white font-extrabold uppercase tracking-tight">
              TimezofToday
            </Link>
          </div>
          <div className="space-y-2 text-sm">
            <div className="text-white font-semibold">Browse</div>
            <Link to="/writing" className="block hover:text-white" style={{ color: MUTED }}>
              Writing
            </Link>
            <Link to="/videos" className="block hover:text-white" style={{ color: MUTED }}>
              Videos
            </Link>
          </div>
          <div className="space-y-2 text-sm">
            <div className="text-white font-semibold">Account</div>
            {session ? (
              <Link to="/account" className="block hover:text-white" style={{ color: MUTED }}>
                Account
              </Link>
            ) : (
              <>
                <Link to="/login" className="block hover:text-white" style={{ color: MUTED }}>
                  Log in
                </Link>
                <Link to="/register" className="block hover:text-white" style={{ color: MUTED }}>
                  Sign up
                </Link>
              </>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="text-white font-semibold">About</div>
            <a href="#" className="block hover:text-white" style={{ color: MUTED }}>
              About
            </a>
            <a href="#" className="block hover:text-white" style={{ color: MUTED }}>
              Contact
            </a>
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-xs" style={{ color: MUTED }}>
          <span>&copy; {new Date().getFullYear()} TimezofToday</span>
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
            <button
              onClick={() => setLight((v) => !v)}
              aria-label="Toggle display mode"
              className="ml-3 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: BORDER, color: "#e5e5e5" }}
            >
              <span aria-hidden>{light ? "☾" : "☀"}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
