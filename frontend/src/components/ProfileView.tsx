import { useCallback, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { MapPin, X } from "lucide-react";
import { useEscapeKey } from "../lib/useEscapeKey";
import TrackEmbed, { resolveEmbed } from "./TrackEmbed";
import ShareButton from "./ShareButton";
import type { ProfileStyle } from "./ProfileFrame";
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
export interface ProfilePhoto { id: number; image_url: string; caption: string | null; }
export interface ProfileClip { id: number; url: string; title: string | null; }
export interface ProfilePost { id: number; title: string; body: string | null; created_at: string | null; }
export interface LayoutSection { type: string; visible: boolean; }

export interface PublicProfile {
  username: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  theme: string | null;
  style?: ProfileStyle;
  is_public: boolean;
  layout: LayoutSection[];
  genres: string[];
  projects: ProfileProject[];
  links: ProfileLink[];
  tracks: ProfileTrack[];
  releases: ProfileRelease[];
  shows: ProfileShow[];
  photos: ProfilePhoto[];
  clips: ProfileClip[];
  posts: ProfilePost[];
}

const SECTION_LABEL: Record<string, string> = {
  about: "About",
  projects: "Projects",
  tracks: "Music",
  releases: "Releases",
  shows: "Shows",
  gallery: "Gallery",
  videos: "Videos",
  posts: "Writing",
};

function hasContent(p: PublicProfile, type: string): boolean {
  switch (type) {
    case "about": return !!p.bio;
    case "projects": return p.projects.length > 0;
    case "tracks": return p.tracks.length > 0;
    case "releases": return p.releases.length > 0;
    case "shows": return p.shows.length > 0;
    case "gallery": return (p.photos || []).length > 0;
    case "videos": return (p.clips || []).length > 0;
    case "posts": return (p.posts || []).length > 0;
    default: return false;
  }
}

/** Some usernames and display names are email addresses; never show one publicly. */
const handleOf = (username: string) => username.split("@")[0];
const nameOf = (p: PublicProfile) => (p.display_name.includes("@") ? handleOf(p.username) : p.display_name);

function Section({ type, children }: { type: string; children: ReactNode }) {
  return (
    <section id={`section-${type}`} aria-labelledby={`h-${type}`} className="scroll-mt-32 py-10 first:pt-2">
      <h2 id={`h-${type}`} className="mb-5 font-heading text-2xl font-bold tracking-tight text-text sm:text-3xl">
        {SECTION_LABEL[type]}
      </h2>
      {children}
    </section>
  );
}

function Avatar({ profile, size }: { profile: PublicProfile; size: string }) {
  const [broken, setBroken] = useState(false);
  if (profile.avatar_url && !broken) {
    return (
      <img
        src={profile.avatar_url}
        alt={nameOf(profile)}
        className={`${size} shrink-0 rounded-full border-2 border-bg object-cover`}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div aria-hidden className={`${size} flex shrink-0 items-center justify-center rounded-full border-2 border-bg bg-accent font-heading text-3xl font-bold text-accent-contrast`}>
      {nameOf(profile).charAt(0).toUpperCase()}
    </div>
  );
}

/**
 * Pure presentational profile renderer — shared by the public /u/username page
 * and the in-dashboard live preview, so they always match. Wrap it in
 * <ProfileFrame> to apply the member's theme and customization.
 */
export default function ProfileView({
  profile,
  embedded = false,
  isOwner = false,
}: {
  profile: PublicProfile;
  /** Rendered inside the dashboard preview: no sticky section nav. */
  embedded?: boolean;
  /** The viewer owns this page: show prompts to add content. */
  isOwner?: boolean;
}) {
  const style = profile.style ?? {};
  const header = style.header ?? "classic";
  const sections = (profile.layout || []).filter((s) => s.visible && hasContent(profile, s.type));
  const [lightbox, setLightbox] = useState<ProfilePhoto | null>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  useEscapeKey(lightbox !== null, closeLightbox);

  const renderSection = (type: string) => {
    if (type === "about") {
      return (
        <Section key={type} type={type}>
          <p className="max-w-[65ch] whitespace-pre-wrap text-lg leading-relaxed text-text">{profile.bio}</p>
        </Section>
      );
    }
    if (type === "projects") {
      return (
        <Section key={type} type={type}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {profile.projects.map((p) => (
              <div key={p.id} className="rounded-card border border-line bg-surface p-6 shadow-card">
                <h3 className="font-heading text-xl font-semibold text-text">{p.title}</h3>
                {p.description && <p className="mt-2 text-muted">{p.description}</p>}
                {p.status && (
                  <span className="mt-4 inline-block rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted">{p.status}</span>
                )}
              </div>
            ))}
          </div>
        </Section>
      );
    }
    if (type === "tracks") {
      const videoTracks = profile.tracks.filter((t) => resolveEmbed(t.url)?.aspect);
      const otherTracks = profile.tracks.filter((t) => !resolveEmbed(t.url)?.aspect);
      return (
        <Section key={type} type={type}>
          {videoTracks.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
        </Section>
      );
    }
    if (type === "releases") {
      // Releases linking to a platform TrackEmbed can embed play inline; the
      // rest stay cover-art tiles that link out.
      const playable = profile.releases.filter((r) => r.link && resolveEmbed(r.link));
      const tiles = profile.releases.filter((r) => !(r.link && resolveEmbed(r.link)));
      return (
        <Section key={type} type={type}>
          {playable.length > 0 && (
            <div className="mb-5 space-y-4">
              {playable.map((r) => (
                <TrackEmbed key={r.id} url={r.link!} title={r.year ? `${r.title} (${r.year})` : r.title} />
              ))}
            </div>
          )}
          {tiles.length > 0 && (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {tiles.map((r) => {
                const inner = (
                  <>
                    <div className="mb-2 aspect-square overflow-hidden rounded-card bg-surface-2">
                      {r.cover_url && (
                        <img
                          src={r.cover_url}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      )}
                    </div>
                    <h3 className="text-sm font-semibold leading-tight text-text">{r.title}</h3>
                    {r.year && <span className="text-xs text-subtle">{r.year}</span>}
                  </>
                );
                return r.link ? (
                  <a key={r.id} href={r.link} target="_blank" rel="noopener noreferrer" className="group block">
                    {inner}
                  </a>
                ) : (
                  <div key={r.id}>{inner}</div>
                );
              })}
            </div>
          )}
        </Section>
      );
    }
    if (type === "shows") {
      return (
        <Section key={type} type={type}>
          <ul className="divide-y divide-line border-y border-line">
            {profile.shows.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
                <div className="min-w-0">
                  <p className="font-heading text-lg font-semibold text-text">{s.date || "Date to be announced"}</p>
                  <p className="text-muted">{[s.venue, s.city].filter(Boolean).join(", ") || "Venue to be announced"}</p>
                </div>
                {s.ticket_url && (
                  <a
                    href={s.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
                  >
                    Get tickets
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Section>
      );
    }
    if (type === "gallery") {
      return (
        <Section key={type} type={type}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(profile.photos || []).map((ph) => (
              <button
                key={ph.id}
                type="button"
                onClick={() => setLightbox(ph)}
                aria-label={ph.caption ? `View photo: ${ph.caption}` : "View photo"}
                className="group aspect-square cursor-zoom-in overflow-hidden rounded-card border border-line bg-surface-2"
              >
                <img
                  src={ph.image_url}
                  alt={ph.caption || ""}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </Section>
      );
    }
    if (type === "videos") {
      return (
        <Section key={type} type={type}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(profile.clips || []).map((c) => (
              <TrackEmbed key={c.id} url={c.url} title={c.title} />
            ))}
          </div>
        </Section>
      );
    }
    if (type === "posts") {
      return (
        <Section key={type} type={type}>
          <div className="space-y-10">
            {(profile.posts || []).map((p) => (
              <article key={p.id} className="border-b border-line pb-10 last:border-b-0">
                <h3 className="mb-1 font-heading text-2xl font-bold text-text">{p.title}</h3>
                {p.created_at && (
                  <time dateTime={p.created_at} className="mb-4 block text-sm text-subtle">
                    {new Date(p.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                )}
                {p.body && <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: p.body }} />}
              </article>
            ))}
          </div>
        </Section>
      );
    }
    return null;
  };

  const name = nameOf(profile);
  const meta = (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
      <span>@{handleOf(profile.username)}</span>
      {style.location && (
        <span className="inline-flex items-center gap-1">
          <MapPin size={14} aria-hidden />
          {style.location}
        </span>
      )}
    </div>
  );
  const status = style.status && (
    <p className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-text">
      <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-accent" />
      <span className="min-w-0 break-words">{style.status}</span>
    </p>
  );
  const genres = profile.genres?.length > 0 && (
    <div className="mt-4 flex flex-wrap gap-2">
      {profile.genres.map((g) => (
        <span key={g} className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted">
          {g}
        </span>
      ))}
    </div>
  );
  const share = <ShareButton username={profile.username} displayName={name} />;

  return (
    <>
      {/* Header: classic (photo beside name), big name, or cover image. */}
      <header className="pb-8">
        {header === "cover" && (
          <div className="mb-[-3rem] aspect-[3/1] w-full overflow-hidden rounded-card bg-accent sm:mb-[-4rem]">
            {style.cover_url && <img src={style.cover_url} alt="" className="h-full w-full object-cover" />}
          </div>
        )}

        {header === "bigname" ? (
          <div>
            <div className="flex items-start justify-between gap-4">
              <Avatar profile={profile} size="h-16 w-16" />
              {share}
            </div>
            <h1 className="mt-6 break-words font-heading text-[clamp(3rem,11vw,7.5rem)] font-black leading-[0.88] tracking-tight text-text">
              {name}
            </h1>
            {profile.headline && <p className="mt-4 max-w-2xl text-xl text-muted">{profile.headline}</p>}
            {meta}
            {status}
            {genres}
          </div>
        ) : (
          <div className={header === "cover" ? "px-4 sm:px-6" : ""}>
            <div className="flex items-end justify-between gap-4">
              <Avatar profile={profile} size={header === "cover" ? "h-24 w-24 sm:h-32 sm:w-32" : "h-20 w-20 sm:h-24 sm:w-24"} />
              <div className={header === "cover" ? "pb-2" : ""}>{share}</div>
            </div>
            <h1 className="mt-5 break-words font-heading text-4xl font-bold leading-tight tracking-tight text-text sm:text-5xl">{name}</h1>
            {profile.headline && <p className="mt-2 max-w-2xl text-lg text-muted">{profile.headline}</p>}
            {meta}
            {status}
            {genres}
          </div>
        )}

        {profile.links.length > 0 && (
          <div className={`mt-8 flex flex-wrap gap-3 ${header === "cover" ? "px-4 sm:px-6" : ""}`}>
            {profile.links.map((l) => (
              <a
                key={l.id}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-btn border border-line bg-surface px-5 py-3 font-medium text-text shadow-card transition-colors hover:border-line-strong hover:bg-surface-2"
              >
                {getLinkIcon(l.href)}
                <span>{l.label}</span>
              </a>
            ))}
          </div>
        )}

        {!profile.is_public && (
          <p className="mt-6 rounded-btn border border-dashed border-line-strong px-4 py-3 text-sm text-muted">
            Private: only you can see this page. Make it public from your account.
          </p>
        )}
      </header>

      {/* Jump links to each section, once there's more than one. */}
      {sections.length > 1 && (
        <nav
          aria-label="Sections"
          className={`${embedded ? "" : "sticky top-16 z-30"} -mx-4 mb-2 border-y border-line bg-bg/90 px-4 backdrop-blur sm:-mx-6 sm:px-6`}
        >
          <ul className="flex gap-6 overflow-x-auto py-3 text-sm font-semibold [scrollbar-width:none]">
            {sections.map((s) => (
              <li key={s.type} className="shrink-0">
                <a href={`#section-${s.type}`} className="text-muted underline-offset-[6px] hover:text-text hover:underline hover:decoration-accent hover:decoration-2">
                  {SECTION_LABEL[s.type]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="divide-y divide-line">{sections.map((s) => renderSection(s.type))}</div>

      {sections.length === 0 && profile.links.length === 0 && (
        <p className="py-10 text-muted">
          This page is just getting started.
          {isOwner && (
            <>
              {" "}
              <Link to="/account" className="font-semibold text-text underline decoration-accent decoration-2 underline-offset-4">
                Add your first work
              </Link>
            </>
          )}
        </p>
      )}

      {lightbox && (
        <div
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.caption || "Photo"}
          className="on-dark fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/85 p-4"
        >
          <img src={lightbox.image_url} alt={lightbox.caption || ""} className="max-h-full max-w-full rounded-card object-contain" />
          <button type="button" onClick={closeLightbox} aria-label="Close" className="absolute right-5 top-5 text-white/80 hover:text-white" autoFocus>
            <X size={28} aria-hidden />
          </button>
        </div>
      )}
    </>
  );
}
