import { NavLink } from "react-router-dom";

function navLinkClass(isActive: boolean) {
  return [
    "text-sm transition",
    isActive
      ? "text-text font-medium"
      : "text-muted hover:text-text",
  ].join(" ");
}

export default function Nav() {
  return (
    <nav className="flex items-center gap-6">
      <NavLink
        to="/"
        end
        className={({ isActive }) => navLinkClass(isActive)}
      >
        Home
      </NavLink>
      <NavLink
        to="/writing"
        className={({ isActive }) => navLinkClass(isActive)}
      >
        Writing
      </NavLink>
      <NavLink
        to="/videos"
        className={({ isActive }) => navLinkClass(isActive)}
      >
        Videos
      </NavLink>
    </nav>
  );
}