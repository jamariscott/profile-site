import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import SiteNav from '../components/SiteNav';
import { apiFetch, apiJson } from '../lib/api';
import { useAuth, setSession, clearSession, type AuthSession } from '../lib/auth';

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

export default function Admin() {
  const session = useAuth();
  const isAdmin = session?.user.role === 'admin';

  type AdminTab = 'comments' | 'users' | 'articles';
  const ADMIN_TABS: { id: AdminTab; label: string }[] = [
    { id: 'comments', label: 'Comments' },
    { id: 'users', label: 'Users' },
    { id: 'articles', label: 'Articles' },
  ];
  const [tab, setTab] = useState<AdminTab>('comments');

  const [posts, setPosts] = useState<WritingPost[]>([]);
  const [comments, setComments] = useState<PendingComment[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // login form
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [newPost, setNewPost] = useState({
    title: '',
    summary: '',
    content: '',
    postToX: false,
    sponsorLogo: ''
  });
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setNewPost(p => ({ ...p, sponsorLogo: reader.result as string }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // === DATA LOADERS ===
  const loadPosts = async () => {
    try {
      const data = await apiJson<WritingPost[]>('/api/admin/writing');
      setPosts(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadComments = async () => {
    try {
      const data = await apiJson<PendingComment[]>('/api/admin/comments?status=pending');
      setComments(data);
    } catch {
      /* ignore */
    }
  };

  const loadUsers = async () => {
    try {
      const data = await apiJson<AdminUser[]>('/api/admin/users');
      setUsers(data);
    } catch {
      /* ignore */
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

  // === AUTH ===
  const handleLogin = async () => {
    if (!identifier || !password) {
      setError('Please enter your username/email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiJson<AuthSession>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      setSession(data);
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setPosts([]);
    setComments([]);
  };

  // === ARTICLES ===
  const createPost = async () => {
    if (!newPost.title || !newPost.content) {
      alert('Title and content are required');
      return;
    }
    try {
      const res = await apiFetch('/api/admin/writing', {
        method: 'POST',
        body: JSON.stringify(newPost),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to create post');

      if (data.x_error) {
        alert(`Article created, but failed to post to X:\n${data.x_error}`);
      } else if (data.x) {
        alert(`Article created and posted to X!\n${data.x.tweet_url}`);
      } else {
        alert('Article created successfully!');
      }

      setNewPost({ title: '', summary: '', content: '', postToX: false, sponsorLogo: '' });
      loadPosts();
    } catch (err: any) {
      alert(err.message || 'Failed to create post');
    }
  };

  const publishToX = async (slug: string) => {
    if (!confirm('Publish this post to X.com now?')) return;
    try {
      const res = await apiFetch(`/api/admin/publish-to-x/${slug}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to publish');
      alert('Marked as posted to X');
      loadPosts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deletePost = async (slug: string, title: string) => {
    if (!confirm(`Delete "${title}" permanently? This cannot be undone.`)) return;
    try {
      const res = await apiFetch(`/api/admin/writing/${slug}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Post deleted successfully');
        loadPosts();
      } else {
        alert('Failed to delete post');
      }
    } catch {
      alert('Error deleting post');
    }
  };

  // === COMMENT MODERATION ===
  const approveComment = async (id: number) => {
    try {
      const res = await apiFetch(`/api/admin/comments/${id}/approve`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to approve');
      loadComments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteComment = async (id: number) => {
    if (!confirm('Delete this comment?')) return;
    try {
      const res = await apiFetch(`/api/admin/comments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      loadComments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // === USER MANAGEMENT ===
  const toggleRole = async (u: AdminUser) => {
    const nextRole = u.role === 'admin' ? 'member' : 'admin';
    if (!confirm(`${nextRole === 'admin' ? 'Promote' : 'Demote'} ${u.username} to ${nextRole}?`)) return;
    try {
      const res = await apiFetch(`/api/admin/users/${u.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetUserPassword = async (u: AdminUser) => {
    const newPassword = prompt(`New password for ${u.username}:`);
    if (!newPassword) return;
    try {
      const res = await apiFetch(`/api/admin/users/${u.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword }),
      });
      if (!res.ok) throw new Error('Failed to reset password');
      alert(`Password reset for ${u.username}.`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      name.includes(q)
    );
  });

  // === RENDER: not logged in ===
  if (!session) {
    return (
      <div className="bg-bg min-h-screen">
        <SiteNav />
        <div className="max-w-md mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold text-text mb-6">Admin Login</h1>
          <input
            type="text"
            placeholder="Username or email"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            className="border border-line bg-surface text-text p-4 w-full rounded-btn text-lg mb-4"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-line bg-surface text-text p-4 w-full rounded-btn text-lg mb-4"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-accent text-accent-contrast px-8 py-4 rounded-btn w-full text-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {error && <p className="text-danger mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  // === RENDER: logged in but not admin ===
  if (!isAdmin) {
    return (
      <div className="bg-bg min-h-screen">
        <SiteNav />
        <div className="max-w-md mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-text mb-3">Admins only</h1>
          <p className="text-muted mb-6">
            You're logged in as <strong>{session.user.username}</strong>, but this area is restricted to admins.
          </p>
          <Link to="/account" className="text-accent hover:text-accent-hover font-medium">
            Go to your account →
          </Link>
        </div>
      </div>
    );
  }

  // === RENDER: admin ===
  return (
    <div className="bg-bg min-h-screen">
      <SiteNav />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-text">Admin Panel</h1>
          <button onClick={handleLogout} className="text-sm text-muted hover:text-text transition-colors">
            Log out
          </button>
        </div>

        {error && <p className="text-danger mb-6 p-4 bg-surface-2 rounded-btn">{error}</p>}

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-line mb-8">
          {ADMIN_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id ? 'border-accent text-text' : 'border-transparent text-muted hover:text-text'
              }`}
            >
              {t.label}
              {t.id === 'comments' && comments.length > 0 && <span className="text-accent ml-1">({comments.length})</span>}
            </button>
          ))}
        </div>

        {/* Pending comments */}
        {tab === 'comments' && (
        <div className="border border-line rounded-card p-6 mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-text">
              Pending Comments {comments.length > 0 && <span className="text-accent">({comments.length})</span>}
            </h2>
            <button onClick={loadComments} className="text-sm text-muted hover:text-text">Refresh</button>
          </div>
          {comments.length === 0 ? (
            <p className="text-muted text-sm">No comments awaiting review.</p>
          ) : (
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="border border-line rounded-btn p-4">
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="text-text font-medium">{c.author}</span>
                    <span className="text-subtle">on {c.writing_slug}</span>
                  </div>
                  <p className="text-text text-sm whitespace-pre-wrap mb-3">{c.body}</p>
                  <div className="flex gap-4">
                    <button onClick={() => approveComment(c.id)} className="text-success text-sm font-medium hover:opacity-80">
                      Approve
                    </button>
                    <button onClick={() => deleteComment(c.id)} className="text-danger text-sm font-medium hover:opacity-80">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Users */}
        {tab === 'users' && (
        <div className="border border-line rounded-card p-6 mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-text">Users</h2>
            <button onClick={loadUsers} className="text-sm text-muted hover:text-text">Refresh</button>
          </div>
          <input
            type="text"
            placeholder="Search by username, name, or email…"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="border border-line bg-surface text-text p-2.5 w-full rounded-btn text-sm mb-4"
          />
          {users.length === 0 ? (
            <p className="text-muted text-sm">No users found.</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-muted text-sm">No users match "{userSearch}".</p>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between gap-3 border border-line rounded-btn p-3">
                  <div className="min-w-0">
                    <span className="text-text text-sm font-medium">{u.username}</span>
                    <span className="text-subtle text-xs block truncate">{u.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${u.role === 'admin' ? 'text-success border border-success/40' : 'text-muted border border-line'}`}>
                      {u.role}
                    </span>
                    <button onClick={() => toggleRole(u)} className="text-accent hover:text-accent-hover text-sm whitespace-nowrap">
                      {u.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                    <button onClick={() => resetUserPassword(u)} className="text-muted hover:text-text text-sm whitespace-nowrap">
                      Reset password
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Create new post */}
        {tab === 'articles' && (<>
        <div className="border border-line rounded-card p-6 mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-text">Create New Article</h2>

          <label className="block text-sm font-medium text-muted mb-1">Title</label>
          <input type="text" placeholder="Article title..." value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="border border-line bg-surface text-text p-3 w-full rounded-btn mb-4 text-lg font-medium" />

          <label className="block text-sm font-medium text-muted mb-1">Summary <span className="text-subtle font-normal">(shown as subtitle)</span></label>
          <input type="text" placeholder="A short description of the article..." value={newPost.summary} onChange={e => setNewPost({...newPost, summary: e.target.value})} className="border border-line bg-surface text-text p-3 w-full rounded-btn mb-4" />

          <label className="block text-sm font-medium text-muted mb-1">Sponsor Image <span className="text-subtle font-normal">(adds "Sponsored Content" badge + hero image + footer attribution)</span></label>
          <div className="flex gap-2 mb-2">
            <input type="url" placeholder="Paste image URL..." value={newPost.sponsorLogo.startsWith('data:') ? '' : newPost.sponsorLogo} onChange={e => setNewPost({...newPost, sponsorLogo: e.target.value})} className="border border-line bg-surface text-text p-3 flex-1 rounded-btn" />
            <button type="button" onClick={() => coverImageInputRef.current?.click()} className="px-4 py-3 border border-line rounded-btn text-sm text-muted hover:bg-surface-2 whitespace-nowrap">
              📁 Upload from device
            </button>
            <input ref={coverImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
          </div>
          {newPost.sponsorLogo && (
            <div className="mb-4 rounded-card overflow-hidden border border-line h-48">
              <img src={newPost.sponsorLogo} alt="Cover preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
          {!newPost.sponsorLogo && <div className="mb-4" />}

          <label className="block text-sm font-medium text-muted mb-1">Content</label>
          <div className="mb-6">
            <RichTextEditor
              value={newPost.content}
              onChange={content => setNewPost({...newPost, content})}
              placeholder="Write your article here..."
            />
          </div>

          <label className="flex items-center gap-2 text-sm mb-6 cursor-pointer text-text">
            <input type="checkbox" checked={newPost.postToX} onChange={e => setNewPost({...newPost, postToX: e.target.checked})} className="w-4 h-4" />
            Also post to X.com
          </label>

          <button onClick={createPost} className="bg-accent text-accent-contrast px-8 py-4 rounded-btn text-base font-medium w-full">Publish Article</button>
        </div>

        {/* Existing posts */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-text">Existing Articles</h2>
          <button onClick={loadPosts} className="text-sm text-muted hover:text-text">Refresh</button>
        </div>

        <div className="space-y-4">
          {posts.length === 0 && <p className="text-muted">No posts yet.</p>}
          {posts.map(post => (
            <div key={post.slug} className="border border-line rounded-card p-6 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-text">{post.title}</h3>
                <p className="text-sm text-muted">{post.date}</p>
              </div>
              <div className="flex items-center gap-4">
                {post.x_posted ? (
                  <span className="text-success text-sm">Posted to X</span>
                ) : (
                  <button
                    onClick={() => publishToX(post.slug)}
                    className="text-accent hover:text-accent-hover text-sm"
                  >
                    Publish to X now
                  </button>
                )}
                <button
                  onClick={() => deletePost(post.slug, post.title)}
                  className="text-danger hover:opacity-80 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        </>)}
      </div>
    </div>
  );
}
