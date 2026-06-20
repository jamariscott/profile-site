import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

const BG = "#0a0909";
const BORDER = "#1f1f1f";
const RED = "#db3d3b";

function navLinkClass(isActive: boolean) {
  return ["text-sm font-medium transition", isActive ? "text-white" : ""].join(" ");
}

export default function DailyWireNav() {
  const session = useAuth();

  return (
    <header style={{ background: BG, borderBottom: `1px solid ${BORDER}` }}>
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-3 items-center h-16">
        <div className="flex items-center gap-6" style={{ color: "#e5e5e5" }}>
          <NavLink to="/" end className={({ isActive }) => navLinkClass(isActive)} style={{ color: "inherit" }}>
            Home
          </NavLink>
          <NavLink to="/writing" className={({ isActive }) => navLinkClass(isActive)} style={{ color: "inherit" }}>
            Writing
          </NavLink>
          <NavLink to="/videos" className={({ isActive }) => navLinkClass(isActive)} style={{ color: "inherit" }}>
            Videos
          </NavLink>
        </div>
        <div className="justify-self-center flex items-center gap-2">
          <span style={{ color: RED }} aria-hidden>
            &#9873;
          </span>
          <Link to="/" className="text-white font-extrabold uppercase tracking-tight text-lg md:text-xl">
            TimezofToday
          </Link>
        </div>
        <div className="flex items-center gap-5 text-sm justify-self-end" style={{ color: "#e5e5e5" }}>
          <span className="opacity-80 hidden sm:inline" aria-hidden>
            &#128269;
          </span>
          {session ? (
            <Link to="/account">Account</Link>
          ) : (
            <Link to="/login">Log In</Link>
          )}
          <Link
            to="/register"
            style={{ background: RED }}
            className="text-white px-5 py-2 rounded-full font-bold text-xs whitespace-nowrap hover:opacity-90 transition-opacity"
          >
            SIGN UP
          </Link>
        </div>
      </div>
    </header>
  );
}
