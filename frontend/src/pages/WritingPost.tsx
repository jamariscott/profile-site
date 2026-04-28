import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE } from '../lib/config';

export default function WritingPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  if (loading) return <div className="max-w-4xl mx-auto p-8">Loading post...</div>;
  if (!post || post.error) return <div className="max-w-4xl mx-auto p-8">Post not found</div>;

  return (
<div className="mb-8">
  <Link
    to="/"
    className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors text-sm"
  >
    ← Back to Home
  </Link>
</div>
    <div className="max-w-4xl mx-auto px-6 py-12 bg-white min-h-screen">
      {/* Back link - matches list page style */}
      <Link 
        to="/writing" 
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 font-medium"
      >
        ← Back to Writing
      </Link>

      {/* Card container - matches the list page aesthetic */}
      <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-10">
        <h1 className="text-5xl font-bold text-zinc-900 tracking-tight mb-4">
          {post.title}
        </h1>
        
        <p className="text-zinc-500 text-lg mb-12">
          {post.date}
        </p>

        {/* Article content */}
        <div 
          className="prose prose-zinc max-w-none text-lg leading-relaxed text-zinc-800"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </div>
  );
}