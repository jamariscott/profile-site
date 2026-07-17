import { Link } from "react-router-dom";
import TrackEmbed, { resolveEmbed } from "./TrackEmbed";
import ShareButton from "./ShareButton";
import {
  GitHubIcon,
  SpotifyIcon,
  TwitterIcon,
  InstagramIcon,
  LinkedInIcon,
  YouTubeIcon,
  SoundCloudIcon,
  AppleMusicIcon,
  TikTokIcon,
  FacebookIcon,
  GlobeIcon,
  UntitledIcon,
} from "./icons";

function getLinkIcon(href: string) {
  const url = href.toLowerCase().trim();
  if (/github\.com/.test(url)) return <GitHubIcon size={16} className="text-text shrink-0" />;
  if (/spotify\.com/.test(url)) return <SpotifyIcon size={16} className="text-[#1DB954] shrink-0" />;
  if (/twitter\.com|x\.com/.test(url)) return <TwitterIcon size={16} className="text-text shrink-0" />;
  if (/instagram\.com/.test(url)) return <InstagramIcon size={16} className="text-[#E1306C] shrink-0" />;
  if (/linkedin\.com/.test(url)) return <LinkedInIcon size={16} className="text-[#0A66C2] shrink-0" />;
  if (/youtube\.com|youtu\.be/.test(url)) return <YouTubeIcon size={16} className="text-[#FF0000] shrink-0" fill="currentColor" />;
  if (/soundcloud\.com/.test(url)) return <SoundCloudIcon size={16} className="text-[#FF5500] shrink-0" />;
  if (/music\.apple\.com/.test(url)) return <AppleMusicIcon size={16} className="text-[#FA243C] shrink-0" />;
  if (/tiktok\.com/.test(url)) return <TikTokIcon size={16} className="text-text shrink-0" />;
  if (/facebook\.com/.test(url)) return <FacebookIcon size={16} className="text-[#1877F2] shrink-0" />;
  if (/untitled\.stream/.test(url)) return <UntitledIcon size={16} className="text-text shrink-0" />;
  return <GlobeIcon size={16} className="text-subtle shrink-0" />;
}

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
      // Releases linking to a platform TrackEmbed knows how to embed (Spotify/Apple
      // Music album, SoundCloud set, etc.) play inline; everything else stays a
      // cover-art tile that just links out.
      const playable = profile.releases.filter((r) => r.link && resolveEmbed(r.link));
      const tiles = profile.releases.filter((r) => !(r.link && resolveEmbed(r.link)));
      return (
        <section key="releases" className="mb-12">
          <h2 className="text-sm font-medium tracking-widest uppercase text-muted mb-4">Releases</h2>
          {playable.length > 0 && (
            <div className="space-y-4 mb-4">
              {playable.map((r) => (
                <TrackEmbed key={r.id} url={r.link!} title={r.year ? `${r.title} (${r.year})` : r.title} />
              ))}
            </div>
          )}
          {tiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {tiles.map((r) => {
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
          )}
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

  const allEmpty = profile.links.length === 0 && sections.every((s) => {
    if (s.type === "about") return !profile.bio;
    if (s.type === "projects") return profile.projects.length === 0;
    if (s.type === "tracks") return profile.tracks.length === 0;
    if (s.type === "releases") return profile.releases.length === 0;
    if (s.type === "shows") return profile.shows.length === 0;
    return true;
  });

  return (
    <>
      <header className="flex items-start justify-between gap-5 mb-8">
        <div className="flex items-center gap-5">
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
        </div>
        <ShareButton username={profile.username} displayName={profile.display_name} />
      </header>

      {profile.links.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-12">
          {profile.links.map((l) => (
            <a
              key={l.id}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-5 py-2.5 bg-surface border border-line rounded-btn hover:border-line-strong hover:bg-surface-2 transition-all text-text shadow-sm hover:shadow-md"
            >
              {getLinkIcon(l.href)}
              <span>{l.label}</span>
            </a>
          ))}
        </div>
      )}

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
