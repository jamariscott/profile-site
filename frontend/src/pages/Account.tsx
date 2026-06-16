import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageNav from "../components/PageNav";
import { apiJson, apiFetch } from "../lib/api";
import { useAuth, clearSession } from "../lib/auth";
import { THEMES, type ThemeId } from "../lib/themes";
import MusicManager from "../components/MusicManager";

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

interface LayoutSection {
  type: string;
  visible: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  about: "About",
  projects: "Projects",
  links: "Links",
  tracks: "Tracks",
  releases: "Releases",
  shows: "Shows",
};

const ALL_SECTION_TYPES = ["about", "projects", "links", "tracks", "releases", "shows"];

// A music profile preset: which sections are on and their order.
const MUSIC_LAYOUT = [
  { type: "about", visible: true },
  { type: "tracks", visible: true },
  { type: "releases", visible: true },
  { type: "shows", visible: true },
  { type: "links", visible: true },
  { type: "projects", visible: false },
];

export default function Account() {
  const session = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<MyComment[]>([]);
  const [loading, setLoading] = useState(true);

  // projects
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [pTitle, setPTitle] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pStatus, setPStatus] = useState("");
  const [pError, setPError] = useState("");
  const [pSaving, setPSaving] = useState(false);

  const loadProjects = () => {
    apiJson<MyProject[]>("/api/me/projects").then(setProjects).catch(() => {});
  };

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setPError("");
    if (!pTitle.trim()) {
      setPError("Title is required.");
      return;
    }
    setPSaving(true);
    try {
      const res = await apiFetch("/api/me/projects", {
        method: "POST",
        body: JSON.stringify({ title: pTitle, description: pDesc, status: pStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not add project");
      setPTitle("");
      setPDesc("");
      setPStatus("");
      loadProjects();
    } catch (err: any) {
      setPError(err?.message || "Could not add project");
    } finally {
      setPSaving(false);
    }
  };

  const deleteProject = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    try {
      const res = await apiFetch(`/api/me/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      loadProjects();
    } catch (err: any) {
      alert(err?.message || "Failed to delete");
    }
  };

  // public profile editor
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [profileTheme, setProfileTheme] = useState<ThemeId | "">("");
  const [genres, setGenres] = useState("");
  const [layout, setLayout] = useState<LayoutSection[]>([]);
  const [profSaving, setProfSaving] = useState(false);
  const [profNotice, setProfNotice] = useState("");

  // links
  const [links, setLinks] = useState<MyLink[]>([]);
  const [lLabel, setLLabel] = useState("");
  const [lHref, setLHref] = useState("");
  const [lError, setLError] = useState("");

  const loadProfile = () => {
    apiJson<any>("/api/me/profile")
      .then((p) => {
        setHeadline(p.headline || "");
        setBio(p.bio || "");
        setAvatarUrl(p.avatar_url || "");
        setIsPublic(p.is_public !== false);
        setProfileTheme(p.theme || "");
        setGenres(Array.isArray(p.genres) ? p.genres.join(", ") : "");
        // Merge any known sections missing from the saved layout (as hidden) so
        // every section type is toggleable in the editor.
        const base: LayoutSection[] = Array.isArray(p.layout) ? p.layout : [];
        const present = new Set(base.map((s) => s.type));
        const merged = [
          ...base,
          ...ALL_SECTION_TYPES.filter((t) => !present.has(t)).map((t) => ({ type: t, visible: false })),
        ];
        setLayout(merged);
        setLinks(Array.isArray(p.links) ? p.links : []);
      })
      .catch(() => {});
  };

  const setupMusic = async () => {
    setProfNotice("");
    setProfSaving(true);
    try {
      const res = await apiFetch("/api/me/profile", {
        method: "PUT",
        body: JSON.stringify({ theme: "music", layout: MUSIC_LAYOUT }),
      });
      if (!res.ok) throw new Error("Could not set up music profile");
      loadProfile();
      setProfNotice("Music profile set up — add tracks, releases and shows below.");
    } catch (err: any) {
      setProfNotice(err?.message || "Could not set up music profile");
    } finally {
      setProfSaving(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfNotice("");
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
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Could not save profile");
      }
      setProfNotice("Profile saved.");
    } catch (err: any) {
      setProfNotice(err?.message || "Could not save profile");
    } finally {
      setProfSaving(false);
    }
  };

  const toggleSection = (idx: number) => {
    setLayout((prev) => prev.map((s, i) => (i === idx ? { ...s, visible: !s.visible } : s)));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    setLayout((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLError("");
    if (!lLabel.trim() || !lHref.trim()) {
      setLError("Label and URL are required.");
      return;
    }
    try {
      const res = await apiFetch("/api/me/links", {
        method: "POST",
        body: JSON.stringify({ label: lLabel, href: lHref }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not add link");
      setLLabel("");
      setLHref("");
      setLinks((prev) => [...prev, data]);
    } catch (err: any) {
      setLError(err?.message || "Could not add link");
    }
  };

  const deleteLink = async (id: number) => {
    try {
      const res = await apiFetch(`/api/me/links/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      alert(err?.message || "Failed to delete");
    }
  };

  // change-password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwNotice, setPwNotice] = useState("");
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwNotice("");
    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    setPwSubmitting(true);
    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not change password");
      setCurrentPw("");
      setNewPw("");
      setPwNotice("Password updated.");
    } catch (err: any) {
      setPwError(err?.message || "Could not change password");
    } finally {
      setPwSubmitting(false);
    }
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

  if (!session) return null;
  const { user } = session;

  const logout = () => {
    clearSession();
    navigate("/");
  };

  return (
    <div className="bg-bg min-h-screen">
      <PageNav />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-4xl font-bold text-text">My Account</h1>
            <p className="text-muted mt-1">Welcome back, {user.username}.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link to={`/u/${user.username}`} className="text-sm text-accent hover:text-accent-hover font-medium">
              View my public profile →
            </Link>
            <button onClick={logout} className="text-sm text-muted hover:text-text transition-colors">
              Log out
            </button>
          </div>
        </div>

        {/* Account card */}
        <div className="border border-line bg-surface rounded-card p-6 mb-10 shadow-card">
          <h2 className="text-lg font-semibold text-text mb-4">Account</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-3">
              <dt className="text-muted w-24">Username</dt>
              <dd className="text-text">{user.username}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-muted w-24">Email</dt>
              <dd className="text-text">{user.email || "—"}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-muted w-24">Role</dt>
              <dd className="text-text capitalize">{user.role}</dd>
            </div>
          </dl>
          {user.role === "admin" && (
            <Link
              to="/admin"
              className="inline-block mt-4 text-sm text-accent hover:text-accent-hover font-medium"
            >
              Go to Admin Panel →
            </Link>
          )}
        </div>

        {/* Public profile editor */}
        <div className="border border-line bg-surface rounded-card p-6 mb-10 shadow-card">
          <h2 className="text-lg font-semibold text-text mb-4">Public Profile</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1">Headline</label>
              <input
                type="text"
                placeholder="e.g. Producer & songwriter"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="border border-line bg-surface text-text p-3 w-full rounded-btn"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Bio</label>
              <textarea
                placeholder="A few sentences about you…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="border border-line bg-surface text-text p-3 w-full rounded-btn"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Avatar image URL</label>
              <input
                type="url"
                placeholder="https://…"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="border border-line bg-surface text-text p-3 w-full rounded-btn"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Genres <span className="text-subtle font-normal">(comma-separated, shown on music profiles)</span></label>
              <input
                type="text"
                placeholder="e.g. Hip-hop, R&B, Soul"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                className="border border-line bg-surface text-text p-3 w-full rounded-btn"
              />
            </div>

            {/* Theme picker */}
            <div>
              <label className="block text-sm text-muted mb-2">Profile theme</label>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setProfileTheme(t.id)}
                    className={`px-3 py-1.5 rounded-btn border text-sm ${
                      profileTheme === t.id ? "border-accent bg-surface-2 text-text" : "border-line text-muted hover:bg-surface-2"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setProfileTheme("")}
                  className={`px-3 py-1.5 rounded-btn border text-sm ${
                    profileTheme === "" ? "border-accent bg-surface-2 text-text" : "border-line text-muted hover:bg-surface-2"
                  }`}
                >
                  Site default
                </button>
              </div>
            </div>

            {/* Sections (toggle + reorder) */}
            <div>
              <label className="block text-sm text-muted mb-2">Sections (show/hide and reorder)</label>
              <div className="space-y-2">
                {layout.map((s, i) => (
                  <div key={s.type} className="flex items-center gap-3 border border-line rounded-btn p-2.5">
                    <input type="checkbox" checked={s.visible} onChange={() => toggleSection(i)} className="w-4 h-4" />
                    <span className="text-text text-sm flex-1">{SECTION_LABELS[s.type] || s.type}</span>
                    <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0} className="text-muted hover:text-text disabled:opacity-30 px-1">↑</button>
                    <button type="button" onClick={() => moveSection(i, 1)} disabled={i === layout.length - 1} className="text-muted hover:text-text disabled:opacity-30 px-1">↓</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Public toggle */}
            <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-4 h-4" />
              Make my profile public (anyone with the link can view it)
            </label>

            {profNotice && <p className="text-success text-sm">{profNotice}</p>}
            <button
              type="submit"
              disabled={profSaving}
              className="bg-accent text-accent-contrast px-6 py-2.5 rounded-btn font-medium disabled:opacity-50"
            >
              {profSaving ? "Saving…" : "Save profile"}
            </button>
          </form>
        </div>

        {/* Music */}
        <div className="border border-line bg-surface rounded-card p-6 mb-10 shadow-card">
          <div className="flex items-center justify-between mb-2 gap-4">
            <h2 className="text-lg font-semibold text-text">Music</h2>
            <button
              type="button"
              onClick={setupMusic}
              disabled={profSaving}
              className="text-sm bg-accent text-accent-contrast px-4 py-2 rounded-btn font-medium disabled:opacity-50 whitespace-nowrap"
            >
              ♪ Set up music profile
            </button>
          </div>
          <p className="text-muted text-sm mb-6">
            One click arranges your profile for music (tracks, releases, shows) and applies the Music theme. You can rearrange anything afterward in the section list above.
          </p>
          <MusicManager />
        </div>

        {/* Links */}
        <div className="border border-line bg-surface rounded-card p-6 mb-10 shadow-card">
          <h2 className="text-lg font-semibold text-text mb-4">Links</h2>
          {links.length > 0 && (
            <div className="space-y-2 mb-4">
              {links.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 border border-line rounded-btn p-3">
                  <div className="min-w-0">
                    <span className="text-text text-sm font-medium">{l.label}</span>
                    <span className="text-subtle text-xs block truncate">{l.href}</span>
                  </div>
                  <button onClick={() => deleteLink(l.id)} className="text-danger hover:opacity-80 text-sm shrink-0">Delete</button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={addLink} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Label (e.g. Instagram)"
              value={lLabel}
              onChange={(e) => setLLabel(e.target.value)}
              className="border border-line bg-surface text-text p-3 rounded-btn sm:w-44"
            />
            <input
              type="url"
              placeholder="https://…"
              value={lHref}
              onChange={(e) => setLHref(e.target.value)}
              className="border border-line bg-surface text-text p-3 rounded-btn flex-1"
            />
            <button type="submit" className="bg-accent text-accent-contrast px-5 py-2.5 rounded-btn font-medium whitespace-nowrap">
              Add link
            </button>
          </form>
          {lError && <p className="text-danger text-sm mt-2">{lError}</p>}
        </div>

        {/* My projects */}
        <div className="border border-line bg-surface rounded-card p-6 mb-10 shadow-card">
          <h2 className="text-lg font-semibold text-text mb-4">My Projects</h2>
          <p className="text-muted text-sm mb-4">These show in the Projects section of your public profile.</p>

          {projects.length > 0 && (
            <div className="space-y-3 mb-6">
              {projects.map((p) => (
                <div key={p.id} className="border border-line rounded-btn p-4 flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h3 className="text-text font-semibold">{p.title}</h3>
                    {p.description && <p className="text-muted text-sm mt-1">{p.description}</p>}
                    {p.status && (
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-surface-2 text-muted rounded-full">
                        {p.status}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteProject(p.id)}
                    className="text-danger hover:opacity-80 text-sm shrink-0"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={addProject} className="space-y-3">
            <input
              type="text"
              placeholder="Project title"
              value={pTitle}
              onChange={(e) => setPTitle(e.target.value)}
              className="border border-line bg-surface text-text p-3 w-full rounded-btn"
            />
            <textarea
              placeholder="Description (optional)"
              value={pDesc}
              onChange={(e) => setPDesc(e.target.value)}
              rows={2}
              className="border border-line bg-surface text-text p-3 w-full rounded-btn"
            />
            <input
              type="text"
              placeholder="Status (optional, e.g. 'In progress')"
              value={pStatus}
              onChange={(e) => setPStatus(e.target.value)}
              className="border border-line bg-surface text-text p-3 w-full rounded-btn"
            />
            {pError && <p className="text-danger text-sm">{pError}</p>}
            <button
              type="submit"
              disabled={pSaving || !pTitle.trim()}
              className="bg-accent text-accent-contrast px-6 py-2.5 rounded-btn font-medium disabled:opacity-50"
            >
              {pSaving ? "Adding…" : "Add project"}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="border border-line bg-surface rounded-card p-6 mb-10 shadow-card">
          <h2 className="text-lg font-semibold text-text mb-4">Change Password</h2>
          <form onSubmit={changePassword} className="space-y-3 max-w-sm">
            <input
              type="password"
              placeholder="Current password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="border border-line bg-surface text-text p-3 w-full rounded-btn"
              autoComplete="current-password"
            />
            <input
              type="password"
              placeholder="New password (min 8 characters)"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="border border-line bg-surface text-text p-3 w-full rounded-btn"
              autoComplete="new-password"
            />
            {pwError && <p className="text-danger text-sm">{pwError}</p>}
            {pwNotice && <p className="text-success text-sm">{pwNotice}</p>}
            <button
              type="submit"
              disabled={pwSubmitting || !currentPw || !newPw}
              className="bg-accent text-accent-contrast px-6 py-2.5 rounded-btn font-medium disabled:opacity-50"
            >
              {pwSubmitting ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>

        {/* My comments */}
        <h2 className="text-lg font-semibold text-text mb-4">My Comments</h2>
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="text-muted">You haven't posted any comments yet.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="border border-line bg-surface rounded-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <Link
                    to={`/writing/${c.writing_slug}`}
                    className="text-sm text-accent hover:text-accent-hover font-medium truncate"
                  >
                    {c.writing_slug}
                  </Link>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      c.status === "approved"
                        ? "text-success border border-success/40"
                        : "text-muted border border-line"
                    }`}
                  >
                    {c.status === "approved" ? "Published" : "Pending review"}
                  </span>
                </div>
                <p className="text-text text-sm whitespace-pre-wrap">{c.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
