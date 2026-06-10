import Admin from "./pages/Admin";
import { Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";

import Layout from "./components/Layout";
import Section from "./components/Section";
import Card from "./components/Card";

import Writing from "./pages/Writing";
import WritingPost from "./pages/WritingPost";
import Videos from "./pages/Videos";

import { API_BASE } from "./lib/config";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/writing" element={<Writing />} />
      <Route path="/writing/:slug" element={<WritingPost />} />
      <Route path="/videos" element={<Videos />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
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
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [articles, setArticles] = useState<WritingPost[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/profile`)
      .then(res => res.json())
      .then(data => setProfile(data));

    fetch(`${API_BASE}/api/projects`)
      .then(res => res.json())
      .then(data => setProjects(data));

    fetch(`${API_BASE}/api/links`)
      .then(res => res.json())
      .then(data => setLinks(data));

    fetch(`${API_BASE}/api/writing`)
      .then(res => res.json())
      .then(data => setArticles(data.slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <Layout>
      {/* Profile Section */}
      <Section>
        {profile && (
          <div>
            <h1 className="text-5xl font-bold text-zinc-900">{profile.name}</h1>
            <p className="text-xl text-zinc-500 mt-2">{profile.tagline}</p>
            <p className="text-zinc-600 mt-6 max-w-2xl">{profile.bio}</p>
          </div>
        )}
      </Section>

      {/* Projects */}
      <Section title="Projects">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project: any) => (
            <Card key={project.id || project.title}>
              <h3 className="text-2xl font-semibold">{project.title}</h3>
              <p className="text-zinc-600 mt-2">{project.description}</p>
              {project.status && (
                <span className="inline-block mt-4 text-xs px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full">
                  {project.status}
                </span>
              )}
            </Card>
          ))}
        </div>
      </Section>

      {/* Links */}
      <Section title="Links">
        <div className="flex flex-wrap gap-4">
          {links.map((link: any) => (
            <a
              key={link.id || link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-300 transition-colors"
            >
              {link.label}
            </a>
          ))}

          {/* Videos Link */}
          <a
            href="/videos"
            className="px-6 py-3 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-300 transition-colors flex items-center gap-2"
          >
            📺 Videos
          </a>
        </div>
      </Section>

      {/* Latest Articles */}
      {articles.length > 0 && (
        <Section title="Latest Articles">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((post) => {
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
                  <span className="text-xs text-zinc-500 block mb-1">{post.date}</span>
                  <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700 transition-colors leading-snug mb-1">
                    {post.title}
                  </h3>
                  <p className="text-zinc-600 text-sm line-clamp-2">{post.summary}</p>
                </Link>
              );
            })}
          </div>
          <div className="mt-6">
            <Link
              to="/writing"
              className="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
            >
              View all articles →
            </Link>
          </div>
        </Section>
      )}
    </Layout>
  );
}
