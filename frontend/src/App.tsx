import Admin from "./pages/Admin";
import { Routes, Route } from "react-router-dom";
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

function Home() {
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);

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

          {/* New Videos Link */}
          <a
            href="/videos"
            className="px-6 py-3 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-300 transition-colors flex items-center gap-2"
          >
            📺 Videos
          </a>
        </div>
      </Section>
    </Layout>
  );
}