import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_BASE } from '../lib/config';

interface WritingPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
}

export default function WritingPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<WritingPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_BASE}/api/writing/${slug}`)
      .then(res => res.json())
      .then(data => {
        setPost(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="max-w-6xl mx-auto p-8">Loading post...</div>;
  if (!post) return <div className="max-w-6xl mx-auto p-8">Post not found</div>;

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

      <article>
        <h1 className="text-5xl font-bold text-zinc-900 mb-4">{post.title}</h1>
        <p className="text-zinc-500 mb-10">{post.date}</p>
        <div
          className="prose prose-zinc max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}