import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../lib/config';
import PageNav from '../components/PageNav';

interface WritingPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  x_posted: boolean;
  sponsor_logo?: string;
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

  if (loading) return <div className="max-w-4xl mx-auto p-8">Loading writing...</div>;

  return (
    <div className="bg-white min-h-screen">
      <PageNav />
      <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-5xl font-bold text-zinc-900 mb-10">Writing</h1>

      <div className="space-y-8">
        {posts.map((post) => (
          <Link
            key={post.slug}
            to={`/writing/${post.slug}`}
            className="block group"
          >
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-zinc-900 group-hover:text-zinc-700 transition-colors">
                  {post.title}
                </h2>
                {post.sponsor_logo && (
                  <span className="text-xs font-semibold tracking-widest uppercase text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded-full">
                    Sponsored
                  </span>
                )}
              </div>
              <span className="text-sm text-zinc-500 shrink-0 ml-4">{post.date}</span>
            </div>
            <p className="text-zinc-600 mt-2 line-clamp-3">{post.summary}</p>
          </Link>
        ))}
      </div>
      </div>
    </div>
  );
}