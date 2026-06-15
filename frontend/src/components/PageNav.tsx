import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";

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
      </div>
    </div>
  );
}
