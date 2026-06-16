import { useEffect, useLayoutEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageNav from "../components/PageNav";
import { apiFetch } from "../lib/api";
import { isThemeId } from "../lib/themes";

interface ProfileProject { id: number; title: string; description: string | null; status: string | null; }
interface ProfileLink { id: number; label: string; href: string; note: string | null; }
interface LayoutSection { type: string; visible: boolean; }

interface PublicProfile {
  username: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  theme: string | null;
  is_public: boolean;
  layout: LayoutSection[];
  projects: ProfileProject[];
  links: ProfileLink[];
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "private" | "notfound">("loading");

  useEffect(() => {
    if (!username) return;
    setStatus("loading");
    apiFetch(`/api/profiles/${encodeURIComponent(username)}`)
      .then(async (res) => {
        if (res.status === 404) { setStatus("notfound"); return; }
        if (res.status === 403) { setStatus("private"); return; }
        if (!res.ok) { setStatus("notfound"); return; }
        const data = await res.json();
        setProfile(data);
        setStatus("ok");
      })
      .catch(() => setStatus("notfound"));
  }, [username]);

  // Apply this profile's own theme to the page; restore the platform theme on leave.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-theme");
    if (profile?.theme && isThemeId(profile.theme)) {
      root.setAttribute("data-theme", profile.theme);
    }
    return () => {
      if (previous) root.setAttribute("data-theme", previous);
    };
  }, [profile?.theme]);

  if (status === "loading") {
    return (
      <div className="bg-bg min-h-screen">
        <PageNav />
        <div className="max-w-3xl mx-auto px-6 py-16 text-muted">Loading profile…</div>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="bg-bg min-h-screen">
        <PageNav />
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold text-text mb-2">Profile not found</h1>
          <p className="text-muted">No profile exists at this address.</p>
        </div>
      </div>
    );
  }

  if (status === "private") {
    return (
      <div className="bg-bg min-h-screen">
        <PageNav />
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold text-text mb-2">This profile is private</h1>
          <p className="text-muted">The owner hasn't made this profile public.</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const sections = (profile.layout || []).filter((s) => s.visible);

  const renderSection = (type: string) => {
    if (type === "about") {
      if (!profile.bio) return null;
      return (
        <section key="about" className="mb-12">
          <h2 className="text-sm font-medium tracking-widest uppercase text-muted mb-3">About</h2>
          <p className="text-text leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
        </section>
      );
    }
    if (type === "projects") {
      if (profile.projects.length === 0) return null;
      return (
        <section key="projects" className="mb-12">
          <h2 className="text-sm font-medium tracking-widest uppercase text-muted mb-4">Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.projects.map((p) => (
              <div key={p.id} className="bg-surface border border-line rounded-card p-6 shadow-card">
                <h3 className="text-xl font-semibold text-text">{p.title}</h3>
                {p.description && <p className="text-muted mt-2">{p.description}</p>}
                {p.status && (
                  <span className="inline-block mt-4 text-xs px-3 py-1 bg-surface-2 text-muted rounded-full">{p.status}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }
    if (type === "links") {
      if (profile.links.length === 0) return null;
      return (
        <section key="links" className="mb-12">
          <h2 className="text-sm font-medium tracking-widest uppercase text-muted mb-4">Links</h2>
          <div className="flex flex-wrap gap-3">
            {profile.links.map((l) => (
              <a
                key={l.id}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-surface border border-line rounded-btn hover:border-line-strong transition-colors text-text"
              >
                {l.label}
              </a>
            ))}
          </div>
        </section>
      );
    }
    return null;
  };

  return (
    <div className="bg-bg min-h-screen">
      <PageNav />
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex items-center gap-5 mb-12">
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="w-20 h-20 rounded-full object-cover border border-line"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          <div>
            <h1 className="text-4xl font-bold text-text">{profile.display_name}</h1>
            {profile.headline && <p className="text-lg text-muted mt-1">{profile.headline}</p>}
            <p className="text-subtle text-sm mt-1">@{profile.username}</p>
          </div>
        </header>

        {!profile.is_public && (
          <p className="text-xs text-subtle mb-6">Private — only you can see this. Make it public from your account.</p>
        )}

        {sections.map((s) => renderSection(s.type))}

        {sections.every((s) => {
          if (s.type === "about") return !profile.bio;
          if (s.type === "projects") return profile.projects.length === 0;
          if (s.type === "links") return profile.links.length === 0;
          return true;
        }) && (
          <p className="text-muted">This profile is just getting started. <Link to="/account" className="text-accent hover:text-accent-hover">Add some content →</Link></p>
        )}
      </div>
    </div>
  );
}
