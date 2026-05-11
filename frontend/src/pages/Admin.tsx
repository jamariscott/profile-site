import { useState } from 'react';
import { API_BASE } from '../lib/config';

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [newPost, setNewPost] = useState({
    title: '',
    summary: '',
    content: '',
    postToX: false,
    sponsorLogo: ''
  });

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

      // Login successful
      setIsLoggedIn(true);
      loadPosts(); // load posts right after login
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

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

      if (!res.ok) throw new Error('Failed to create post');

      alert('Article created successfully!');
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
            className="border p-4 w-full rounded-3xl text-lg mb-4"
          />
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border p-4 w-full rounded-3xl text-lg mb-4"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-zinc-900 text-white px-8 py-4 rounded-3xl w-full text-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {error && <p className="text-red-600 mt-4">{error}</p>}
        </div>
      ) : (
        <div>
          {error && <p className="text-red-600 mb-6 p-4 bg-red-50 rounded-2xl">{error}</p>}

          {/* Create new post */}
          <div className="border border-zinc-200 rounded-3xl p-6 mb-10">
            <h2 className="text-2xl font-semibold mb-4">Create New Article</h2>
            <input type="text" placeholder="Title" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="border p-3 w-full rounded-2xl mb-3" />
            <input type="text" placeholder="Summary" value={newPost.summary} onChange={e => setNewPost({...newPost, summary: e.target.value})} className="border p-3 w-full rounded-2xl mb-3" />
            <textarea placeholder="Content" value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="border p-3 w-full rounded-2xl h-40 mb-4" />

            <label className="flex items-center gap-2 text-sm mb-4">
              <input type="checkbox" checked={newPost.postToX} onChange={e => setNewPost({...newPost, postToX: e.target.checked})} />
              Also post to X.com
            </label>

            <input type="text" placeholder="Sponsor logo URL (optional)" value={newPost.sponsorLogo} onChange={e => setNewPost({...newPost, sponsorLogo: e.target.value})} className="border p-3 w-full rounded-2xl mb-6" />

            <button onClick={createPost} className="bg-black text-white px-8 py-4 rounded-2xl">Create Article</button>
          </div>

          {/* Existing posts */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Existing Articles</h2>
            <button onClick={loadPosts} className="text-sm text-zinc-500 hover:text-zinc-700">Refresh</button>
          </div>

          <div className="space-y-4">
            {posts.length === 0 && <p className="text-zinc-500">No posts yet.</p>}
            {posts.map(post => (
              <div key={post.slug} className="border border-zinc-200 rounded-3xl p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="text-sm text-zinc-500">{post.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  {post.x_posted ? (
                    <span className="text-green-600 text-sm">Posted to X</span>
                  ) : (
                    <button 
                      onClick={() => publishToX(post.slug)} 
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Publish to X now
                    </button>
                  )}
                  
                  <button
                    onClick={async () => {
                      if (confirm(`Delete "${post.title}" permanently?`)) {
                        try {
                          const res = await fetch(`${API_BASE}/api/admin/writing/${post.slug}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username, password })
                          });
                          if (res.ok) {
                            alert('Post deleted');
                            loadPosts();
                          } else {
                            alert('Failed to delete');
                          }
                        } catch (err) {
                          alert('Error deleting post');
                        }
                      }
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>