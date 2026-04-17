import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../lib/config';

export default function Writing() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching from:", `${API_BASE}/api/writing`); // debug

      const res = await fetch(`${API_BASE}/api/writing`, { cache: 'no-store' });

      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      console.log("📥 Received", data.length, "articles from database");

      setPosts(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    // Auto-refresh every 8 seconds
    const interval = setInterval(fetchPosts, 8000);

    return () => clearInterval(interval);
  }, []);

  if (loading && posts.length === 0) {
    return <div className="max-w-4xl mx-auto p-8">Loading articles...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 bg-white min-h-screen">
      <div className="flex justify-between items-baseline mb-10">
        <h1 className="text-5xl font-bold text-zinc-900">Writing</h1>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchPosts}
            className="flex items-center gap-2 px-5 py-2 bg-white border border-zinc-200 hover:border-zinc-300 rounded-3xl text-sm transition-colors"
          >
            ↻ Refresh
          </button>
          <span className="text-xs text-zinc-400">Updated {lastUpdated}</span>
        </div>
      </div>

      <div className="space-y-12">
        {posts.length === 0 ? (
          <p className="text-zinc-400 text-center py-12">No articles yet.</p>
        ) : (
          posts.map((post) => (
            <div key={post.slug} className="border border-zinc-200 rounded-3xl p-8 hover:shadow-md transition-shadow">
              <Link to={`/writing/${post.slug}`} className="block group">
                <h2 className="text-3xl font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
              </Link>
              <p className="text-zinc-400 mt-2">{post.date}</p>
              <p className="text-zinc-600 mt-6 leading-relaxed line-clamp-3">
                {post.summary || (post.content ? post.content.substring(0, 200) + '...' : '')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}