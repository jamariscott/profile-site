import { NavLink } from "react-router-dom";

function navLinkClass(isActive: boolean) {
  return [
    "text-sm transition",
    isActive
      ? "text-gray-900 font-medium dark:text-white"
      : "text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white",
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
    </nav>
  );
}
