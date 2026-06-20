import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useTheme } from "../theme/ThemeProvider";
import { isDarkTheme } from "../lib/themes";

const RED = "#db3d3b";

function navLinkClass(isActive: boolean) {
  return ["text-sm font-medium transition", isActive ? "underline" : ""].join(" ");
}

export default function DailyWireNav() {
  const session = useAuth();
  const { theme } = useTheme();
  const dark = isDarkTheme(theme);

  const bg = dark ? "#0a0909" : "#f5f5f5";
  const border = dark ? "#1f1f1f" : "#e0e0e0";
  const text = dark ? "#e5e5e5" : "#3a3a3a";
  const logoText = dark ? "#ffffff" : "#111111";

  return (
    <header style={{ background: bg, borderBottom: `1px solid ${border}` }}>
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-3 items-center h-16">
        <div className="flex items-center gap-6" style={{ color: text }}>
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
          <Link
            to="/"
            className="font-extrabold uppercase tracking-tight text-lg md:text-xl"
            style={{ color: logoText }}
          >
            TimezofToday
          </Link>
        </div>
        <div className="flex items-center gap-5 text-sm justify-self-end" style={{ color: text }}>
          <span className="opacity-80 hidden sm:inline" aria-hidden>
            &#128269;
          </span>
          {session ? (
            <Link to="/account" style={{ color: "inherit" }}>
              Account
            </Link>
          ) : (
            <Link to="/login" style={{ color: "inherit" }}>
              Log In
            </Link>
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
