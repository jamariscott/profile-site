import Admin from "./pages/Admin";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import PageNav from "./components/PageNav";

import Writing from "./pages/Writing";
import WritingPost from "./pages/WritingPost";
import Videos from "./pages/Videos";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Profile from "./pages/Profile";
import AdminThemeSwitcher from "./components/AdminThemeSwitcher";

import { API_BASE } from "./lib/config";
import { useAuth } from "./lib/auth";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/writing" element={<Writing />} />
        <Route path="/writing/:slug" element={<WritingPost />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/account" element={<Account />} />
        <Route path="/u/:username" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <AdminThemeSwitcher />
    </>
  );
}

interface WritingPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  sponsor_logo?: string;
  content?: string;
}

function extractThumbnail(post: WritingPost): string | null {
  if (post.sponsor_logo) return post.sponsor_logo;
  if (post.content) {
    const match = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match) return match[1];
  }
  return null;
}

function Home() {
  const session = useAuth();
  const [articles, setArticles] = useState<WritingPost[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/writing`)
      .then((res) => res.json())
      .then((data) => setArticles(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Logged-in users land on their own profile; the public home is the platform
  // hero + articles feed.
  if (session) {
    return <Navigate to={`/u/${session.user.username}`} replace />;
  }

  const [hero, ...rest] = articles;
  const heroThumb = hero ? extractThumbnail(hero) : null;

  return (
    <div className="bg-bg min-h-screen">
      <PageNav />

      {/* Brand hero + sign-up CTA */}
      <section className="border-b border-line">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-text tracking-tight">TimezofToday</h1>
          <p className="text-lg text-muted mt-5 max-w-2xl mx-auto leading-relaxed">
            Build a profile for whatever you do — show your work, share your links, and tell your story.
            Plus the latest reads from the community.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              to="/register"
              className="bg-accent text-accent-contrast px-6 py-3 rounded-btn font-medium hover:bg-accent-hover transition-colors"
            >
              Create your profile
            </Link>
            <Link
              to="/login"
              className="border border-line text-text px-6 py-3 rounded-btn font-medium hover:bg-surface-2 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Articles */}
      <div className="max-w-5xl mx-auto px-6 py-14">
        <h2 className="text-sm font-medium tracking-widest uppercase text-muted mb-8">Latest</h2>

        {articles.length === 0 ? (
          <p className="text-muted">No articles yet.</p>
        ) : (
          <>
            {/* Featured article */}
            {hero && (
              <Link to={`/writing/${hero.slug}`} className="block group mb-14">
                {heroThumb && (
                  <div className="w-full h-72 md:h-96 rounded-card overflow-hidden mb-5">
                    <img
                      src={heroThumb}
                      alt={hero.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <span className="text-xs text-muted block mb-2">{hero.date}</span>
                <h3 className="text-3xl md:text-4xl font-bold text-text group-hover:text-muted transition-colors leading-tight mb-3">
                  {hero.title}
                </h3>
                <p className="text-muted md:text-lg line-clamp-2 max-w-3xl">{hero.summary}</p>
              </Link>
            )}

            {/* Rest of the feed */}
            {rest.length > 0 && (
              <>
                <hr className="border-line mb-10" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {rest.map((post) => {
                    const thumb = extractThumbnail(post);
                    return (
                      <Link key={post.slug} to={`/writing/${post.slug}`} className="block group">
                        {thumb && (
                          <div className="w-full h-40 rounded-xl overflow-hidden mb-3">
                            <img
                              src={thumb}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <span className="text-xs text-muted block mb-1">{post.date}</span>
                        <h3 className="font-semibold text-text group-hover:text-muted transition-colors leading-snug mb-1">
                          {post.title}
                        </h3>
                        <p className="text-muted text-sm line-clamp-2">{post.summary}</p>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
