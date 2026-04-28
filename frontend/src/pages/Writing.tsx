import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../lib/config';

interface WritingPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
}

export default function Writing() {
  const [posts, setPosts] = useState<WritingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/writing`)
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="max-w-6xl mx-auto p-8">Loading writing...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 bg-white min-h-screen">
      {/* Back to Home */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors text-sm"
        >
          ← Back to Home
        </Link>
      </div>

      <h1 className="text-5xl font-bold text-zinc-900 mb-10">Writing</h1>

      <div className="space-y-8">
        {posts.map((post) => (
          <Link
            key={post.slug}
            to={`/writing/${post.slug}`}
            className="block group"
          >
            <div className="flex justify-between items-baseline">
              <h2 className="text-2xl font-semibold text-zinc-900 group-hover:text-zinc-700 transition-colors">
                {post.title}
              </h2>
              <span className="text-sm text-zinc-500">{post.date}</span>
            </div>
            <p className="text-zinc-600 mt-2 line-clamp-3">{post.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}