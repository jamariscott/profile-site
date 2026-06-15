import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../lib/config';
import PageNav from '../components/PageNav';
import Comments from '../components/Comments';

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
    <div className="bg-bg min-h-screen">
      <PageNav />
      <article className="pb-24">
        {/* Header */}
        <header className="max-w-3xl mx-auto px-6 mt-10 mb-8">
          {/* Sponsored badge */}
          {isSponsored && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold tracking-widest uppercase text-subtle border border-line px-3 py-1 rounded-full">
                Sponsored Content
              </span>
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-bold text-text leading-tight mb-4">
            {post.title}
          </h1>
          {post.summary && (
            <p className="text-xl text-muted leading-relaxed mb-4">{post.summary}</p>
          )}
          <p className="text-sm text-subtle">{post.date}</p>
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
          className="max-w-3xl mx-auto px-6 prose prose-lg max-w-none
            prose-headings:font-bold prose-p:leading-relaxed
            prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-2xl prose-img:shadow-md prose-img:my-8 prose-img:w-full
            prose-blockquote:border-l-4 prose-blockquote:italic
            prose-code:bg-surface-2 prose-code:rounded prose-code:px-1"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Sponsor attribution footer */}
        {isSponsored && (
          <div className="max-w-3xl mx-auto px-6 mt-16">
            <div className="border-t border-line pt-8 flex items-center gap-6">
              <img
                src={post.sponsor_logo}
                alt="Sponsor"
                className="h-12 w-auto object-contain rounded-lg"
              />
              <p className="text-sm text-subtle leading-relaxed">
                This article was created in partnership with our sponsor. Sponsored content is produced independently of editorial staff.
              </p>
            </div>
          </div>
        )}

        <Comments slug={post.slug} />
      </article>
    </div>
  );
}