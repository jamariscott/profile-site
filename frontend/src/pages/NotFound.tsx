import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import { LogoMark } from "../components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <SiteNav />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-20 sm:px-6">
        <LogoMark size={56} />
        <h1 className="mt-6 font-heading text-[clamp(2.75rem,7vw,4.5rem)] font-black leading-[0.95] tracking-tight [font-stretch:80%]">
          This page doesn't exist.
        </h1>
        <p className="mt-4 text-lg text-muted">The link may be old or mistyped. Here's where you can go instead:</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="rounded-btn bg-accent px-5 py-3 font-semibold text-accent-contrast hover:bg-accent-hover">
            Go to the home page
          </Link>
          <Link to="/discover" className="rounded-btn border-2 border-text px-5 py-3 font-semibold hover:bg-surface-2">
            Discover people
          </Link>
          <Link to="/search" className="rounded-btn border-2 border-line-strong px-5 py-3 font-semibold hover:border-text">
            Search
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
