import { useState } from 'react';
import { API_BASE } from '../lib/config';

interface WritingPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  x_posted: boolean;
  x_tweet_id?: string;
}

export default function Admin() {
  const [posts, setPosts] = useState<WritingPost[]>([]);
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/writing?password=${password}`);
      if (!res.ok) throw new Error('Wrong password or server error');
      const data = await res.json();
      setPosts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load posts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    // ... (I'll add this in the next message if needed)
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

      {!isLoggedIn ? (
        <div className="max-w-md">
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border p-4 w-full rounded-3xl text-lg mb-4"
          />
          <button
            onClick={() => { setIsLoggedIn(true); loadPosts(); }}
            className="bg-zinc-900 text-white px-8 py-4 rounded-3xl w-full text-lg font-medium"
          >
            Login
          </button>
        </div>
      ) : (
        <div>
          {error && <p className="text-red-600 mb-4">{error}</p>}
          {loading && <p className="text-zinc-500">Loading posts...</p>}

          {/* Create new post section */}
          <div className="border border-zinc-200 rounded-3xl p-6 mb-10">
            <h2 className="text-2xl font-semibold mb-4">Create New Article</h2>
            {/* ... we'll add the full form in the next step if you want it */}
            <p className="text-zinc-400">Create form will go here (next step)</p>
          </div>

          {/* Posts list */}
          <h2 className="text-2xl font-semibold mb-4">Existing Articles</h2>
          {posts.length === 0 ? (
            <p className="text-zinc-400">No posts yet.</p>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.slug} className="border border-zinc-200 rounded-3xl p-6">
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="text-sm text-zinc-500">{post.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}