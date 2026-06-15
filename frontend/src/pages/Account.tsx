import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageNav from "../components/PageNav";
import { apiJson, apiFetch } from "../lib/api";
import { useAuth, clearSession } from "../lib/auth";

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
          <button onClick={logout} className="text-sm text-muted hover:text-text transition-colors">
            Log out
          </button>
        </div>

        {/* Profile card */}
        <div className="border border-line bg-surface rounded-card p-6 mb-10 shadow-card">
          <h2 className="text-lg font-semibold text-text mb-4">Profile</h2>
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

        {/* My projects */}
        <div className="border border-line bg-surface rounded-card p-6 mb-10 shadow-card">
          <h2 className="text-lg font-semibold text-text mb-4">My Projects</h2>
          <p className="text-muted text-sm mb-4">These show in the Projects section of the homepage when you're logged in.</p>

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
