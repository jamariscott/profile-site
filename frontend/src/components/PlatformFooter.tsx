import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { LogoMark } from "./Logo";

/** The one platform footer: repeats the primary action, then plain links. */
export default function PlatformFooter() {
  const session = useAuth();

  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-text">
            <LogoMark size={24} />
            <span className="font-heading text-lg font-extrabold tracking-tight [font-stretch:72%]">Timez of Today</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted">One page for what you do: your work, your links, your next show.</p>
          {!session && (
            <Link
              to="/register"
              className="mt-5 inline-flex rounded-btn bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
            >
              Claim your page
            </Link>
          )}
        </div>
        <nav aria-label="Browse" className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-text">Browse</span>
          <Link to="/discover" className="text-muted hover:text-text">Discover people</Link>
          <Link to="/writing" className="text-muted hover:text-text">Writing</Link>
          <Link to="/videos" className="text-muted hover:text-text">Videos</Link>
          <Link to="/search" className="text-muted hover:text-text">Search</Link>
        </nav>
        <nav aria-label="Account" className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-text">Account</span>
          {session ? (
            <>
              <Link to={`/u/${session.user.username}`} className="text-muted hover:text-text">Your page</Link>
              <Link to="/account" className="text-muted hover:text-text">Edit your page</Link>
            </>
          ) : (
            <>
              <Link to="/register" className="text-muted hover:text-text">Create an account</Link>
              <Link to="/login" className="text-muted hover:text-text">Log in</Link>
            </>
          )}
        </nav>
      </div>
      <div className="border-t border-line">
        <p suppressHydrationWarning className="mx-auto max-w-6xl px-4 py-5 text-xs text-subtle sm:px-6">© {new Date().getFullYear()} Timez of Today</p>
      </div>
    </footer>
  );
}
