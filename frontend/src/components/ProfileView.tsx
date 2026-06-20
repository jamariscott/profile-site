import { Link } from "react-router-dom";
import TrackEmbed, { resolveEmbed } from "./TrackEmbed";

export interface ProfileProject { id: number; title: string; description: string | null; status: string | null; }
export interface ProfileLink { id: number; label: string; href: string; note: string | null; }
export interface ProfileTrack { id: number; url: string; title: string | null; }
export interface ProfileRelease { id: number; title: string; year: string | null; cover_url: string | null; link: string | null; }
export interface ProfileShow { id: number; date: string | null; venue: string | null; city: string | null; ticket_url: string | null; }
export interface LayoutSection { type: string; visible: boolean; }

export interface PublicProfile {
  username: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  theme: string | null;
  is_public: boolean;
  layout: LayoutSection[];
  genres: string[];
  projects: ProfileProject[];
  links: ProfileLink[];
  tracks: ProfileTrack[];
  releases: ProfileRelease[];
  shows: ProfileShow[];
}

/**
 * Pure presentational profile renderer — shared by the public /u/username page
 * and the in-dashboard live preview, so they always match.
 */
export default function ProfileView({ profile }: { profile: PublicProfile }) {
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
    if (type === "tracks") {
      if (profile.tracks.length === 0) return null;
      const videoTracks = profile.tracks.filter((t) => resolveEmbed(t.url)?.aspect);
      const otherTracks = profile.tracks.filter((t) => !resolveEmbed(t.url)?.aspect);
      return (
        <section key="tracks" className="mb-12">
          <h2 className="text-sm font-medium tracking-widest uppercase text-muted mb-4">Music</h2>
          {videoTracks.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {videoTracks.map((t) => (
                <TrackEmbed key={t.id} url={t.url} title={t.title} />
              ))}
            </div>
          )}
          {otherTracks.length > 0 && (
            <div className="space-y-4">
              {otherTracks.map((t) => (
                <TrackEmbed key={t.id} url={t.url} title={t.title} />
              ))}
            </div>
          )}
        </section>
      );
    }
    if (type === "releases") {
      if (profile.releases.length === 0) return null;
      return (
        <section key="releases" className="mb-12">
          <h2 className="text-sm font-medium tracking-widest uppercase text-muted mb-4">Releases</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {profile.releases.map((r) => {
              const inner = (
                <>
                  <div className="aspect-square rounded-card overflow-hidden bg-surface-2 mb-2">
                    {r.cover_url && (
                      <img
                        src={r.cover_url}
                        alt={r.title}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    )}
                  </div>
                  <h3 className="text-text text-sm font-medium leading-tight">{r.title}</h3>
                  {r.year && <span className="text-subtle text-xs">{r.year}</span>}
                </>
              );
              return r.link ? (
                <a key={r.id} href={r.link} target="_blank" rel="noopener noreferrer" className="block group">
                  {inner}
                </a>
              ) : (
                <div key={r.id}>{inner}</div>
              );
            })}
          </div>
        </section>
      );
    }
    if (type === "shows") {
      if (profile.shows.length === 0) return null;
      return (
        <section key="shows" className="mb-12">
          <h2 className="text-sm font-medium tracking-widest uppercase text-muted mb-4">Shows</h2>
          <div className="border-t border-line">
            {profile.shows.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 py-3 border-b border-line">
                <div className="text-sm">
                  <span className="text-text font-medium">{s.date || "TBA"}</span>
                  <span className="text-muted"> — {[s.venue, s.city].filter(Boolean).join(", ") || "Venue TBA"}</span>
                </div>
                {s.ticket_url && (
                  <a href={s.ticket_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover text-sm font-medium shrink-0">
                    Tickets
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }
    return null;
  };

  const allEmpty = sections.every((s) => {
    if (s.type === "about") return !profile.bio;
    if (s.type === "projects") return profile.projects.length === 0;
    if (s.type === "links") return profile.links.length === 0;
    if (s.type === "tracks") return profile.tracks.length === 0;
    if (s.type === "releases") return profile.releases.length === 0;
    if (s.type === "shows") return profile.shows.length === 0;
    return true;
  });

  return (
    <>
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
          {profile.genres && profile.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.genres.map((g) => (
                <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-surface-2 text-muted">{g}</span>
              ))}
            </div>
          )}
        </div>
      </header>

      {!profile.is_public && (
        <p className="text-xs text-subtle mb-6">Private — only you can see this. Make it public from your account.</p>
      )}

      {sections.map((s) => renderSection(s.type))}

      {allEmpty && (
        <p className="text-muted">
          This profile is just getting started. <Link to="/account" className="text-accent hover:text-accent-hover">Add some content →</Link>
        </p>
      )}
    </>
  );
}
