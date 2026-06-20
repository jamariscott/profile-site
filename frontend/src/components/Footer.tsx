import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Footer() {
  const session = useAuth();

  return (
    <footer className="border-t border-line">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
        <span>© {new Date().getFullYear()} TimezofToday</span>
        <div className="flex items-center gap-6">
          <Link to="/writing" className="hover:text-text transition-colors">
            Writing
          </Link>
          <Link to="/videos" className="hover:text-text transition-colors">
            Videos
          </Link>
          {session ? (
            <Link to="/account" className="hover:text-text transition-colors">
              Account
            </Link>
          ) : (
            <Link to="/login" className="hover:text-text transition-colors">
              Log in
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
