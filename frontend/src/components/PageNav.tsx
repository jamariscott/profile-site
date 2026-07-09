import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import DarkModeToggle from "./DarkModeToggle";

function navLinkClass(isActive: boolean) {
  return [
    "text-sm transition",
    isActive
      ? "text-text font-medium"
      : "text-muted hover:text-text",
  ].join(" ");
}

export default function PageNav() {
  const session = useAuth();

  return (
    <div className="border-b border-line bg-surface">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-6">
        <NavLink to="/" end className={({ isActive }) => navLinkClass(isActive)}>
          Home
        </NavLink>
        <NavLink to="/writing" className={({ isActive }) => navLinkClass(isActive)}>
          Writing
        </NavLink>
        <NavLink to="/videos" className={({ isActive }) => navLinkClass(isActive)}>
          Videos
        </NavLink>
        {session ? (
          <NavLink to="/account" className={({ isActive }) => navLinkClass(isActive)}>
            Account
          </NavLink>
        ) : (
          <NavLink to="/login" className={({ isActive }) => navLinkClass(isActive)}>
            Log in
          </NavLink>
        )}
        <Link to="/search" aria-label="Search" className="ml-auto text-muted hover:text-text transition-colors">
          &#128269;
        </Link>
        <DarkModeToggle className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-text hover:bg-surface-2 transition-colors" />
      </div>
    </div>
  );
}
