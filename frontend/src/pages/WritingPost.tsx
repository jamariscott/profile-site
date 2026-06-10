import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../lib/config';
import PageNav from '../components/PageNav';

interface WritingPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  sponsor_logo?: string;
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

  const isSponsored = !!post.sponsor_logo;

  return (
    <div className="bg-white min-h-screen">
      <PageNav />
      <article className="pb-24">
        {/* Header */}
        <header className="max-w-3xl mx-auto px-6 mt-10 mb-8">
          {/* Sponsored badge */}
          {isSponsored && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold tracking-widest uppercase text-zinc-400 border border-zinc-200 px-3 py-1 rounded-full">
                Sponsored Content
              </span>
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 leading-tight mb-4">
            {post.title}
          </h1>
          {post.summary && (
            <p className="text-xl text-zinc-500 leading-relaxed mb-4">{post.summary}</p>
          )}
          <p className="text-sm text-zinc-400">{post.date}</p>
        </header>

        {/* Hero / sponsor image */}
        {post.sponsor_logo && (
          <div className="w-full mb-10" style={{ maxHeight: '520px', overflow: 'hidden' }}>
            <img
              src={post.sponsor_logo}
              alt={post.title}
              className="w-full object-cover"
              style={{ maxHeight: '520px' }}
            />
          </div>
        )}

        {/* Article body */}
        <div
          className="max-w-3xl mx-auto px-6 prose prose-zinc prose-lg max-w-none
            prose-headings:font-bold prose-headings:text-zinc-900
            prose-p:text-zinc-700 prose-p:leading-relaxed
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-2xl prose-img:shadow-md prose-img:my-8 prose-img:w-full
            prose-blockquote:border-l-4 prose-blockquote:border-zinc-300 prose-blockquote:text-zinc-500 prose-blockquote:italic
            prose-strong:text-zinc-900
            prose-code:bg-zinc-100 prose-code:rounded prose-code:px-1"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Sponsor attribution footer */}
        {isSponsored && (
          <div className="max-w-3xl mx-auto px-6 mt-16">
            <div className="border-t border-zinc-100 pt-8 flex items-center gap-6">
              <img
                src={post.sponsor_logo}
                alt="Sponsor"
                className="h-12 w-auto object-contain rounded-lg"
              />
              <p className="text-sm text-zinc-400 leading-relaxed">
                This article was created in partnership with our sponsor. Sponsored content is produced independently of editorial staff.
              </p>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}