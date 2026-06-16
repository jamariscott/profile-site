import Admin from "./pages/Admin";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Layout from "./components/Layout";
import Section from "./components/Section";

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
      .then(res => res.json())
      .then(data => setArticles(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Logged-in users land on their own profile; the public home is the articles feed.
  if (session) {
    return <Navigate to={`/u/${session.user.username}`} replace />;
  }

  return (
    <Layout>
      <Section title="Latest">
        {articles.length === 0 ? (
          <p className="text-muted">No articles yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map((post) => {
              const thumb = extractThumbnail(post);
              return (
                <Link key={post.slug} to={`/writing/${post.slug}`} className="block group">
                  {thumb && (
                    <div className="w-full h-44 rounded-xl overflow-hidden mb-3">
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
        )}
      </Section>
    </Layout>
  );
}
