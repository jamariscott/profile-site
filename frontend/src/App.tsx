import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Layout from "./components/Layout";
import Section from "./components/Section";
import Card from "./components/Card";

import Writing from "./pages/Writing";
import WritingPost from "./pages/WritingPost";

import Videos from './pages/Videos';

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type Profile = {
  name: string;
  tagline: string;
  bio: string;
  skills: string[];
};

type Project = {
  title: string;
  description: string;
  status?: string;
};

type LinkT = {
  label: string;
  href: string;
  note?: string;
};

function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [links, setLinks] = useState<LinkT[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/profile`)
      .then((res) => {
        if (!res.ok) throw new Error(`Profile HTTP ${res.status}`);
        return res.json();
      })
      .then(setProfile)
      .catch((err) => {
        console.error("Profile fetch failed:", err);
        setError(String(err));
      });

    fetch(`${API_BASE}/api/projects`)
      .then((res) => res.json())
      .then(setProjects)
      .catch((err) => console.error("Projects fetch failed:", err));

    fetch(`${API_BASE}/api/links`)
      .then((res) => res.json())
      .then(setLinks)
      .catch((err) => console.error("Links fetch failed:", err));
  }, []);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-gray-700 dark:bg-neutral-950 dark:text-neutral-200">
        <div className="max-w-xl px-6">
          <p className="font-medium">Backend connection problem</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400">
            API base: <span className="font-mono">{API_BASE}</span>
          </p>
          <pre className="mt-4 whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
            {error}
          </pre>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-neutral-400 dark:bg-neutral-950 dark:text-neutral-500">
        Loading…
      </main>
    );
  }

  return (
    <Layout>
      <header className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{profile.name}</h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400">{profile.tagline}</p>
      </header>

      <section>
        <p className="max-w-2xl leading-relaxed text-neutral-700 dark:text-neutral-400">
          {profile.bio}
        </p>
      </section>

      {projects.length > 0 && (
        <Section title="Projects">
          <div className="grid gap-6 sm:grid-cols-2">
            {projects.map((project) => (
              <Card key={project.title} title={project.title} meta={project.status}>
                {project.description}
              </Card>
            ))}
          </div>
        </Section>
      )}

      {links.length > 0 && (
        <Section eyebrow="Elsewhere">
          <ul className="space-y-4">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex flex-col"
                >
                  <span className="font-medium group-hover:underline">{link.label}</span>
                  {link.note && (
                    <span className="text-sm text-gray-500 dark:text-neutral-400">{link.note}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section eyebrow="Focus Areas">
        <ul className="flex flex-wrap gap-3">
          {profile.skills.map((skill) => (
            <li
              key={skill}
              className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 transition hover:bg-gray-100
                         dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              {skill}
            </li>
          ))}
        </ul>
      </Section>

      <footer className="text-sm text-gray-500 dark:text-neutral-500">
        © {new Date().getFullYear()} Jamari Robinson
      </footer>
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/writing" element={<Writing />} />
      <Route path="/writing/:slug" element={<WritingPost />} />
      <Route path="/videos" element={<Videos />} />
    </Routes>
  );
}
