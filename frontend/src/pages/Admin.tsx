import { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../lib/config';
import RichTextEditor from '../components/RichTextEditor';
import { getAdminSession, setAdminSession, clearAdminSession } from '../lib/auth';

interface WritingPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  x_posted: boolean;
}

export default function Admin() {
  const [posts, setPosts] = useState<WritingPost[]>([]);
  const [username, setUsername] = useState(() => getAdminSession()?.username ?? '');
  const [password, setPassword] = useState(() => getAdminSession()?.password ?? '');
  const [isLoggedIn, setIsLoggedIn] = useState(() => getAdminSession() !== null);
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

  // === LOGIN ===
  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      setAdminSession({ username, password });
      setIsLoggedIn(true);
      loadPosts();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setIsLoggedIn(false);
    setPassword('');
    setPosts([]);
  };

  // If a stored session exists, load posts on mount.
  useEffect(() => {
    if (isLoggedIn) loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === LOAD POSTS ===
  const loadPosts = async () => {
    setError('');
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/writing?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
      );
      if (!res.ok) throw new Error('Failed to load posts');
      const data = await res.json();
      setPosts(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // === CREATE POST ===
  const createPost = async () => {
    if (!newPost.title || !newPost.content) {
      alert("Title and content are required");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPost,
          username,
          password
        }),
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

  // === PUBLISH TO X ===
  const publishToX = async (slug: string) => {
    if (!confirm('Publish this post to X.com now?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/publish-to-x/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error('Failed to publish');
      alert('Marked as posted to X');
      loadPosts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // === DELETE POST ===
  const deletePost = async (slug: string, title: string) => {
    if (!confirm(`Delete "${title}" permanently? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/writing/${slug}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        alert('Post deleted successfully');
        loadPosts();
      } else {
        alert('Failed to delete post');
      }
    } catch (err) {
      alert('Error deleting post');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

      {!isLoggedIn ? (
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="border border-line bg-surface text-text p-4 w-full rounded-btn text-lg mb-4"
          />
          <input
            type="password"
            placeholder="Enter admin password"
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
      ) : (
        <div>
          <div className="flex justify-end mb-6">
            <button onClick={handleLogout} className="text-sm text-muted hover:text-text transition-colors">
              Log out
            </button>
          </div>
          {error && <p className="text-danger mb-6 p-4 bg-surface-2 rounded-btn">{error}</p>}

          {/* Create new post */}
          <div className="border border-line rounded-card p-6 mb-10">
            <h2 className="text-2xl font-semibold mb-6">Create New Article</h2>

            {/* Title */}
            <label className="block text-sm font-medium text-muted mb-1">Title</label>
            <input type="text" placeholder="Article title..." value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="border border-line bg-surface text-text p-3 w-full rounded-btn mb-4 text-lg font-medium" />

            {/* Summary */}
            <label className="block text-sm font-medium text-muted mb-1">Summary <span className="text-subtle font-normal">(shown as subtitle)</span></label>
            <input type="text" placeholder="A short description of the article..." value={newPost.summary} onChange={e => setNewPost({...newPost, summary: e.target.value})} className="border border-line bg-surface text-text p-3 w-full rounded-btn mb-4" />

            {/* Sponsor */}
            <label className="block text-sm font-medium text-muted mb-1">Sponsor Image <span className="text-subtle font-normal">(adds "Sponsored Content" badge + hero image + footer attribution)</span></label>
            <div className="flex gap-2 mb-2">
              <input type="url" placeholder="Paste image URL..." value={newPost.sponsorLogo.startsWith('data:') ? '' : newPost.sponsorLogo} onChange={e => setNewPost({...newPost, sponsorLogo: e.target.value})} className="border border-line bg-surface text-text p-3 flex-1 rounded-btn" />
              <button type="button" onClick={() => coverImageInputRef.current?.click()} className="px-4 py-3 border border-line rounded-2xl text-sm text-muted hover:bg-surface-2 whitespace-nowrap">
                📁 Upload from device
              </button>
              <input ref={coverImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
            </div>
            {newPost.sponsorLogo && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-line h-48">
                <img src={newPost.sponsorLogo} alt="Cover preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
            {!newPost.sponsorLogo && <div className="mb-4" />}

            {/* Content */}
            <label className="block text-sm font-medium text-muted mb-1">Content</label>
            <div className="mb-6">
              <RichTextEditor
                value={newPost.content}
                onChange={content => setNewPost({...newPost, content})}
                placeholder="Write your article here..."
              />
            </div>

            {/* Post to X */}
            <label className="flex items-center gap-2 text-sm mb-6 cursor-pointer">
              <input type="checkbox" checked={newPost.postToX} onChange={e => setNewPost({...newPost, postToX: e.target.checked})} className="w-4 h-4" />
              Also post to X.com
            </label>

            <button onClick={createPost} className="bg-accent text-accent-contrast px-8 py-4 rounded-2xl text-base font-medium w-full">Publish Article</button>
          </div>

          {/* Existing posts */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Existing Articles</h2>
            <button onClick={loadPosts} className="text-sm text-muted hover:text-muted">Refresh</button>
          </div>

          <div className="space-y-4">
            {posts.length === 0 && <p className="text-muted">No posts yet.</p>}
            {posts.map(post => (
              <div key={post.slug} className="border border-line rounded-card p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{post.title}</h3>
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
                    className="text-danger hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}