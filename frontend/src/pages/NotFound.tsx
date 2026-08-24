import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

export default function NotFound() {
  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <SiteNav />
      <div className="max-w-3xl mx-auto px-6 py-24 flex-1 w-full text-center">
        <h1 className="text-6xl font-bold text-text mb-3">404</h1>
        <p className="text-muted mb-8">We couldn't find that page.</p>
        <Link to="/" className="inline-block bg-accent text-accent-contrast px-6 py-3 rounded-btn font-medium">
          Back home
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}
