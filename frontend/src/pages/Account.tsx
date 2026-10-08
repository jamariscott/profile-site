import { useEffect, useState, useRef, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Circle,
  ExternalLink,
  Eye,
  FileText,
  Film,
  FolderKanban,
  Image as ImageIcon,
  Link2,
  LogOut,
  Music,
  Palette,
  Settings,
  User,
} from "lucide-react";
import SiteNav from "../components/SiteNav";
import { apiJson, apiFetch } from "../lib/api";
import { fetchOEmbedTitle } from "../lib/oembed";
import { useAuth, clearSession } from "../lib/auth";
import { THEMES, type ThemeId } from "../lib/themes";
import MusicManager from "../components/MusicManager";
import GalleryManager from "../components/GalleryManager";
import ClipManager from "../components/ClipManager";
import PostManager from "../components/PostManager";
import ProfileView, { type PublicProfile, type LayoutSection } from "../components/ProfileView";
import ProfileFrame, { type ProfileStyle } from "../components/ProfileFrame";
import AppearanceEditor from "../components/AppearanceEditor";
import { inputClass } from "../components/AuthFields";
import { compressAndResizeImage } from "../lib/upload";
import { ALL_SECTION_TYPES, presetFor } from "../lib/professions";
import { formatDate } from "../lib/format";

interface MyComment {
  id: number;
  body: string;
  writing_slug: string;
  status: string;
  created_at: string | null;
}

interface MyProject {
  id: number;
  title: string;
  description: string | null;
  status: string | null;
}

interface MyLink {
  id: number;
  label: string;
  href: string;
  note: string | null;
}

const SECTION_LABELS: Record<string, string> = {
  about: "About",
  projects: "Projects",
  tracks: "Tracks",
  releases: "Releases",
  shows: "Shows",
  gallery: "Gallery",
  videos: "Videos",
  posts: "Writing",
};

type Tab = "profile" | "appearance" | "links" | "music" | "gallery" | "videos" | "posts" | "projects" | "preview" | "settings";

const NAV: { group: string; items: { id: Tab; label: string; icon: typeof User; profession?: ThemeId; mobileOnly?: boolean }[] }[] = [
  {
    group: "Your page",
    items: [
      { id: "profile", label: "Profile", icon: User },
      { id: "appearance", label: "Appearance", icon: Palette },
      { id: "links", label: "Links", icon: Link2 },
      { id: "preview", label: "Preview", icon: Eye, mobileOnly: true },
    ],
  },
  {
    group: "Content",
    items: [
      { id: "music", label: "Music", icon: Music, profession: "music" },
      { id: "gallery", label: "Gallery", icon: ImageIcon, profession: "photographer" },
      { id: "videos", label: "Videos", icon: Film, profession: "creator" },
      { id: "posts", label: "Writing", icon: FileText, profession: "writer" },
      { id: "projects", label: "Projects", icon: FolderKanban },
    ],
  },
  { group: "Account", items: [{ id: "settings", label: "Settings", icon: Settings }] },
];

const TAB_TITLE: Record<Tab, { title: string; hint: string }> = {
  profile: { title: "Profile", hint: "Who you are and what you do. This is the top of your page." },
  appearance: { title: "Appearance", hint: "Make your page look like you. Changes show in the preview right away." },
  links: { title: "Links", hint: "Buttons under your name: your socials, store, booking page and more." },
  music: { title: "Music", hint: "Tracks, releases and upcoming shows." },
  gallery: { title: "Gallery", hint: "Photos shown in a grid that opens full screen." },
  videos: { title: "Videos", hint: "Videos from YouTube and other platforms." },
  posts: { title: "Writing", hint: "Posts you write and publish on your page." },
  projects: { title: "Projects", hint: "Things you've built or are working on." },
  preview: { title: "Preview", hint: "How visitors see your page, including unsaved changes." },
  settings: { title: "Settings", hint: "Your account, password and comments." },
};

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-line bg-surface p-5 sm:p-6 ${className}`}>{children}</div>;
}

function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-text">
      {children}
      {hint && <span className="ml-1 font-normal text-muted">{hint}</span>}
    </label>
  );
}

const primaryBtn =
  "rounded-btn bg-accent px-5 py-2.5 font-semibold text-accent-contrast transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50";
const secondaryBtn = "rounded-btn border-2 border-line-strong px-4 py-2 text-sm font-semibold text-text transition-colors hover:border-text";

export default function Account() {
  const session = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("profile");
  const [comments, setComments] = useState<MyComment[]>([]);
  const [loading, setLoading] = useState(true);

  // profile editor
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [profileTheme, setProfileTheme] = useState<ThemeId | "">("");
  const [genres, setGenres] = useState("");
  const [layout, setLayout] = useState<LayoutSection[]>([]);
  const [style, setStyle] = useState<ProfileStyle>({});
  const [profSaving, setProfSaving] = useState(false);
  const [profNotice, setProfNotice] = useState("");
  const [profError, setProfError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [previewSource, setPreviewSource] = useState<any>(null);

  /** Every profile-field edit goes through here so the save bar knows there's something to save. */
  const edit =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setDirty(true);
      setProfNotice("");
    };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    setAvatarUploading(true);
    try {
      const base64 = await compressAndResizeImage(file, 200, 200);
      edit(setAvatarUrl)(base64);
    } catch (err: any) {
      setAvatarError(err?.message || "Couldn't use that image. Try a JPG or PNG.");
    } finally {
      setAvatarUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  // projects
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [pTitle, setPTitle] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pStatus, setPStatus] = useState("");
  const [pError, setPError] = useState("");
  const [pSaving, setPSaving] = useState(false);

  // links
  const [links, setLinks] = useState<MyLink[]>([]);
  const [lLabel, setLLabel] = useState("");
  const [lHref, setLHref] = useState("");
  const [lError, setLError] = useState("");
  const [lFetchingLabel, setLFetchingLabel] = useState(false);

  const handleLinkHrefBlur = async () => {
    if (!lHref.trim() || lLabel.trim()) return;
    setLFetchingLabel(true);
    const title = await fetchOEmbedTitle(lHref);
    setLFetchingLabel(false);
    if (title) setLLabel((current) => (current.trim() ? current : title));
  };

  // change password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwNotice, setPwNotice] = useState("");
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const loadProjects = () => {
    apiJson<MyProject[]>("/api/me/projects").then(setProjects).catch(() => {});
  };

  const loadProfile = () => {
    apiJson<any>("/api/me/profile")
      .then((p) => {
        setPreviewSource(p);
        setHeadline(p.headline || "");
        setBio(p.bio || "");
        setAvatarUrl(p.avatar_url || "");
        setIsPublic(p.is_public !== false);
        setProfileTheme(p.theme || "");
        setGenres(Array.isArray(p.genres) ? p.genres.join(", ") : "");
        setStyle(p.style && typeof p.style === "object" ? p.style : {});
        // Drop any legacy "links" entry from previously-saved layouts — links
        // are no longer part of the reorderable set (see presetFor).
        const base: LayoutSection[] = (Array.isArray(p.layout) ? p.layout : []).filter((s: LayoutSection) => s.type !== "links");
        const present = new Set(base.map((s) => s.type));
        setLayout([...base, ...ALL_SECTION_TYPES.filter((t) => !present.has(t)).map((t) => ({ type: t, visible: false }))]);
        setLinks(Array.isArray(p.links) ? p.links : []);
        setDirty(false);
      })
      .catch(() => {});
  };

  // Pull fresh saved content (tracks/releases/shows...) for the preview without
  // clobbering the editor's unsaved fields.
  const refreshPreview = () => {
    apiJson<any>("/api/me/profile").then(setPreviewSource).catch(() => {});
  };

  useEffect(() => {
    if (!session) {
      navigate("/login?next=/account");
      return;
    }
    apiJson<MyComment[]>("/api/me/comments")
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
    loadProjects();
    loadProfile();
  }, [session, navigate]);

  // Warn before leaving with unsaved profile edits.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  if (!session) return null;
  const { user } = session;

  const logout = () => {
    clearSession();
    navigate("/");
  };

  const goTo = (t: Tab) => {
    setTab(t);
    refreshPreview();
  };

  // Picking a profession arranges the sections for it.
  const selectTheme = (t: ThemeId | "") => {
    setProfileTheme(t);
    setLayout(presetFor(t));
    setDirty(true);
    setProfNotice("");
  };

  const saveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setProfNotice("");
    setProfError("");
    setProfSaving(true);
    try {
      const res = await apiFetch("/api/me/profile", {
        method: "PUT",
        body: JSON.stringify({
          headline,
          bio,
          avatar_url: avatarUrl,
          is_public: isPublic,
          theme: profileTheme || null,
          genres,
          layout,
          style,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Couldn't save your changes. Try again.");
      }
      const saved = await res.json().catch(() => null);
      if (saved) setPreviewSource(saved);
      setDirty(false);
      setProfNotice("Changes saved. Your page is up to date.");
    } catch (err: any) {
      setProfError(err?.message || "Couldn't save your changes. Try again.");
    } finally {
      setProfSaving(false);
    }
  };

  const toggleSection = (idx: number) => {
    setLayout((prev) => prev.map((s, i) => (i === idx ? { ...s, visible: !s.visible } : s)));
    setDirty(true);
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    setLayout((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
    setDirty(true);
  };

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setPError("");
    if (!pTitle.trim()) {
      setPError("Give your project a title.");
      return;
    }
    setPSaving(true);
    try {
      const res = await apiFetch("/api/me/projects", {
        method: "POST",
        body: JSON.stringify({ title: pTitle, description: pDesc, status: pStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Couldn't add the project. Try again.");
      setPTitle("");
      setPDesc("");
      setPStatus("");
      loadProjects();
    } catch (err: any) {
      setPError(err?.message || "Couldn't add the project. Try again.");
    } finally {
      setPSaving(false);
    }
  };

  const deleteProject = async (id: number) => {
    if (!confirm("Delete this project? This can't be undone.")) return;
    const res = await apiFetch(`/api/me/projects/${id}`, { method: "DELETE" });
    if (res.ok) loadProjects();
  };

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLError("");
    const label = lLabel.trim();
    const href = lHref.trim();
    if (!label || !href) {
      setLError("Add both a label and a link.");
      return;
    }
    try {
      const res = await apiFetch("/api/me/links", { method: "POST", body: JSON.stringify({ label, href }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Couldn't add the link. Try again.");
      setLLabel("");
      setLHref("");
      setLinks((prev) => [...prev, data]);
    } catch (err: any) {
      setLError(err?.message || "Couldn't add the link. Try again.");
    }
  };

  const deleteLink = async (id: number) => {
    if (!confirm("Remove this link from your page?")) return;
    const res = await apiFetch(`/api/me/links/${id}`, { method: "DELETE" });
    if (res.ok) setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwNotice("");
    if (newPw.length < 8) {
      setPwError("New passwords need at least 8 characters.");
      return;
    }
    setPwSubmitting(true);
    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Couldn't change your password. Try again.");
      setCurrentPw("");
      setNewPw("");
      setPwNotice("Password updated.");
    } catch (err: any) {
      setPwError(err?.message || "Couldn't change your password. Try again.");
    } finally {
      setPwSubmitting(false);
    }
  };

  const genreList = genres.split(",").map((g) => g.trim()).filter(Boolean);

  const previewProfile: PublicProfile = {
    username: user.username,
    display_name: previewSource?.display_name || user.username,
    headline: headline || null,
    bio: bio || null,
    avatar_url: avatarUrl || null,
    theme: profileTheme || null,
    style,
    is_public: isPublic,
    layout,
    genres: genreList,
    projects,
    links,
    tracks: previewSource?.tracks || [],
    releases: previewSource?.releases || [],
    shows: previewSource?.shows || [],
    photos: previewSource?.photos || [],
    clips: previewSource?.clips || [],
    posts: previewSource?.posts || [],
  };

  // "Finish your page": the few things that make a page worth sharing.
  const contentCount =
    projects.length +
    (previewSource?.tracks?.length || 0) +
    (previewSource?.releases?.length || 0) +
    (previewSource?.shows?.length || 0) +
    (previewSource?.photos?.length || 0) +
    (previewSource?.clips?.length || 0) +
    (previewSource?.posts?.length || 0);
  const contentTab: Tab =
    profileTheme === "music" ? "music" : profileTheme === "photographer" ? "gallery" : profileTheme === "creator" ? "videos" : profileTheme === "writer" ? "posts" : "projects";
  const checklist: { done: boolean; label: string; tab: Tab }[] = [
    { done: !!avatarUrl, label: "Add a photo", tab: "profile" },
    { done: !!headline, label: "Write a headline", tab: "profile" },
    { done: !!profileTheme, label: "Pick what you do", tab: "profile" },
    { done: links.length > 0, label: "Add your first link", tab: "links" },
    { done: contentCount > 0, label: "Add your first work", tab: contentTab },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  const visibleNav = NAV.map((g) => ({
    ...g,
    items: g.items.filter((it) => !it.profession || it.profession === profileTheme),
  }));
  const pageUrl = `timezoftoday.com/u/${user.username}`;
  const { title, hint } = TAB_TITLE[tab];
  const usesProfileSave = ["profile", "appearance", "music"].includes(tab) || dirty;

  const preview = (
    <ProfileFrame theme={profileTheme || null} style={style} className="rounded-card border border-line p-5 sm:p-8">
      <ProfileView profile={previewProfile} embedded isOwner />
    </ProfileFrame>
  );

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <SiteNav />

      <div className="mx-auto grid w-full max-w-[90rem] flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[13rem_minmax(0,1fr)_minmax(0,26rem)]">
        {/* Sidebar (a horizontal tab strip on small screens) */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-5 hidden lg:block">
            <p className="text-sm text-muted">Signed in as</p>
            <p className="truncate font-semibold">@{user.username.split("@")[0]}</p>
          </div>
          <nav aria-label="Dashboard" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:overflow-visible lg:px-0">
            <div className="flex gap-1 lg:flex-col lg:gap-6">
              {visibleNav.map((g) => (
                <div key={g.group} className="flex gap-1 lg:flex-col">
                  <p className="hidden px-3 pb-1 text-xs font-semibold text-subtle lg:block">{g.group}</p>
                  {g.items.map((it) => {
                    const Icon = it.icon;
                    const active = tab === it.id;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => goTo(it.id)}
                        aria-current={active ? "page" : undefined}
                        className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-btn px-3 py-2 text-sm font-semibold transition-colors ${
                          it.mobileOnly ? "xl:hidden" : ""
                        } ${active ? "bg-text text-bg" : "text-muted hover:bg-surface-2 hover:text-text"}`}
                      >
                        <Icon size={17} aria-hidden />
                        {it.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </nav>
          <div className="mt-8 hidden space-y-1 border-t border-line pt-5 lg:block">
            <Link to={`/u/${user.username}`} className="flex items-center gap-2.5 rounded-btn px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-text">
              <ExternalLink size={17} aria-hidden />
              View your page
            </Link>
            <button type="button" onClick={logout} className="flex w-full items-center gap-2.5 rounded-btn px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-text">
              <LogOut size={17} aria-hidden />
              Log out
            </button>
          </div>
        </aside>

        {/* Editor */}
        <main id="main" className="min-w-0 pb-28">
          {/* Page address + status, always visible */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm text-muted">{isPublic ? "Your page is live at" : "Your page is private. Only you can see"}</p>
              <p className="truncate font-semibold">{pageUrl}</p>
            </div>
            <Link to={`/u/${user.username}`} className={secondaryBtn}>
              View page
            </Link>
          </div>

          {doneCount < checklist.length && (
            <Card className="mb-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-heading text-xl font-bold">Finish your page</h2>
                <span className="text-sm font-semibold text-muted">
                  {doneCount} of {checklist.length} done
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
              </div>
              <ul className="mt-4 grid gap-1 sm:grid-cols-2">
                {checklist.map((c) => (
                  <li key={c.label}>
                    <button
                      type="button"
                      onClick={() => goTo(c.tab)}
                      disabled={c.done}
                      className="flex w-full items-center gap-2.5 rounded-btn px-2 py-2 text-left text-sm font-medium hover:bg-surface-2 disabled:hover:bg-transparent"
                    >
                      {c.done ? <CheckCircle2 size={18} className="text-success" aria-hidden /> : <Circle size={18} className="text-subtle" aria-hidden />}
                      <span className={c.done ? "text-muted line-through" : ""}>{c.label}</span>
                      <span className="sr-only">{c.done ? "(done)" : "(to do)"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <h1 className="font-heading text-3xl font-black tracking-tight [font-stretch:85%] sm:text-4xl">{title}</h1>
          <p className="mb-6 mt-1 text-muted">{hint}</p>

          {/* PROFILE */}
          {tab === "profile" && (
            <form onSubmit={saveProfile} className="space-y-6">
              <Card>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Your photo" className="h-20 w-20 shrink-0 rounded-full border border-line object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm text-subtle">No photo</div>
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm font-semibold">Photo</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading} className={secondaryBtn}>
                        {avatarUploading ? "Preparing…" : avatarUrl ? "Change photo" : "Upload photo"}
                      </button>
                      {avatarUrl && (
                        <button type="button" onClick={() => edit(setAvatarUrl)("")} className="px-2 text-sm font-semibold text-muted hover:text-text">
                          Remove
                        </button>
                      )}
                    </div>
                    <input type="file" ref={avatarInputRef} onChange={handleAvatarFileChange} accept="image/*" className="hidden" />
                    {avatarError && <p role="alert" className="text-sm text-danger">{avatarError}</p>}
                  </div>
                </div>
              </Card>

              <Card className="space-y-5">
                <div>
                  <Label htmlFor="headline">Headline</Label>
                  <input id="headline" type="text" placeholder="Producer and songwriter" value={headline} onChange={(e) => edit(setHeadline)(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="bio">About you</Label>
                  <textarea id="bio" placeholder="A few sentences about you and your work." value={bio} onChange={(e) => edit(setBio)(e.target.value)} rows={5} className={inputClass} />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="status" hint="(optional)">Status</Label>
                    <input
                      id="status"
                      type="text"
                      maxLength={80}
                      placeholder="New single out Friday"
                      value={style.status ?? ""}
                      onChange={(e) => edit(setStyle)({ ...style, status: e.target.value || undefined })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location" hint="(optional)">Location</Label>
                    <input
                      id="location"
                      type="text"
                      maxLength={60}
                      placeholder="Atlanta, GA"
                      value={style.location ?? ""}
                      onChange={(e) => edit(setStyle)({ ...style, location: e.target.value || undefined })}
                      className={inputClass}
                    />
                  </div>
                </div>
              </Card>

              <Card>
                <fieldset>
                  <legend className="text-sm font-semibold">What do you do?</legend>
                  <p className="mt-1 text-sm text-muted">Sets your page's theme and the sections it starts with.</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[{ id: "" as const, label: "Something else", swatch: ["rgb(var(--c-bg))", "rgb(var(--c-surface))", "rgb(var(--c-text))"] }, ...THEMES.filter((t) => t.kind === "profession" || user.role === "admin")].map((t) => {
                      const active = profileTheme === t.id;
                      return (
                        <button
                          key={t.id || "none"}
                          type="button"
                          onClick={() => selectTheme(t.id as ThemeId | "")}
                          aria-pressed={active}
                          className={`flex flex-col gap-2 rounded-card border-2 p-2 text-left transition-colors ${active ? "border-text" : "border-line hover:border-line-strong"}`}
                        >
                          <span className="flex h-12 overflow-hidden rounded-[0.5rem] border border-line" aria-hidden>
                            <span className="flex-[3]" style={{ background: t.swatch[0] }} />
                            <span className="flex-[2]" style={{ background: t.swatch[1] }} />
                            <span className="flex-1" style={{ background: t.swatch[2] }} />
                          </span>
                          <span className="px-1 text-sm font-semibold">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </Card>

              <Card>
                <p className="text-sm font-semibold">Sections</p>
                <p className="mt-1 text-sm text-muted">Choose what shows on your page and in what order. Empty sections stay hidden until you add something.</p>
                <ul className="mt-4 space-y-2">
                  {layout.map((s, i) => (
                    <li key={s.type} className="flex items-center gap-3 rounded-btn border border-line px-3 py-2">
                      <input
                        id={`sec-${s.type}`}
                        type="checkbox"
                        checked={s.visible}
                        onChange={() => toggleSection(i)}
                        className="h-4 w-4 accent-[rgb(var(--c-accent-fill))]"
                      />
                      <label htmlFor={`sec-${s.type}`} className="flex-1 text-sm font-medium">
                        {SECTION_LABELS[s.type] || s.type}
                      </label>
                      <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0} aria-label={`Move ${SECTION_LABELS[s.type]} up`} className="rounded p-1.5 text-muted hover:bg-surface-2 hover:text-text disabled:opacity-30">
                        <ArrowUp size={16} aria-hidden />
                      </button>
                      <button type="button" onClick={() => moveSection(i, 1)} disabled={i === layout.length - 1} aria-label={`Move ${SECTION_LABELS[s.type]} down`} className="rounded p-1.5 text-muted hover:bg-surface-2 hover:text-text disabled:opacity-30">
                        <ArrowDown size={16} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={isPublic} onChange={(e) => edit(setIsPublic)(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[rgb(var(--c-accent-fill))]" />
                  <span>
                    <span className="block text-sm font-semibold">Public page</span>
                    <span className="block text-sm text-muted">Anyone with your link can see it, and it can appear on Discover. Turn off to keep it private.</span>
                  </span>
                </label>
              </Card>
            </form>
          )}

          {/* APPEARANCE */}
          {tab === "appearance" && (
            <Card>
              <AppearanceEditor style={style} onChange={edit(setStyle)} />
            </Card>
          )}

          {/* LINKS */}
          {tab === "links" && (
            <Card>
              {links.length > 0 ? (
                <ul className="mb-6 space-y-2">
                  {links.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 rounded-btn border border-line p-3">
                      <div className="min-w-0">
                        <span className="block text-sm font-semibold">{l.label}</span>
                        <span className="block truncate text-sm text-subtle">{l.href}</span>
                      </div>
                      <button type="button" onClick={() => deleteLink(l.id)} className="shrink-0 text-sm font-semibold text-danger hover:underline">
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-5 text-muted">No links yet. Add your Instagram, Spotify, store or anywhere people should find you.</p>
              )}
              <form onSubmit={addLink} className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
                <div>
                  <Label htmlFor="link-href">Link</Label>
                  <input id="link-href" type="url" inputMode="url" placeholder="https://instagram.com/you" value={lHref} onChange={(e) => setLHref(e.target.value)} onBlur={handleLinkHrefBlur} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="link-label">Button text</Label>
                  <input id="link-label" type="text" placeholder={lFetchingLabel ? "Getting title…" : "Instagram"} value={lLabel} onChange={(e) => setLLabel(e.target.value)} className={inputClass} />
                </div>
                <button type="submit" className={primaryBtn}>
                  Add link
                </button>
              </form>
              {lError && <p role="alert" className="mt-2 text-sm text-danger">{lError}</p>}
            </Card>
          )}

          {/* MUSIC */}
          {tab === "music" && (
            <Card>
              <div className="mb-6">
                <Label htmlFor="genres" hint="(separate with commas)">Genres</Label>
                <input id="genres" type="text" placeholder="Hip-hop, R&B, Soul" value={genres} onChange={(e) => edit(setGenres)(e.target.value)} className={inputClass} />
              </div>
              <MusicManager onChange={refreshPreview} />
            </Card>
          )}

          {tab === "gallery" && (
            <Card>
              <GalleryManager onChange={refreshPreview} />
            </Card>
          )}
          {tab === "videos" && (
            <Card>
              <ClipManager onChange={refreshPreview} />
            </Card>
          )}
          {tab === "posts" && (
            <Card>
              <PostManager onChange={refreshPreview} />
            </Card>
          )}

          {/* PROJECTS */}
          {tab === "projects" && (
            <Card>
              {projects.length > 0 && (
                <ul className="mb-6 space-y-3">
                  {projects.map((p) => (
                    <li key={p.id} className="flex items-start justify-between gap-4 rounded-btn border border-line p-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold">{p.title}</h3>
                        {p.description && <p className="mt-1 text-sm text-muted">{p.description}</p>}
                        {p.status && <span className="mt-2 inline-block rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">{p.status}</span>}
                      </div>
                      <button type="button" onClick={() => deleteProject(p.id)} className="shrink-0 text-sm font-semibold text-danger hover:underline">
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={addProject} className="space-y-4">
                <div>
                  <Label htmlFor="p-title">Project title</Label>
                  <input id="p-title" type="text" value={pTitle} onChange={(e) => setPTitle(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="p-desc" hint="(optional)">Description</Label>
                  <textarea id="p-desc" value={pDesc} onChange={(e) => setPDesc(e.target.value)} rows={2} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="p-status" hint="(optional)">Status</Label>
                  <input id="p-status" type="text" placeholder="In progress" value={pStatus} onChange={(e) => setPStatus(e.target.value)} className={inputClass} />
                </div>
                {pError && <p role="alert" className="text-sm text-danger">{pError}</p>}
                <button type="submit" disabled={pSaving} className={primaryBtn}>
                  {pSaving ? "Adding…" : "Add project"}
                </button>
              </form>
            </Card>
          )}

          {/* PREVIEW (small screens; large screens show it alongside) */}
          {tab === "preview" && <div className="xl:hidden">{preview}</div>}

          {/* SETTINGS */}
          {tab === "settings" && (
            <div className="space-y-6">
              <Card>
                <h2 className="font-heading text-lg font-bold">Account</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex gap-3">
                    <dt className="w-24 text-muted">Username</dt>
                    <dd>{user.username}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-24 text-muted">Email</dt>
                    <dd>{user.email || "Not set"}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-24 text-muted">Role</dt>
                    <dd className="capitalize">{user.role}</dd>
                  </div>
                </dl>
                {user.role === "admin" && (
                  <Link to="/admin" className="mt-4 inline-block text-sm font-semibold underline decoration-highlight decoration-2 underline-offset-4">
                    Open the admin panel
                  </Link>
                )}
              </Card>

              <Card>
                <h2 className="font-heading text-lg font-bold">Change password</h2>
                <form onSubmit={changePassword} className="mt-4 max-w-sm space-y-4">
                  <div>
                    <Label htmlFor="cur-pw">Current password</Label>
                    <input id="cur-pw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className={inputClass} autoComplete="current-password" />
                  </div>
                  <div>
                    <Label htmlFor="new-pw" hint="(at least 8 characters)">New password</Label>
                    <input id="new-pw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={inputClass} autoComplete="new-password" />
                  </div>
                  {pwError && <p role="alert" className="text-sm text-danger">{pwError}</p>}
                  {pwNotice && <p role="status" className="text-sm text-success">{pwNotice}</p>}
                  <button type="submit" disabled={pwSubmitting || !currentPw || !newPw} className={primaryBtn}>
                    {pwSubmitting ? "Updating…" : "Update password"}
                  </button>
                </form>
              </Card>

              <Card>
                <h2 className="font-heading text-lg font-bold">Your comments</h2>
                {loading ? (
                  <p className="mt-3 text-muted">Loading…</p>
                ) : comments.length === 0 ? (
                  <p className="mt-3 text-muted">You haven't commented on any stories yet.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {comments.map((c) => (
                      <li key={c.id} className="rounded-btn border border-line p-4">
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                          <Link to={`/writing/${c.writing_slug}`} className="truncate text-sm font-semibold underline decoration-highlight decoration-2 underline-offset-4">
                            {c.writing_slug}
                          </Link>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.status === "approved" ? "bg-success/15 text-success" : "bg-surface-2 text-muted"}`}>
                            {c.status === "approved" ? "Published" : "Waiting for review"}
                          </span>
                        </div>
                        {c.created_at && <p className="mb-1 text-xs text-subtle">{formatDate(c.created_at)}</p>}
                        <p className="whitespace-pre-wrap text-sm">{c.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <button type="button" onClick={logout} className={`${secondaryBtn} lg:hidden`}>
                Log out
              </button>
            </div>
          )}
        </main>

        {/* Live preview, alongside the editor on wide screens */}
        <aside aria-label="Live preview" className="hidden xl:block">
          <div className="sticky top-20">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Live preview</p>
              <button type="button" onClick={refreshPreview} className="text-sm font-semibold text-muted hover:text-text">
                Refresh
              </button>
            </div>
            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-card">{preview}</div>
          </div>
        </aside>
      </div>

      {/* Save bar: appears when profile or appearance edits are unsaved. */}
      {(dirty || profNotice || profError) && usesProfileSave && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p role="status" aria-live="polite" className={`text-sm font-medium ${profError ? "text-danger" : dirty ? "text-text" : "text-success"}`}>
              {profError || (dirty ? "You have unsaved changes." : profNotice)}
            </p>
            {dirty && (
              <div className="flex gap-2">
                <button type="button" onClick={loadProfile} className={secondaryBtn}>
                  Discard
                </button>
                <button type="button" onClick={() => saveProfile()} disabled={profSaving} className={primaryBtn}>
                  {profSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
