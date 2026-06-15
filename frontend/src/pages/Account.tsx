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

export default function Account() {
  const session = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<MyComment[]>([]);
  const [loading, setLoading] = useState(true);

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
