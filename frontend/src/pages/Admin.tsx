import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FileText, ImagePlus, LogOut, MessageSquare, Users as UsersIcon } from "lucide-react";
import RichTextEditor from "../components/RichTextEditor";
import SiteNav from "../components/SiteNav";
import { apiFetch, apiJson } from "../lib/api";
import { useAuth, clearSession } from "../lib/auth";
import { formatDate } from "../lib/format";
import { useToast } from "../components/ToastProvider";
import { EditorSection, FieldLabel, inputClass, primaryBtn, removeBtn, secondaryBtn } from "../components/ui";

interface WritingPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  x_posted: boolean;
}

interface PendingComment {
  id: number;
  body: string;
  author: string;
  writing_slug: string;
  status: string;
  created_at: string | null;
}

interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  role: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

type AdminTab = "articles" | "comments" | "users";

const EMPTY_POST = { title: "", summary: "", content: "", postToX: false, sponsorLogo: "" };

export default function Admin() {
  const session = useAuth();
  const isAdmin = session?.user.role === "admin";
  const toast = useToast();

  const [tab, setTab] = useState<AdminTab>("articles");
  const [posts, setPosts] = useState<WritingPost[]>([]);
  const [comments, setComments] = useState<PendingComment[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [resetFor, setResetFor] = useState<number | null>(null);
  const [resetPw, setResetPw] = useState("");

  const [newPost, setNewPost] = useState(EMPTY_POST);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setNewPost((p) => ({ ...p, sponsorLogo: reader.result as string }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // === DATA LOADERS ===
  const loadPosts = async () => {
    try {
      setPosts(await apiJson<WritingPost[]>("/api/admin/writing"));
      setLoadError("");
    } catch (err: any) {
      setLoadError(err.message || "Couldn't load articles.");
    }
  };
  const loadComments = async () => {
    try {
      setComments(await apiJson<PendingComment[]>("/api/admin/comments?status=pending"));
    } catch {
      /* shown as empty */
    }
  };
  const loadUsers = async () => {
    try {
      setUsers(await apiJson<AdminUser[]>("/api/admin/users"));
    } catch {
      /* shown as empty */
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadPosts();
      loadComments();
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // === ARTICLES ===
  const createPost = async () => {
    if (!newPost.title || !newPost.content) {
      toast.error("Add a title and some content before publishing.");
      return;
    }
    setPublishing(true);
    try {
      const res = await apiFetch("/api/admin/writing", { method: "POST", body: JSON.stringify(newPost) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Couldn't publish the article.");
      if (data.x_error) toast.error(`Article published, but posting to X failed:\n${data.x_error}`);
      else if (data.x) toast.success(`Article published and posted to X.\n${data.x.tweet_url}`);
      else toast.success("Article published.");
      setNewPost(EMPTY_POST);
      loadPosts();
    } catch (err: any) {
      toast.error(err.message || "Couldn't publish the article.");
    } finally {
      setPublishing(false);
    }
  };

  const publishToX = async (slug: string) => {
    if (!confirm("Post this article to X now?")) return;
    try {
      const res = await apiFetch(`/api/admin/publish-to-x/${slug}`, { method: "POST" });
      if (!res.ok) throw new Error("Couldn't post to X.");
      toast.success("Posted to X.");
      loadPosts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deletePost = async (slug: string, title: string) => {
    if (!confirm(`Delete "${title}" permanently? This can't be undone.`)) return;
    const res = await apiFetch(`/api/admin/writing/${slug}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) {
      toast.success("Article deleted.");
      loadPosts();
    } else {
      toast.error("Couldn't delete the article.");
    }
  };

  // === COMMENT MODERATION ===
  const approveComment = async (id: number) => {
    const res = await apiFetch(`/api/admin/comments/${id}/approve`, { method: "PUT" }).catch(() => null);
    if (res?.ok) {
      toast.success("Comment approved.");
      loadComments();
    } else toast.error("Couldn't approve the comment.");
  };

  const deleteComment = async (id: number) => {
    if (!confirm("Delete this comment?")) return;
    const res = await apiFetch(`/api/admin/comments/${id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) loadComments();
    else toast.error("Couldn't delete the comment.");
  };

  // === USER MANAGEMENT ===
  const toggleRole = async (u: AdminUser) => {
    const nextRole = u.role === "admin" ? "member" : "admin";
    if (!confirm(`${nextRole === "admin" ? "Make" : "Remove"} ${u.username} ${nextRole === "admin" ? "an admin" : "as admin"}?`)) return;
    const res = await apiFetch(`/api/admin/users/${u.id}/role`, { method: "PUT", body: JSON.stringify({ role: nextRole }) }).catch(() => null);
    if (res?.ok) loadUsers();
    else toast.error("Couldn't change the role.");
  };

  const resetUserPassword = async (u: AdminUser) => {
    if (resetPw.length < 8) {
      toast.error("New passwords need at least 8 characters.");
      return;
    }
    const res = await apiFetch(`/api/admin/users/${u.id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ new_password: resetPw }),
    }).catch(() => null);
    if (res?.ok) {
      toast.success(`Password reset for ${u.username}.`);
      setResetFor(null);
      setResetPw("");
    } else toast.error("Couldn't reset the password.");
  };

  if (!session) return <Navigate to="/login?next=/admin" replace />;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-bg text-text">
        <SiteNav />
        <main id="main" className="mx-auto w-full max-w-xl flex-1 px-4 py-20 sm:px-6">
          <h1 className="font-heading text-4xl font-black tracking-tight [font-stretch:80%]">Admins only</h1>
          <p className="mt-3 text-lg text-muted">
            You're signed in as <strong className="text-text">{session.user.username}</strong>, and this area is for site admins.
          </p>
          <Link to="/account" className={`${primaryBtn} mt-6 inline-flex`}>
            Go to your dashboard
          </Link>
        </main>
      </div>
    );
  }

  const q = userSearch.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    if (!q) return true;
    const name = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
    return u.username.toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || name.includes(q);
  });

  const nav: { id: AdminTab; label: string; icon: typeof FileText; count?: number }[] = [
    { id: "articles", label: "Articles", icon: FileText },
    { id: "comments", label: "Comments", icon: MessageSquare, count: comments.length },
    { id: "users", label: "Users", icon: UsersIcon },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <SiteNav />
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-4 hidden text-sm font-semibold text-subtle lg:block">Site admin</p>
          <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0">
            <div className="flex gap-1 lg:flex-col">
              {nav.map((it) => {
                const Icon = it.icon;
                const active = tab === it.id;
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setTab(it.id)}
                    aria-current={active ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-btn px-3 py-2 text-sm font-semibold transition-colors ${
                      active ? "bg-text text-bg" : "text-muted hover:bg-surface-2 hover:text-text"
                    }`}
                  >
                    <Icon size={17} aria-hidden />
                    {it.label}
                    {!!it.count && (
                      <span className="ml-auto rounded-full bg-highlight px-2 text-xs font-bold text-on-highlight">
                        {it.count}
                        <span className="sr-only"> waiting</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
          <button
            type="button"
            onClick={clearSession}
            className="mt-8 hidden w-full items-center gap-2.5 rounded-btn border-t border-line px-3 pb-2 pt-5 text-sm font-semibold text-muted hover:text-text lg:flex"
          >
            <LogOut size={17} aria-hidden />
            Log out
          </button>
        </aside>

        <main id="main" className="min-w-0 pb-16">
          {loadError && (
            <p role="alert" className="mb-6 rounded-btn border border-danger/40 px-4 py-3 text-sm text-danger">
              {loadError}
            </p>
          )}

          {tab === "articles" && (
            <>
              <h1 className="font-heading text-3xl font-black tracking-tight [font-stretch:85%] sm:text-4xl">Articles</h1>
              <p className="mb-6 mt-1 text-muted">Stories on the site's Writing page.</p>

              <div className="space-y-8 rounded-card border border-line bg-surface p-5 sm:p-6">
                <EditorSection title="Write a new article">
                  <div className="space-y-5">
                    <div>
                      <FieldLabel htmlFor="a-title">Title</FieldLabel>
                      <input id="a-title" type="text" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} className={`${inputClass} text-lg font-semibold`} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="a-summary" hint="(shown under the title)">Summary</FieldLabel>
                      <input id="a-summary" type="text" value={newPost.summary} onChange={(e) => setNewPost({ ...newPost, summary: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="a-sponsor" hint="(optional: marks the story as sponsored, with a hero image and a sponsor note)">Sponsor image</FieldLabel>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          id="a-sponsor"
                          type="url"
                          placeholder="Paste an image link"
                          value={newPost.sponsorLogo.startsWith("data:") ? "" : newPost.sponsorLogo}
                          onChange={(e) => setNewPost({ ...newPost, sponsorLogo: e.target.value.trim() })}
                          className={`${inputClass} flex-1`}
                        />
                        <button type="button" onClick={() => coverImageInputRef.current?.click()} className={`${secondaryBtn} inline-flex items-center justify-center gap-2`}>
                          <ImagePlus size={16} aria-hidden />
                          Upload image
                        </button>
                        <input ref={coverImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
                      </div>
                      {newPost.sponsorLogo && (
                        <div className="mt-3">
                          <div className="h-48 overflow-hidden rounded-card border border-line">
                            <img src={newPost.sponsorLogo} alt="Sponsor image preview" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                          </div>
                          <button type="button" onClick={() => setNewPost({ ...newPost, sponsorLogo: "" })} className={`${removeBtn} mt-2`}>
                            Remove image
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <FieldLabel>Content</FieldLabel>
                      <div className="rounded-btn border-2 border-line-strong bg-surface p-3 focus-within:border-text">
                        <RichTextEditor value={newPost.content} onChange={(content) => setNewPost({ ...newPost, content })} placeholder="Start writing…" />
                      </div>
                    </div>
                    <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
                      <input type="checkbox" checked={newPost.postToX} onChange={(e) => setNewPost({ ...newPost, postToX: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--c-accent-fill))]" />
                      Also post to X
                    </label>
                    <button type="button" onClick={createPost} disabled={publishing} className={`${primaryBtn} w-full py-3.5`}>
                      {publishing ? "Publishing…" : "Publish article"}
                    </button>
                  </div>
                </EditorSection>
              </div>

              <div className="mb-4 mt-10 flex items-baseline justify-between gap-4">
                <h2 className="font-heading text-2xl font-bold">Published</h2>
                <button type="button" onClick={loadPosts} className="text-sm font-semibold text-muted hover:text-text">
                  Refresh
                </button>
              </div>
              {posts.length === 0 ? (
                <p className="text-muted">Nothing published yet.</p>
              ) : (
                <ul className="divide-y divide-line border-y border-line">
                  {posts.map((post) => (
                    <li key={post.slug} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
                      <div className="min-w-0">
                        <Link to={`/writing/${post.slug}`} className="font-semibold hover:underline">
                          {post.title}
                        </Link>
                        <p className="text-sm text-subtle">{formatDate(post.date)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {post.x_posted ? (
                          <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">Posted to X</span>
                        ) : (
                          <button type="button" onClick={() => publishToX(post.slug)} className="text-sm font-semibold underline decoration-highlight decoration-2 underline-offset-4">
                            Post to X
                          </button>
                        )}
                        <button type="button" onClick={() => deletePost(post.slug, post.title)} className={removeBtn}>
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tab === "comments" && (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <h1 className="font-heading text-3xl font-black tracking-tight [font-stretch:85%] sm:text-4xl">Comments</h1>
                <button type="button" onClick={loadComments} className="text-sm font-semibold text-muted hover:text-text">
                  Refresh
                </button>
              </div>
              <p className="mb-6 mt-1 text-muted">Comments waiting for review. Approved comments appear under their story.</p>
              {comments.length === 0 ? (
                <p className="rounded-card border border-dashed border-line-strong p-6 text-muted">Nothing waiting for review.</p>
              ) : (
                <ul className="space-y-3">
                  {comments.map((c) => (
                    <li key={c.id} className="rounded-card border border-line bg-surface p-4">
                      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                        <span className="font-semibold">{c.author}</span>
                        <span className="text-subtle">
                          on{" "}
                          <Link to={`/writing/${c.writing_slug}`} className="underline underline-offset-2">
                            {c.writing_slug}
                          </Link>
                          {c.created_at && `, ${formatDate(c.created_at)}`}
                        </span>
                      </div>
                      <p className="mb-4 whitespace-pre-wrap">{c.body}</p>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => approveComment(c.id)} className={primaryBtn}>
                          Approve
                        </button>
                        <button type="button" onClick={() => deleteComment(c.id)} className={secondaryBtn}>
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tab === "users" && (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <h1 className="font-heading text-3xl font-black tracking-tight [font-stretch:85%] sm:text-4xl">Users</h1>
                <button type="button" onClick={loadUsers} className="text-sm font-semibold text-muted hover:text-text">
                  Refresh
                </button>
              </div>
              <p className="mb-6 mt-1 text-muted">{users.length} {users.length === 1 ? "account" : "accounts"}</p>
              <label className="mb-4 block">
                <span className="sr-only">Search users</span>
                <input type="search" placeholder="Search by username, name or email" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className={inputClass} />
              </label>
              {users.length === 0 ? (
                <p className="text-muted">No users yet.</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-muted">No users match “{userSearch}”.</p>
              ) : (
                <ul className="space-y-2">
                  {filteredUsers.map((u) => (
                    <li key={u.id} className="rounded-card border border-line bg-surface p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {u.username}
                            {u.role === "admin" && <span className="ml-2 rounded-full bg-highlight px-2 py-0.5 text-xs font-bold text-on-highlight">Admin</span>}
                          </p>
                          <p className="truncate text-sm text-subtle">{[`${u.first_name || ""} ${u.last_name || ""}`.trim(), u.email].filter(Boolean).join(", ") || "No email"}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-4 text-sm font-semibold">
                          <button type="button" onClick={() => toggleRole(u)} className="underline decoration-highlight decoration-2 underline-offset-4">
                            {u.role === "admin" ? "Remove admin" : "Make admin"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setResetFor(resetFor === u.id ? null : u.id);
                              setResetPw("");
                            }}
                            aria-expanded={resetFor === u.id}
                            className="text-muted hover:text-text"
                          >
                            Reset password
                          </button>
                        </div>
                      </div>
                      {resetFor === u.id && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            resetUserPassword(u);
                          }}
                          className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-end"
                        >
                          <div className="flex-1">
                            <FieldLabel htmlFor={`reset-${u.id}`} hint="(at least 8 characters)">New password for {u.username}</FieldLabel>
                            <input id={`reset-${u.id}`} type="password" autoComplete="new-password" value={resetPw} onChange={(e) => setResetPw(e.target.value)} className={inputClass} autoFocus />
                          </div>
                          <button type="submit" className={primaryBtn}>
                            Set password
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
